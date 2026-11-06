import { AsyncLocalStorage } from "node:async_hooks"
import { randomUUID } from "node:crypto"
import { after } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import { costUsd, type TokenUsage } from "@/lib/ai/pricing"
import { pluralizeLt } from "@/lib/utils"

/**
 * DI accounting and limits.
 *
 * Every Claude call made while a request runs is recorded in ai_usage with
 * its cost (see getAnthropicClient). A teacher action is one request_id, so
 * "generate three tasks and verify each" counts once against the personal
 * monthly limit. The platform budget stops DI for everyone when the month's
 * spend reaches it; the super admin is never blocked, only recorded.
 */

export interface AiContext {
  userId: string
  requestId: string
  endpoint: string
  /** Model calls made so far; an action that made none is not counted. */
  modelCalls?: number
}

export const aiContext = new AsyncLocalStorage<AiContext>()

/** Call synchronously in the route handler, after the allowance check. */
export function enterAiContext(ctx: AiContext): void {
  aiContext.enterWith(ctx)
}

export interface AiSettings {
  ai_monthly_budget_usd: number
  ai_user_monthly_limit: number
  ai_budget_alert_ratio: number
}

const DEFAULT_SETTINGS: AiSettings = {
  ai_monthly_budget_usd: 50,
  ai_user_monthly_limit: 40,
  ai_budget_alert_ratio: 0.8,
}

/** Months run in UTC; the two or three hours' shift from Vilnius time does not matter for a budget. */
export function monthStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

export function nextMonthStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
}

const MONTHS_GENITIVE = [
  "sausio", "vasario", "kovo", "balandžio", "gegužės", "birželio",
  "liepos", "rugpjūčio", "rugsėjo", "spalio", "lapkričio", "gruodžio",
]

/** "gruodžio 1 d." */
export function resetsOnText(now = new Date()): string {
  return `${MONTHS_GENITIVE[nextMonthStart(now).getUTCMonth()]} 1 d.`
}

export function monthGenitive(now = new Date()): string {
  return MONTHS_GENITIVE[now.getUTCMonth()]
}

/**
 * The defaults apply only when the settings row is missing. A failed read
 * throws, so the caller's own failure rule applies (the allowance check
 * fails open) instead of limits that nobody configured.
 */
export async function loadAiSettings(admin: SupabaseClient): Promise<AiSettings> {
  const { data, error } = await admin
    .from("platform_settings")
    .select("ai_monthly_budget_usd, ai_user_monthly_limit, ai_budget_alert_ratio")
    .maybeSingle()
  if (error) throw error
  if (!data) return DEFAULT_SETTINGS
  return {
    ai_monthly_budget_usd: Number(data.ai_monthly_budget_usd),
    ai_user_monthly_limit: Number(data.ai_user_monthly_limit),
    ai_budget_alert_ratio: Number(data.ai_budget_alert_ratio),
  }
}

// The month's spend, cached briefly per server instance: every DI action
// reads it, and a minute of lag is fine for a monthly budget. A usage row
// written by this instance drops the cache, and a scan that was already
// running when that happened does not store its total, so the cache never
// misses or double-counts a cost this instance recorded.
let spendCache: { month: number; usd: number; at: number } | null = null
let spendGeneration = 0
const SPEND_TTL_MS = 60_000

function invalidateSpendCache() {
  spendGeneration += 1
  spendCache = null
}

export async function monthSpendUsd(admin: SupabaseClient, now = new Date(), fresh = false): Promise<number> {
  const month = monthStart(now).getTime()
  if (!fresh && spendCache && spendCache.month === month && Date.now() - spendCache.at < SPEND_TTL_MS) {
    return spendCache.usd
  }
  const generation = spendGeneration
  const rows = await allRowsById<{ id: number; cost_usd: number | string }>(() =>
    admin
      .from("ai_usage")
      .select("id, cost_usd")
      .gte("created_at", new Date(month).toISOString())
      .lt("created_at", nextMonthStart(now).toISOString()),
  )
  const total = sumUsd(rows.map((row) => row.cost_usd))
  if (generation === spendGeneration) spendCache = { month, usd: total, at: Date.now() }
  return total
}

/**
 * Adds costs stored with five decimals (numeric(10,5)) in whole
 * hundred-thousandths, so many small costs add up to the exact total and a
 * budget that has been reached compares as reached.
 */
export function sumUsd(costs: Iterable<number | string>): number {
  let units = 0
  for (const cost of costs) units += Math.round(Number(cost) * 100_000)
  return units / 100_000
}

/** Placeholder row that holds a limit slot while the action runs. */
export const RESERVATION_MODEL = "reservation"

/**
 * A reservation with no model call counts only while its request may still
 * be running. Longer than any DI route's maxDuration (300 s), so a request
 * that was killed before it could give its slot back stops counting.
 */
export const RESERVATION_TTL_MS = 15 * 60_000

type PageQuery = {
  gt: (column: string, value: number) => PageQuery
  order: (column: string, opts: { ascending: boolean }) => PageQuery
  limit: (n: number) => PromiseLike<{ data: unknown; error: unknown }>
}

/**
 * Every row of a query, read in pages by id (keyset, not offset): rows
 * deleted between two reads (a released reservation) cannot shift a page
 * and make the next one skip a row. The query must select "id".
 */
export async function allRowsById<T extends { id: number | string }>(build: () => unknown): Promise<T[]> {
  const rows: T[] = []
  const page = 1000
  let lastId: number | string | null = null
  for (;;) {
    let query = build() as PageQuery
    if (lastId !== null) query = query.gt("id", lastId)
    const { data, error } = await query.order("id", { ascending: true }).limit(page)
    if (error) throw error
    const batch = (data ?? []) as T[]
    rows.push(...batch)
    if (batch.length < page) break
    lastId = batch[batch.length - 1].id
  }
  return rows
}

/**
 * How many DI actions count against the person's limit this month. An
 * action is its reservation row: it belongs to the month it was reserved
 * in, and counts once a model call was recorded for it, or while it is
 * still in flight. With upToId, only reservations up to that id: the ones
 * that came before a new reservation, plus the reservation itself.
 */
export async function monthActionsByUser(
  admin: SupabaseClient,
  userId: string,
  now = new Date(),
  upToId?: number,
): Promise<number> {
  const since = monthStart(now).toISOString()
  const [reservations, calls] = await Promise.all([
    allRowsById<{ id: number; request_id: string; created_at: string }>(() => {
      let query = admin
        .from("ai_usage")
        .select("id, request_id, created_at")
        .eq("user_id", userId)
        .eq("model", RESERVATION_MODEL)
        .gte("created_at", since)
      if (upToId !== undefined) query = query.lte("id", upToId)
      return query
    }),
    allRowsById<{ id: number; request_id: string }>(() =>
      admin
        .from("ai_usage")
        .select("id, request_id")
        .eq("user_id", userId)
        .neq("model", RESERVATION_MODEL)
        .gte("created_at", since),
    ),
  ])
  const called = new Set(calls.map((c) => c.request_id))
  const inFlightSince = now.getTime() - RESERVATION_TTL_MS
  return reservations.filter(
    (r) => r.id === upToId || called.has(r.request_id) || new Date(r.created_at).getTime() >= inFlightSince,
  ).length
}

/**
 * Takes a limit slot for this action before any model call. The database
 * counts and inserts under a per-person lock (reserve_ai_action, migration
 * 20261106145000), so two requests at the last free slot cannot both pass.
 * The database takes the month from the reservation's own timestamp.
 * If the action ends without a model call (bad input, the model failed), the
 * slot is given back after the response; a request killed before that stops
 * counting after RESERVATION_TTL_MS.
 * Returns the actions used before this one, or null when the limit is full.
 */
async function reserveAction(
  admin: SupabaseClient,
  ctx: AiContext,
  limit: number,
): Promise<number | null> {
  const { data, error } = await admin.rpc("reserve_ai_action", {
    p_user_id: ctx.userId,
    p_request_id: ctx.requestId,
    p_endpoint: ctx.endpoint,
    p_limit: limit,
    p_in_flight_seconds: RESERVATION_TTL_MS / 1000,
  })
  if (error) throw error
  const used = Number(data)
  if (!Number.isFinite(used) || used < 0) return null
  after(async () => {
    if (ctx.modelCalls) return
    const { error: deleteError } = await admin
      .from("ai_usage")
      .delete()
      .eq("request_id", ctx.requestId)
      .eq("model", RESERVATION_MODEL)
    if (deleteError) console.error("[ai-usage] reservation release failed", { code: deleteError.code })
  })
  return used
}

export type AiAllowance =
  | {
      ok: true
      ctx: AiContext
      used: number
      limit: number | null
    }
  | { ok: false; code: "ai_user_limit" | "ai_budget"; message: string }

const veiksmas = (n: number) => `${n} ${pluralizeLt(n, "DI užklausa", "DI užklausos", "DI užklausų")}`

/**
 * Checks the personal monthly limit and the platform budget before a DI
 * action. Fails open (allows) if the accounting tables are unreachable, so
 * a database hiccup never takes DI down in the middle of a lesson.
 */
export async function checkAiAllowance(
  userId: string,
  endpoint: string,
  now = new Date(),
): Promise<AiAllowance> {
  const ctx: AiContext = { userId, endpoint, requestId: randomUUID() }
  try {
    const admin = createAdminClient()
    const [profileRes, settings] = await Promise.all([
      admin.from("profiles").select("role, ai_monthly_limit").eq("id", userId).maybeSingle(),
      loadAiSettings(admin),
    ])
    // A failed read must reach the fail-open path below, not look like a
    // profile without a personal limit.
    if (profileRes.error) throw profileRes.error
    const profile = profileRes.data
    if (profile?.role === "super_admin") return { ok: true, ctx, used: 0, limit: null }

    const spent = await monthSpendUsd(admin, now)
    // Another server may have pushed the month over a threshold; this read
    // (at most a minute old, from the database) makes sure the email goes.
    if (budgetLevel(spent, settings)) after(() => maybeSendBudgetAlert(admin, now))
    if (spent >= settings.ai_monthly_budget_usd) {
      return {
        ok: false,
        code: "ai_budget",
        message: `Šį mėnesį platformos DI biudžetas išnaudotas. DI funkcijos vėl veiks nuo ${resetsOnText(now)} Veiklos ir užduotys veikia kaip įprastai.`,
      }
    }
    const limit = profile?.ai_monthly_limit ?? settings.ai_user_monthly_limit
    const used = await reserveAction(admin, ctx, limit)
    if (used === null) {
      return {
        ok: false,
        code: "ai_user_limit",
        message: `Šį mėnesį jau panaudojote ${veiksmas(limit)}: tiek skirta vienam vedėjui. Limitas atsinaujins ${resetsOnText(now)} Jei reikia daugiau, parašykite steam@ku.lt.`,
      }
    }
    return { ok: true, ctx, used, limit }
  } catch (error) {
    console.error("[ai-usage] allowance check failed, allowing", {
      error: error instanceof Error ? error.message : "unknown",
    })
    return { ok: true, ctx, used: 0, limit: null }
  }
}

/**
 * Records one model call for the current request (called by the Anthropic
 * client wrapper). Never throws: losing one accounting row is better than
 * failing a teacher's DI action that already succeeded.
 */
export async function recordAiUsage(model: string, usage: TokenUsage | undefined): Promise<void> {
  const ctx = aiContext.getStore()
  if (!ctx) {
    console.warn("[ai-usage] model call outside an AI context", { model })
    return
  }
  ctx.modelCalls = (ctx.modelCalls ?? 0) + 1
  const cost = costUsd(model, usage ?? {})
  try {
    const admin = createAdminClient()
    const { error } = await admin.from("ai_usage").insert({
      user_id: ctx.userId,
      request_id: ctx.requestId,
      endpoint: ctx.endpoint,
      model,
      input_tokens: (usage?.input_tokens ?? 0) + (usage?.cache_creation_input_tokens ?? 0) + (usage?.cache_read_input_tokens ?? 0),
      output_tokens: usage?.output_tokens ?? 0,
      cost_usd: cost,
    })
    if (error) {
      console.error("[ai-usage] insert failed", { code: error.code })
      return
    }
    invalidateSpendCache()
    after(() => maybeSendBudgetAlert(admin))
  } catch (error) {
    console.error("[ai-usage] record failed", { error: error instanceof Error ? error.message : "unknown" })
  }
}

export type BudgetLevel = "alert" | "100"

export function budgetLevel(spentUsd: number, settings: AiSettings): BudgetLevel | null {
  if (settings.ai_monthly_budget_usd <= 0) return null
  const ratio = spentUsd / settings.ai_monthly_budget_usd
  return ratio >= 1 ? "100" : ratio >= settings.ai_budget_alert_ratio ? "alert" : null
}

const ALERT_ACTION = "ai_budget.alert"

/** A claim not marked delivered after this long belongs to a worker that died. */
const ALERT_CLAIM_TTL_MS = 10 * 60_000

/**
 * Whether this month's email for a level is out ("sent"), being sent right
 * now by another worker ("busy"), or still to send ("free"). A claim left
 * behind by a worker that stopped before delivery is removed, so the email
 * is retried.
 */
async function alertClaimState(admin: SupabaseClient, target: string, now: Date): Promise<"sent" | "busy" | "free"> {
  const { data, error } = await admin
    .from("admin_audit_log")
    .select("id, created_at, details")
    .eq("action", ALERT_ACTION)
    .eq("target_id", target)
    .limit(1)
  if (error) throw error
  const claim = data?.[0] as { id: number; created_at: string; details: { delivered?: boolean } | null } | undefined
  if (!claim) return "free"
  if (claim.details?.delivered) return "sent"
  if (now.getTime() - Date.parse(claim.created_at) < ALERT_CLAIM_TTL_MS) return "busy"
  await admin.from("admin_audit_log").delete().eq("id", claim.id).eq("action", ALERT_ACTION)
  return "free"
}

/**
 * Marks a claim delivered after its email went out. Retried, because a claim
 * left unmarked looks abandoned after ALERT_CLAIM_TTL_MS and the email would
 * be sent again; if every attempt fails, that one duplicate email is the
 * accepted cost (a lost alert would be worse).
 */
async function markAlertDelivered(admin: SupabaseClient, claimId: number, spent: number, budget: number) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await admin
      .from("admin_audit_log")
      .update({ details: { spent_usd: spent, budget_usd: budget, delivered: true } })
      .eq("id", claimId)
    if (!error) return
    console.error("[ai-usage] marking budget alert delivered failed", { attempt, code: error.code })
    if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 500))
  }
}

/**
 * Sends the 80 % and 100 % budget emails once per month each. Runs after
 * every recorded call, starting from the per-instance spend cache, and reads
 * the claims only once a threshold may have been crossed. The audit row is the
 * claim (unique per month and level, migration 20261106145000): it is
 * marked delivered after the email goes out, removed again if it could not
 * go out, and taken over after ten minutes if its worker stopped midway.
 */
export async function maybeSendBudgetAlert(admin: SupabaseClient, now = new Date()): Promise<void> {
  try {
    const settings = await loadAiSettings(admin)
    const monthKey = monthStart(now).toISOString().slice(0, 7)
    const cachedLevel = budgetLevel(await monthSpendUsd(admin, now), settings)
    if (!cachedLevel) return
    if ((await alertClaimState(admin, `${monthKey}:${cachedLevel}`, now)) !== "free") return

    const spent = await monthSpendUsd(admin, now, true)
    const level = budgetLevel(spent, settings)
    if (!level) return
    const target = `${monthKey}:${level}`
    if (level !== cachedLevel && (await alertClaimState(admin, target, now)) !== "free") return

    // The unique index (one row per month and level) is the claim: the
    // insert that wins sends, a second one fails with 23505.
    const { data: claim, error: claimError } = await admin
      .from("admin_audit_log")
      .insert({
        actor_id: null,
        action: ALERT_ACTION,
        target_type: "platform",
        target_id: target,
        details: { spent_usd: spent, budget_usd: settings.ai_monthly_budget_usd },
      })
      .select("id")
      .single()
    if (claimError || !claim) return
    const claimId = Number(claim.id)
    const release = async () => {
      await admin.from("admin_audit_log").delete().eq("id", claimId)
    }

    let delivered = false
    try {
      const [{ superAdminEmails }, { sendEmail }, { aiBudgetEmail }, top] = await Promise.all([
        import("@/lib/access/notify"),
        import("@/lib/email/send"),
        import("@/lib/email/templates"),
        topUsers(admin, now, 3),
      ])
      const to = await superAdminEmails(admin)
      if (to.length > 0) {
        const base = `https://${process.env.CANONICAL_CLASSROOM_HOST || "pamokos.kusteam.app"}`
        const result = await sendEmail(
          aiBudgetEmail(
            to,
            {
              spentUsd: spent,
              budgetUsd: settings.ai_monthly_budget_usd,
              monthGenitive: monthGenitive(now),
              resetsOn: resetsOnText(now),
              top: top.map((t) => ({ name: t.name, requests: t.actions, costUsd: t.costUsd })),
            },
            `${base}/admin/di`,
          ),
        )
        delivered = result.ok
        if (delivered) await markAlertDelivered(admin, claimId, spent, settings.ai_monthly_budget_usd)
      }
    } finally {
      if (!delivered) await release()
    }
  } catch (error) {
    console.error("[ai-usage] budget alert failed", { error: error instanceof Error ? error.message : "unknown" })
  }
}

export interface UserUsage {
  userId: string
  name: string
  email: string | null
  role: string | null
  actions: number
  calls: number
  costUsd: number
  limit: number | null
}

type ProfileInfo = { id: string; full_name: string | null; email: string | null; role: string | null; ai_monthly_limit: number | null }

/**
 * This month's usage per person, most expensive first. Every active account
 * is listed, also those who have not used DI yet, so the super admin can
 * set a personal limit before the first use.
 */
export async function usageByUser(admin: SupabaseClient, now = new Date()): Promise<UserUsage[]> {
  const rows = await allRowsById<{
    id: number
    user_id: string | null
    request_id: string
    endpoint: string
    model: string
    cost_usd: number
    created_at: string
  }>(() =>
    admin
      .from("ai_usage")
      .select("id, user_id, request_id, endpoint, model, cost_usd, created_at")
      .gte("created_at", monthStart(now).toISOString())
      .lt("created_at", nextMonthStart(now).toISOString()),
  )
  // Actions follow monthActionsByUser: a reservation that got a model call
  // or is still in flight. Requests without a reservation (super admins, or
  // a call made while the allowance check failed open) count by request id.
  // cost is kept in hundred-thousandths of a dollar (see sumUsd).
  type Acc = { reserved: Map<string, number>; called: Set<string>; calls: number; cost: number }
  const byUser = new Map<string, Acc>()
  for (const r of rows) {
    if (!r.user_id) continue
    const u = byUser.get(r.user_id) ?? { reserved: new Map(), called: new Set<string>(), calls: 0, cost: 0 }
    if (r.model === RESERVATION_MODEL) {
      u.reserved.set(r.request_id, new Date(r.created_at).getTime())
    } else {
      u.calls += 1
      u.called.add(r.request_id)
    }
    u.cost += Math.round(Number(r.cost_usd) * 100_000)
    byUser.set(r.user_id, u)
  }
  // A call this month whose reservation was made last month (an action
  // that ran across midnight on the 1st) belongs to last month.
  const orphanIds = new Set<string>()
  for (const u of byUser.values()) for (const id of u.called) if (!u.reserved.has(id)) orphanIds.add(id)
  const earlier = new Set<string>()
  const orphanList = Array.from(orphanIds)
  for (let i = 0; i < orphanList.length; i += 200) {
    const { data, error } = await admin
      .from("ai_usage")
      .select("request_id")
      .in("request_id", orphanList.slice(i, i + 200))
      .eq("model", RESERVATION_MODEL)
      .lt("created_at", monthStart(now).toISOString())
    if (error) throw error
    for (const r of data ?? []) earlier.add(r.request_id)
  }

  const inFlightSince = now.getTime() - RESERVATION_TTL_MS
  const actionsOf = (u: Acc) => {
    let n = 0
    for (const [requestId, at] of u.reserved) if (u.called.has(requestId) || at >= inFlightSince) n += 1
    for (const requestId of u.called) if (!u.reserved.has(requestId) && !earlier.has(requestId)) n += 1
    return n
  }

  const columns = "id, full_name, email, role, ai_monthly_limit"
  const active = await allRowsById<ProfileInfo>(() => admin.from("profiles").select(columns).eq("status", "active"))
  const info = new Map(active.map((p) => [p.id, p]))
  const missing = Array.from(byUser.keys()).filter((id) => !info.has(id))
  if (missing.length > 0) {
    const { data: others } = await admin.from("profiles").select(columns).in("id", missing)
    for (const p of (others ?? []) as ProfileInfo[]) info.set(p.id, p)
  }

  const ids = new Set<string>([...info.keys(), ...byUser.keys()])
  return Array.from(ids)
    .map((id) => {
      const u = byUser.get(id) ?? { reserved: new Map<string, number>(), called: new Set<string>(), calls: 0, cost: 0 }
      const p = info.get(id)
      return {
        userId: id,
        name: p?.full_name || p?.email || "Nežinomas",
        email: p?.email ?? null,
        role: p?.role ?? null,
        actions: actionsOf(u),
        calls: u.calls,
        costUsd: u.cost / 100_000,
        limit: p?.ai_monthly_limit ?? null,
      }
    })
    .sort((a, b) => b.costUsd - a.costUsd || b.actions - a.actions || a.name.localeCompare(b.name, "lt"))
}

async function topUsers(admin: SupabaseClient, now: Date, n: number): Promise<UserUsage[]> {
  return (await usageByUser(admin, now)).filter((u) => u.calls > 0).slice(0, n)
}
