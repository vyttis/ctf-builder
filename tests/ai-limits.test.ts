import { beforeEach, describe, expect, it, vi } from "vitest"

// A small in-memory stand-in for the Supabase query builder, enough for the
// queries lib/ai/usage.ts makes. Each query runs when it is awaited, so
// concurrent requests interleave the way they do against the real API.
type Row = Record<string, unknown>

class FakeDb {
  tables: Record<string, Row[]> = {}
  failing = new Set<string>()
  private ids: Record<string, number> = {}
  rows(table: string): Row[] {
    this.tables[table] ??= []
    return this.tables[table]
  }
  nextId(table: string): number {
    this.ids[table] = (this.ids[table] ?? 0) + 1
    return this.ids[table]
  }
  from(table: string) {
    return new FakeQuery(this, table)
  }
}

class FakeQuery implements PromiseLike<{ data: unknown; error: null }> {
  private filters: ((r: Row) => boolean)[] = []
  private op: "select" | "insert" | "delete" = "select"
  private payload: Row[] = []
  private from_ = 0
  private to_ = Infinity
  private mode: "many" | "single" | "maybe" = "many"
  constructor(
    private db: FakeDb,
    private table: string,
  ) {}
  select() {
    return this
  }
  insert(p: Row | Row[]) {
    this.op = "insert"
    this.payload = Array.isArray(p) ? p : [p]
    return this
  }
  delete() {
    this.op = "delete"
    return this
  }
  eq(c: string, v: unknown) {
    this.filters.push((r) => r[c] === v)
    return this
  }
  in(c: string, vs: unknown[]) {
    this.filters.push((r) => vs.includes(r[c]))
    return this
  }
  not(c: string, _op: string, v: string) {
    const list = v.slice(1, -1).split(",")
    this.filters.push((r) => !list.includes(String(r[c])))
    return this
  }
  gte(c: string, v: string | number) {
    this.filters.push((r) => (r[c] as string | number) >= v)
    return this
  }
  neq(c: string, v: unknown) {
    this.filters.push((r) => r[c] !== v)
    return this
  }
  lte(c: string, v: string | number) {
    this.filters.push((r) => (r[c] as string | number) <= v)
    return this
  }
  order() {
    return this
  }
  range(a: number, b: number) {
    this.from_ = a
    this.to_ = b
    return this
  }
  limit(n: number) {
    this.to_ = n - 1
    return this
  }
  single() {
    this.mode = "single"
    return this
  }
  maybeSingle() {
    this.mode = "maybe"
    return this
  }
  private run(): unknown {
    const rows = this.db.rows(this.table)
    if (this.op === "insert") {
      const inserted = this.payload.map((p) => ({
        id: this.db.nextId(this.table),
        created_at: new Date().toISOString(),
        cost_usd: 0,
        ...p,
      }))
      rows.push(...inserted)
      return this.mode === "many" ? inserted : inserted[0]
    }
    const matched = rows.filter((r) => this.filters.every((f) => f(r)))
    if (this.op === "delete") {
      this.db.tables[this.table] = rows.filter((r) => !matched.includes(r))
      return null
    }
    const sorted = [...matched].sort((a, b) => Number(a.id) - Number(b.id))
    const page = sorted.slice(this.from_, this.to_ + 1)
    return this.mode === "many" ? page : (page[0] ?? null)
  }
  then<A = { data: unknown; error: null }, B = never>(
    onFulfilled?: ((v: { data: unknown; error: null }) => A | PromiseLike<A>) | null,
    onRejected?: ((e: unknown) => B | PromiseLike<B>) | null,
  ): PromiseLike<A | B> {
    return Promise.resolve()
      .then(() =>
        this.db.failing.has(this.table)
          ? ({ data: null, error: { message: "unavailable", code: "XX000" } } as never)
          : { data: this.run(), error: null as null },
      )
      .then(onFulfilled, onRejected)
  }
}

const h = vi.hoisted(() => ({
  db: null as unknown,
  afterQueue: [] as (() => unknown)[],
  sendResults: [] as { ok: boolean }[],
}))

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => h.db }))
vi.mock("next/server", () => ({ after: (fn: () => unknown) => h.afterQueue.push(fn) }))
vi.mock("@/lib/access/notify", () => ({ superAdminEmails: async () => ["admin@example.com"] }))
vi.mock("@/lib/email/templates", () => ({
  aiBudgetEmail: (to: string[]) => ({ to, subject: "DI biudžetas", html: "", text: "" }),
}))
vi.mock("@/lib/email/send", () => ({ sendEmail: async () => h.sendResults.shift() ?? { ok: true } }))

import {
  budgetLevel,
  checkAiAllowance,
  maybeSendBudgetAlert,
  monthActionsByUser,
  monthSpendUsd,
  recordAiUsage,
  aiContext,
  RESERVATION_MODEL,
  usageByUser,
} from "@/lib/ai/usage"

const USER = "11111111-1111-1111-1111-111111111111"
const OTHER = "22222222-2222-2222-2222-222222222222"

function setup(): FakeDb {
  const db = new FakeDb()
  db.rows("platform_settings").push({
    id: true,
    ai_monthly_budget_usd: 50,
    ai_user_monthly_limit: 40,
    ai_budget_alert_ratio: 0.8,
  })
  db.rows("profiles").push(
    { id: USER, role: "teacher", status: "active", full_name: "Ona Mokytoja", email: "ona@example.com", ai_monthly_limit: null },
    { id: OTHER, role: "teacher", status: "active", full_name: "Jonas Naujas", email: "jonas@example.com", ai_monthly_limit: null },
  )
  h.db = db
  h.afterQueue.length = 0
  h.sendResults.length = 0
  return db
}

/** One finished DI action: its reservation and one model call. */
function addActions(db: FakeDb, n: number, extra: Row = {}) {
  for (let i = 0; i < n; i++) {
    const requestId = `req-${db.rows("ai_usage").length}`
    const at = (extra.created_at as string) ?? new Date().toISOString()
    for (const model of ["reservation", "claude-sonnet-4-6"]) {
      db.rows("ai_usage").push({
        id: db.nextId("ai_usage"),
        user_id: USER,
        request_id: requestId,
        endpoint: "di/generate",
        model,
        cost_usd: model === "reservation" ? 0 : 0.01,
        created_at: at,
        ...extra,
      })
    }
  }
}

/** A model call without a reservation (super admin, or the check failed open). */
function addCall(db: FakeDb, extra: Row = {}) {
  db.rows("ai_usage").push({
    id: db.nextId("ai_usage"),
    user_id: USER,
    request_id: `req-${db.rows("ai_usage").length}`,
    endpoint: "di/generate",
    model: "claude-sonnet-4-6",
    cost_usd: 0.01,
    created_at: new Date().toISOString(),
    ...extra,
  })
}

async function flushAfter() {
  while (h.afterQueue.length > 0) await h.afterQueue.shift()!()
}

beforeEach(async () => {
  // The spend cache lives in the module; start every test from a fresh read.
  await monthSpendUsd(setup() as never, new Date(), true)
})

describe("budgetLevel", () => {
  const settings = { ai_monthly_budget_usd: 50, ai_user_monthly_limit: 40, ai_budget_alert_ratio: 0.8 }
  it("names the threshold that was crossed", () => {
    expect(budgetLevel(39.99, settings)).toBeNull()
    expect(budgetLevel(40, settings)).toBe("alert")
    expect(budgetLevel(50, settings)).toBe("100")
    expect(budgetLevel(10, { ...settings, ai_monthly_budget_usd: 0 })).toBeNull()
  })
})

describe("personal monthly limit", () => {
  it("counts every action of the month, past the first page of rows", async () => {
    const db = setup()
    addActions(db, 1200)
    addCall(db, { endpoint: "di/verify" })
    expect(await monthActionsByUser(db as never, USER)).toBe(1200)
  })

  it("keeps an action in the month it was reserved in", async () => {
    const db = setup()
    const now = new Date()
    const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 1000).toISOString()
    db.rows("ai_usage").push(
      { id: db.nextId("ai_usage"), user_id: USER, request_id: "late", endpoint: "di/generate", model: "reservation", cost_usd: 0, created_at: lastMonth },
      { id: db.nextId("ai_usage"), user_id: USER, request_id: "late", endpoint: "di/generate", model: "claude-sonnet-4-6", cost_usd: 0.01, created_at: now.toISOString() },
    )
    expect(await monthActionsByUser(db as never, USER, now)).toBe(0)
  })

  it("stops counting a reservation whose request never finished", async () => {
    const db = setup()
    const now = new Date("2026-11-15T12:00:00Z")
    const old = new Date("2026-11-15T11:40:00Z")
    db.rows("ai_usage").push(
      { id: db.nextId("ai_usage"), user_id: USER, request_id: "killed", endpoint: "di/generate", model: "reservation", cost_usd: 0, created_at: old.toISOString() },
      { id: db.nextId("ai_usage"), user_id: USER, request_id: "running", endpoint: "di/generate", model: "reservation", cost_usd: 0, created_at: now.toISOString() },
    )
    expect(await monthActionsByUser(db as never, USER, now)).toBe(1)
  })

  it("lets only one of two simultaneous requests take the last slot", async () => {
    const db = setup()
    addActions(db, 39)
    const [a, b] = await Promise.all([checkAiAllowance(USER, "di/generate"), checkAiAllowance(USER, "di/generate")])
    expect([a.ok, b.ok].sort()).toEqual([false, true])
    const denied = (a.ok ? b : a) as Extract<typeof a, { ok: false }>
    expect(denied.code).toBe("ai_user_limit")
    // The denied request gave its slot back; the allowed one holds it.
    expect(db.rows("ai_usage").filter((r) => r.model === RESERVATION_MODEL)).toHaveLength(40)
    expect(await monthActionsByUser(db as never, USER)).toBe(40)
  })

  it("gives the slot back when the action made no model call", async () => {
    const db = setup()
    const allowance = await checkAiAllowance(USER, "di/generate")
    expect(allowance.ok).toBe(true)
    await flushAfter()
    expect(await monthActionsByUser(db as never, USER)).toBe(0)
  })

  it("keeps the slot once the model was called", async () => {
    const db = setup()
    const allowance = await checkAiAllowance(USER, "di/generate")
    if (!allowance.ok) throw new Error("expected allowance")
    await aiContext.run(allowance.ctx, () => recordAiUsage("claude-sonnet-4-6", { input_tokens: 1000, output_tokens: 500 }))
    await flushAfter()
    expect(await monthActionsByUser(db as never, USER)).toBe(1)
    expect(db.rows("ai_usage").filter((r) => r.model === RESERVATION_MODEL)).toHaveLength(1)
  })

  it("does not reserve a slot for a re-check", async () => {
    const db = setup()
    addActions(db, 40)
    const allowance = await checkAiAllowance(USER, "di/verify", new Date(), { countsTowardLimit: false })
    expect(allowance.ok).toBe(true)
    expect(db.rows("ai_usage").filter((r) => r.model === RESERVATION_MODEL)).toHaveLength(40)
  })

  it("fails open instead of applying defaults when settings cannot be read", async () => {
    const db = setup()
    // Configured above the built-in default of 40.
    db.rows("platform_settings")[0].ai_user_monthly_limit = 100
    addActions(db, 45)
    db.failing.add("platform_settings")
    const allowance = await checkAiAllowance(USER, "di/generate")
    expect(allowance.ok).toBe(true)
  })
})

describe("budget alerts", () => {
  it("retries the email when it did not go out, then sends it once", async () => {
    const db = setup()
    addCall(db, { cost_usd: 42 })
    await monthSpendUsd(db as never, new Date(), true)

    h.sendResults.push({ ok: false })
    await maybeSendBudgetAlert(db as never)
    expect(db.rows("admin_audit_log")).toHaveLength(0)

    h.sendResults.push({ ok: true })
    await maybeSendBudgetAlert(db as never)
    await maybeSendBudgetAlert(db as never)
    const claims = db.rows("admin_audit_log")
    expect(claims).toHaveLength(1)
    expect(String(claims[0].target_id)).toMatch(/:alert$/)
  })

  it("does not read the database below the threshold", async () => {
    const db = setup()
    addCall(db, { cost_usd: 1 })
    await monthSpendUsd(db as never, new Date(), true)
    const spy = vi.spyOn(db, "from")
    await maybeSendBudgetAlert(db as never)
    expect(spy.mock.calls.map((c) => c[0])).not.toContain("ai_usage")
    expect(spy.mock.calls.map((c) => c[0])).not.toContain("admin_audit_log")
  })
})

describe("usage per person", () => {
  it("lists active facilitators who have not used DI yet", async () => {
    const db = setup()
    addActions(db, 2)
    addCall(db)
    const users = await usageByUser(db as never)
    expect(users.map((u) => u.userId)).toEqual([USER, OTHER])
    expect(users[0]).toMatchObject({ actions: 3, calls: 3 })
    expect(users[1]).toMatchObject({ actions: 0, calls: 0, costUsd: 0 })
  })
})
