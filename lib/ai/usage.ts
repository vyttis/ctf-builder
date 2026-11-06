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

export async function loadAiSettings(admin: SupabaseClient): Promise<AiSettings> {
  const { data } = await admin
    .from("platform_settings")
    .select("ai_monthly_budget_usd, ai_user_monthly_limit, ai_budget_alert_ratio")
    .maybeSingle()
  if (!data) return DEFAULT_SETTINGS
  return {
    ai_monthly_budget_usd: Number(data.ai_monthly_budget_usd),
    ai_user_monthly_limit: Number(data.ai_user_monthly_limit),
    ai_budget_alert_ratio: Number(data.ai_budget_alert_ratio),
  }
}

// The month's spend, cached briefly per server instance: every DI action
// reads it, and a minute of lag is fine for a monthly budget.
let spendCache: { month: number; usd: number; at: number } | null = null
const SPEND_TTL_MS = 60_000

export async function monthSpendUsd(admin: SupabaseClient, now = new Date(), fresh = false): Promise<number> {
  const month = monthStart(now).getTime()
  if (!fresh && spendCache && spendCache.month === month && Date.now() - spendCache.at < SPEND_TTL_MS) {
    return spendCache.usd
  }
  let total = 0
  const page = 1000
  for (let from = 0; ; from += page) {
    const { data, error } = await admin
      .from("ai_usage")
      .select("cost_usd")
      .gte("created_at", new Date(month).toISOString())
      .order("id", { ascending: true })
      .range(from, from + page - 1)
    if (error) throw error
    for (const row of data ?? []) total += Number(row.cost_usd)
    if (!data || data.length < page) break
  }
  spendCache = { month, usd: total, at: Date.now() }
  return total
}

/**
 * Checking a task again (di/verify) follows a generation the teacher already
 * paid for with one action, so it costs money but not a limit slot.
 */
export const UNCOUNTED_ENDPOINTS = ["di/verify"]

/** How many DI actions (distinct request ids) the person started this month. */
export async function monthActionsByUser(admin: SupabaseClient, userId: string, now = new Date()): Promise<number> {
  const { data, error } = await admin
    .from("ai_usage")
    .select("request_id")
    .eq("user_id", userId)
    .not("endpoint", "in", `(${UNCOUNTED_ENDPOINTS.join(",")})`)
    .gte("created_at", monthStart(now).toISOString())
    .limit(5000)
  if (error) throw error
  return new Set((data ?? []).map((r) => r.request_id)).size
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
  opts: { countsTowardLimit?: boolean } = {},
): Promise<AiAllowance> {
  const ctx: AiContext = { userId, endpoint, requestId: randomUUID() }
  try {
    const admin = createAdminClient()
    const [{ data: profile }, settings] = await Promise.all([
      admin.from("profiles").select("role, ai_monthly_limit").eq("id", userId).maybeSingle(),
      loadAiSettings(admin),
    ])
    if (profile?.role === "super_admin") return { ok: true, ctx, used: 0, limit: null }

    const [spent, used] = await Promise.all([monthSpendUsd(admin, now), monthActionsByUser(admin, userId, now)])
    if (spent >= settings.ai_monthly_budget_usd) {
      return {
        ok: false,
        code: "ai_budget",
        message: `Šį mėnesį platformos DI biudžetas išnaudotas. DI funkcijos vėl veiks nuo ${resetsOnText(now)} Veiklos ir užduotys veikia kaip įprastai.`,
      }
    }
    const limit = profile?.ai_monthly_limit ?? settings.ai_user_monthly_limit
    if (opts.countsTowardLimit !== false && used >= limit) {
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
    if (spendCache && spendCache.month === monthStart().getTime()) spendCache.usd += cost
    after(() => maybeSendBudgetAlert(admin))
  } catch (error) {
    console.error("[ai-usage] record failed", { error: error instanceof Error ? error.message : "unknown" })
  }
}

/** Sends the 80 % and 100 % budget emails once per month each. */
export async function maybeSendBudgetAlert(admin: SupabaseClient, now = new Date()): Promise<void> {
  try {
    const settings = await loadAiSettings(admin)
    if (settings.ai_monthly_budget_usd <= 0) return
    const spent = await monthSpendUsd(admin, now, true)
    const ratio = spent / settings.ai_monthly_budget_usd
    const level = ratio >= 1 ? "100" : ratio >= settings.ai_budget_alert_ratio ? "alert" : null
    if (!level) return

    const monthKey = monthStart(now).toISOString().slice(0, 7)
    const target = `${monthKey}:${level}`
    const { data: sent } = await admin
      .from("admin_audit_log")
      .select("id")
      .eq("action", "ai_budget.alert")
      .eq("target_id", target)
      .limit(1)
    if (sent && sent.length > 0) return
    await admin.from("admin_audit_log").insert({
      actor_id: null,
      action: "ai_budget.alert",
      target_type: "platform",
      target_id: target,
      details: { spent_usd: spent, budget_usd: settings.ai_monthly_budget_usd },
    })

    const [{ superAdminEmails }, { sendEmail }, { aiBudgetEmail }, top] = await Promise.all([
      import("@/lib/access/notify"),
      import("@/lib/email/send"),
      import("@/lib/email/templates"),
      topUsers(admin, now, 3),
    ])
    const to = await superAdminEmails(admin)
    if (to.length === 0) return
    const base = `https://${process.env.CANONICAL_CLASSROOM_HOST || "pamokos.kusteam.app"}`
    await sendEmail(
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
  } catch (error) {
    console.error("[ai-usage] budget alert failed", { error: error instanceof Error ? error.message : "unknown" })
  }
}

export interface UserUsage {
  userId: string
  name: string
  email: string | null
  actions: number
  calls: number
  costUsd: number
  limit: number | null
}

/** This month's usage per person, most expensive first. */
export async function usageByUser(admin: SupabaseClient, now = new Date()): Promise<UserUsage[]> {
  const rows: { user_id: string | null; request_id: string; endpoint: string; cost_usd: number }[] = []
  const page = 1000
  for (let from = 0; ; from += page) {
    const { data, error } = await admin
      .from("ai_usage")
      .select("user_id, request_id, endpoint, cost_usd")
      .gte("created_at", monthStart(now).toISOString())
      .order("id", { ascending: true })
      .range(from, from + page - 1)
    if (error) throw error
    rows.push(...((data ?? []) as typeof rows))
    if (!data || data.length < page) break
  }
  const byUser = new Map<string, { requests: Set<string>; calls: number; cost: number }>()
  for (const r of rows) {
    if (!r.user_id) continue
    const u = byUser.get(r.user_id) ?? { requests: new Set<string>(), calls: 0, cost: 0 }
    if (!UNCOUNTED_ENDPOINTS.includes(r.endpoint)) u.requests.add(r.request_id)
    u.calls += 1
    u.cost += Number(r.cost_usd)
    byUser.set(r.user_id, u)
  }
  const ids = Array.from(byUser.keys())
  const { data: profiles } = ids.length
    ? await admin.from("profiles").select("id, full_name, email, ai_monthly_limit").in("id", ids)
    : { data: [] as { id: string; full_name: string | null; email: string | null; ai_monthly_limit: number | null }[] }
  const info = new Map((profiles ?? []).map((p) => [p.id, p]))
  return ids
    .map((id) => {
      const u = byUser.get(id)!
      const p = info.get(id)
      return {
        userId: id,
        name: p?.full_name || p?.email || "Nežinomas",
        email: p?.email ?? null,
        actions: u.requests.size,
        calls: u.calls,
        costUsd: Math.round(u.cost * 100000) / 100000,
        limit: p?.ai_monthly_limit ?? null,
      }
    })
    .sort((a, b) => b.costUsd - a.costUsd)
}

async function topUsers(admin: SupabaseClient, now: Date, n: number): Promise<UserUsage[]> {
  return (await usageByUser(admin, now)).slice(0, n)
}
