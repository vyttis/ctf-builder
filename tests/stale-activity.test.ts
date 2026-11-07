import { describe, expect, it } from "vitest"
import { STALE_MIN_AGE_MS, STALE_QUIET_MS, isStaleActivity, latest } from "@/lib/game/stale"

const NOW = Date.parse("2026-11-08T02:00:00Z")
const ago = (ms: number) => new Date(NOW - ms).toISOString()
const H = 60 * 60 * 1000

describe("isStaleActivity", () => {
  it("finishes an activity left running after a lesson", () => {
    expect(isStaleActivity({ startedAt: ago(14 * H), lastActivityAt: ago(12 * H) }, NOW)).toBe(true)
  })

  it("keeps a long workshop that is still answering", () => {
    expect(isStaleActivity({ startedAt: ago(9 * H), lastActivityAt: ago(30 * 60 * 1000) }, NOW)).toBe(false)
  })

  it("keeps a lesson that started recently, even if quiet", () => {
    expect(isStaleActivity({ startedAt: ago(3 * H), lastActivityAt: ago(3 * H) }, NOW)).toBe(false)
  })

  it("uses inclusive thresholds", () => {
    expect(isStaleActivity({ startedAt: ago(STALE_MIN_AGE_MS), lastActivityAt: ago(STALE_QUIET_MS) }, NOW)).toBe(true)
    expect(isStaleActivity({ startedAt: ago(STALE_MIN_AGE_MS), lastActivityAt: ago(STALE_QUIET_MS - 1) }, NOW)).toBe(false)
  })

  it("leaves an activity alone when a time cannot be read", () => {
    expect(isStaleActivity({ startedAt: "nonsense", lastActivityAt: ago(10 * H) }, NOW)).toBe(false)
  })
})

describe("latest", () => {
  it("picks the newest time and ignores missing ones", () => {
    expect(latest(ago(5 * H), null, ago(H), undefined, ago(3 * H))).toBe(ago(H))
    expect(latest(null, undefined)).toBeNull()
  })
})
