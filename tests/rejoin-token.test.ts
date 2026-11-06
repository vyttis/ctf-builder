import { beforeAll, describe, expect, it } from "vitest"
import { createRejoinToken, REJOIN_TTL_MS, verifyRejoinToken } from "@/lib/game/rejoin-token"

const TEAM = "6f1c2a3b-4d5e-4f60-8a7b-9c0d1e2f3a4b"

beforeAll(() => {
  process.env.REJOIN_SECRET = "test-secret-for-rejoin"
})

describe("rejoin tokens", () => {
  it("accepts its own token before it expires", () => {
    const now = 1_790_000_000_000
    const { token, expiresAt } = createRejoinToken(TEAM, now)
    expect(expiresAt).toBe(now + REJOIN_TTL_MS)
    expect(verifyRejoinToken(token, now + 60_000)).toEqual({ ok: true, teamId: TEAM })
  })

  it("rejects an expired token", () => {
    const now = 1_790_000_000_000
    const { token } = createRejoinToken(TEAM, now)
    expect(verifyRejoinToken(token, now + REJOIN_TTL_MS + 1)).toEqual({ ok: false, reason: "expired" })
  })

  it("rejects a token for another team or with a longer life", () => {
    const now = 1_790_000_000_000
    const { token } = createRejoinToken(TEAM, now)
    const [, exp, sig] = token.split(".")
    const other = "00000000-0000-4000-8000-000000000000"
    expect(verifyRejoinToken(`${other}.${exp}.${sig}`, now)).toEqual({ ok: false, reason: "invalid" })
    expect(verifyRejoinToken(`${TEAM}.${Number(exp) + 3_600_000}.${sig}`, now)).toEqual({ ok: false, reason: "invalid" })
    expect(verifyRejoinToken("garbage", now)).toEqual({ ok: false, reason: "invalid" })
  })

  it("rejects a token signed with another secret", () => {
    const now = 1_790_000_000_000
    const { token } = createRejoinToken(TEAM, now)
    process.env.REJOIN_SECRET = "another-secret"
    expect(verifyRejoinToken(token, now)).toEqual({ ok: false, reason: "invalid" })
    process.env.REJOIN_SECRET = "test-secret-for-rejoin"
  })
})
