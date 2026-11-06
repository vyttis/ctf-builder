import { describe, expect, it } from "vitest"
import {
  activityRequestToken,
  isValidActivityRequestToken,
  looksLikeRequestLinkToken,
  newRequestLinkToken,
} from "@/lib/access/tokens"
import { activityAcceptsRequests, linkIsOpen, FINISHED_GRACE_MS } from "@/lib/access/requests"
import { findSchoolByCode, foldForSearch, searchSchools, MUNICIPALITIES } from "@/lib/access/schools"
import { accessRequestSchema, onboardingSchema } from "@/lib/access/profile-fields"

const KEY = "test-service-key"
const GAME = "11111111-2222-3333-4444-555555555555"

describe("activity QR token", () => {
  it("accepts the token made for the same activity", () => {
    const token = activityRequestToken(GAME, KEY)
    expect(token).toMatch(/^[A-Za-z0-9_-]{22}$/)
    expect(isValidActivityRequestToken(GAME, token, KEY)).toBe(true)
  })

  it("rejects another activity's token, a wrong key and empty input", () => {
    const token = activityRequestToken(GAME, KEY)
    expect(isValidActivityRequestToken("99999999-2222-3333-4444-555555555555", token, KEY)).toBe(false)
    expect(isValidActivityRequestToken(GAME, token, "other-key")).toBe(false)
    expect(isValidActivityRequestToken(GAME, "", KEY)).toBe(false)
    expect(isValidActivityRequestToken(GAME, undefined, KEY)).toBe(false)
    expect(isValidActivityRequestToken(GAME, token.slice(0, 10), KEY)).toBe(false)
  })
})

describe("request link token", () => {
  it("is long, URL-safe and different every time", () => {
    const a = newRequestLinkToken()
    const b = newRequestLinkToken()
    expect(a).not.toBe(b)
    expect(looksLikeRequestLinkToken(a)).toBe(true)
    expect(a.length).toBeGreaterThanOrEqual(24)
  })

  it("does not accept short or odd strings", () => {
    expect(looksLikeRequestLinkToken("veikla")).toBe(false)
    expect(looksLikeRequestLinkToken("abc/def")).toBe(false)
  })
})

describe("activityAcceptsRequests", () => {
  const now = Date.parse("2026-11-06T12:00:00Z")
  const base = { id: GAME, updated_at: "2026-11-06T11:00:00Z" }

  it("needs the facilitator's switch", () => {
    expect(activityAcceptsRequests({ ...base, status: "active", settings: {} }, now)).toBe(false)
    expect(activityAcceptsRequests({ ...base, status: "active", settings: null }, now)).toBe(false)
    expect(
      activityAcceptsRequests({ ...base, status: "active", settings: { allow_access_requests: true } }, now),
    ).toBe(true)
  })

  it("stays open two days after the end, never for drafts", () => {
    const on = { allow_access_requests: true }
    expect(activityAcceptsRequests({ ...base, status: "paused", settings: on }, now)).toBe(true)
    expect(activityAcceptsRequests({ ...base, status: "draft", settings: on }, now)).toBe(false)
    expect(activityAcceptsRequests({ ...base, status: "finished", settings: on }, now)).toBe(true)
    const old = new Date(now - FINISHED_GRACE_MS - 1000).toISOString()
    expect(activityAcceptsRequests({ ...base, updated_at: old, status: "finished", settings: on }, now)).toBe(false)
  })
})

describe("linkIsOpen", () => {
  const now = Date.parse("2026-11-06T12:00:00Z")
  const open = { id: "l", expires_at: null, revoked_at: null, max_uses: null }

  it("closes on revoke, expiry and use limit", () => {
    expect(linkIsOpen(open, 0, now)).toBe(true)
    expect(linkIsOpen({ ...open, revoked_at: "2026-11-06T10:00:00Z" }, 0, now)).toBe(false)
    expect(linkIsOpen({ ...open, expires_at: "2026-11-06T11:59:59Z" }, 0, now)).toBe(false)
    expect(linkIsOpen({ ...open, expires_at: "2026-11-07T00:00:00Z" }, 0, now)).toBe(true)
    expect(linkIsOpen({ ...open, max_uses: 3 }, 2, now)).toBe(true)
    expect(linkIsOpen({ ...open, max_uses: 3 }, 3, now)).toBe(false)
  })
})

describe("school registry", () => {
  it("folds Lithuanian letters and quotes for search", () => {
    expect(foldForSearch("„Ąžuolo“  GIMNAZIJA")).toBe("azuolo gimnazija")
  })

  it("finds schools without Lithuanian letters, every word must match", () => {
    const results = searchSchools("klaipedos gimnazija")
    expect(results.length).toBeGreaterThan(0)
    for (const s of results) {
      const hay = foldForSearch(`${s.name} ${s.municipality}`)
      expect(hay).toContain("klaipedos")
      expect(hay).toContain("gimnazija")
    }
    expect(searchSchools("   ")).toEqual([])
    expect(searchSchools("zzzz-neegzistuoja")).toEqual([])
  })

  it("shows names with Lithuanian quotes", () => {
    const [school] = searchSchools("klaipedos azuolyno")
    expect(school.name).toBe("Klaipėdos „Ąžuolyno“ gimnazija")
  })

  it("looks schools up by code and lists municipalities", () => {
    const first = searchSchools("gimnazija", 1)[0]
    expect(findSchoolByCode(first.code)?.name).toBe(first.name)
    expect(findSchoolByCode("000")).toBeNull()
    expect(MUNICIPALITIES.length).toBeGreaterThanOrEqual(60)
  })
})

describe("form schemas", () => {
  const request = {
    first_name: " Ona ",
    last_name: "Onaitė",
    email: " Ona.Onaite@Mokykla.LT ",
    consent: true,
    school_code: null,
    school_name: "Klaipėdos neformaliojo ugdymo centras",
    municipality: "Klaipėdos m. sav.",
    link_token: "abcdefghijklmnopqrstuvwx",
  }

  it("normalises the request and requires consent", () => {
    const parsed = accessRequestSchema.parse(request)
    expect(parsed.first_name).toBe("Ona")
    expect(parsed.email).toBe("ona.onaite@mokykla.lt")
    expect(accessRequestSchema.safeParse({ ...request, consent: false }).success).toBe(false)
    expect(accessRequestSchema.safeParse({ ...request, email: "ne-el-pastas" }).success).toBe(false)
    expect(accessRequestSchema.safeParse({ ...request, school_name: "" }).success).toBe(false)
  })

  it("needs at least one subject and one class band on onboarding", () => {
    const base = { ...request, subjects: ["Matematika"], grades: ["5-6 kl."] }
    expect(onboardingSchema.safeParse(base).success).toBe(true)
    expect(onboardingSchema.safeParse({ ...base, subjects: [] }).success).toBe(false)
    expect(onboardingSchema.safeParse({ ...base, grades: [] }).success).toBe(false)
    expect(onboardingSchema.safeParse({ ...base, subjects: ["Astrologija"] }).success).toBe(false)
  })
})
