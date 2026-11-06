import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({}) }))

import { costUsd, priceFor } from "@/lib/ai/pricing"
import { monthGenitive, monthStart, nextMonthStart, resetsOnText } from "@/lib/ai/usage"

describe("DI pricing", () => {
  it("prices by model family and overestimates unknown models", () => {
    expect(priceFor("claude-haiku-4-5-20251001").input).toBe(1)
    expect(priceFor("claude-sonnet-4-6").output).toBe(15)
    expect(priceFor("claude-opus-4-7").output).toBe(25)
    expect(priceFor("some-new-model").output).toBe(25)
  })

  it("counts input, output and cache tokens", () => {
    // 2000 in, 1000 out on Sonnet: 0.006 + 0.015
    expect(costUsd("claude-sonnet-4-6", { input_tokens: 2000, output_tokens: 1000 })).toBeCloseTo(0.021, 5)
    // cache read is a tenth of input, cache write 1.25x
    expect(
      costUsd("claude-haiku-4-5-20251001", { cache_read_input_tokens: 1_000_000, cache_creation_input_tokens: 1_000_000 }),
    ).toBeCloseTo(1.35, 5)
    expect(costUsd("claude-opus-4-7", {})).toBe(0)
  })
})

describe("DI months", () => {
  it("starts and resets on the first of the month (UTC)", () => {
    const now = new Date("2026-11-06T12:00:00Z")
    expect(monthStart(now).toISOString()).toBe("2026-11-01T00:00:00.000Z")
    expect(nextMonthStart(now).toISOString()).toBe("2026-12-01T00:00:00.000Z")
    expect(resetsOnText(now)).toBe("gruodžio 1 d.")
    expect(monthGenitive(now)).toBe("lapkričio")
    expect(resetsOnText(new Date("2026-12-31T23:00:00Z"))).toBe("sausio 1 d.")
  })

})
