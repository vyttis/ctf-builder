import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  type AdminUserRow,
  breakdown,
  matchesSearch,
  recentlyActive,
  USER_CSV_HEADERS,
  userCsvRow,
} from "@/lib/admin/user-rows"

function row(over: Partial<AdminUserRow> = {}): AdminUserRow {
  return {
    id: "u1",
    email: "ona@example.com",
    name: "Ona Žemaitė",
    first_name: "Ona",
    last_name: "Žemaitė",
    avatar_url: null,
    role: "teacher",
    status: "active",
    school: "Klaipėdos „Ąžuolyno“ gimnazija",
    school_code: "190000001",
    municipality: "Klaipėdos m. sav.",
    school_type: "Gimnazija",
    subjects: ["Fizika", "Chemija"],
    grades: ["9-10 kl."],
    onboarding_completed: true,
    created_at: "2026-10-01T08:00:00Z",
    approved_at: "2026-10-01T09:00:00Z",
    last_sign_in_at: "2026-11-05T10:00:00Z",
    activities: 3,
    ai_actions: 7,
    ai_limit: null,
    ...over,
  }
}

describe("user list helpers", () => {
  it("finds people without typing Lithuanian letters", () => {
    expect(matchesSearch(row(), "zemaite")).toBe(true)
    expect(matchesSearch(row(), "azuolyno")).toBe(true)
    expect(matchesSearch(row(), "klaipedos m")).toBe(true)
    expect(matchesSearch(row(), "vilnius")).toBe(false)
    expect(matchesSearch(row(), "  ")).toBe(true)
  })

  it("counts every subject and groups missing values", () => {
    const rows = [row(), row({ id: "u2", subjects: ["Fizika"] }), row({ id: "u3", subjects: [], municipality: null })]
    expect(breakdown(rows, (r) => r.subjects)).toEqual([
      { label: "Fizika", count: 2 },
      { label: "Chemija", count: 1 },
      { label: "Nenurodyta", count: 1 },
    ])
    expect(breakdown(rows, (r) => r.municipality)[0]).toEqual({ label: "Klaipėdos m. sav.", count: 2 })
  })

  it("treats sign-ins within 30 days as recent", () => {
    const now = new Date("2026-11-06T12:00:00Z").getTime()
    expect(recentlyActive(row(), now)).toBe(true)
    expect(recentlyActive(row({ last_sign_in_at: "2026-09-01T00:00:00Z" }), now)).toBe(false)
    expect(recentlyActive(row({ last_sign_in_at: null }), now)).toBe(false)
  })

  it("exports one CSV cell per header and never a phone number", () => {
    const cells = userCsvRow(row())
    expect(cells).toHaveLength(USER_CSV_HEADERS.length)
    expect(cells).toContain("Fizika; Chemija")
    expect(USER_CSV_HEADERS.join(" ").toLowerCase()).not.toContain("telefon")
  })

  it("keeps the client list free of server-only modules", () => {
    const client = readFileSync("components/admin/users-manager.tsx", "utf8")
    const helpers = readFileSync("lib/admin/user-rows.ts", "utf8")
    expect(client).not.toMatch(/@\/lib\/admin\/users"/)
    expect(client).not.toMatch(/@\/lib\/access\/schools"/)
    expect(helpers).not.toMatch(/^import (?!type)/m)
  })
})

describe("schoolKey", () => {
  it("counts a school once whether a profile has the code or only the name", async () => {
    const { schoolKey } = await import("@/lib/admin/user-rows")
    const legacy = schoolKey({ school: "Klaipėdos  Ąžuolyno gimnazija ", school_code: null })
    const onboarded = schoolKey({ school: "Klaipėdos Ąžuolyno gimnazija", school_code: "190000001" })
    expect(legacy).toBe(onboarded)
    expect(schoolKey({ school: null, school_code: "190000002" })).toBe("190000002")
    expect(schoolKey({ school: "  ", school_code: null })).toBe("")
  })
})

describe("userCsvRow without DI data", () => {
  it("leaves the DI cell empty for viewers who may not see it", () => {
    const cells = userCsvRow(row({ ai_actions: null }))
    expect(cells[cells.length - 1]).toBe("")
  })
})

describe("dateOnly", () => {
  it("gives the calendar day in Lithuania", async () => {
    const { dateOnly } = await import("@/lib/admin/user-rows")
    // 23:30 UTC on 5 November is already 6 November in Vilnius.
    expect(dateOnly("2026-11-05T23:30:00Z")).toBe("2026-11-06")
    expect(dateOnly("2026-07-01T20:59:00Z")).toBe("2026-07-01")
    expect(dateOnly(null)).toBe("")
  })
})
