import { describe, it, expect } from "vitest"
import { calculatePoints } from "@/lib/game/scoring"

describe("calculatePoints", () => {
  it("returns base points with no hints", () => {
    expect(calculatePoints(100, 0)).toBe(100)
  })

  it("subtracts the default penalty (20) per hint", () => {
    expect(calculatePoints(100, 1)).toBe(80)
    expect(calculatePoints(100, 2)).toBe(60)
  })

  it("uses a custom hint penalty", () => {
    expect(calculatePoints(100, 2, 10)).toBe(80)
    expect(calculatePoints(150, 3, 25)).toBe(75)
  })

  it("never goes below zero", () => {
    expect(calculatePoints(100, 10)).toBe(0)
    expect(calculatePoints(50, 3, 20)).toBe(0)
  })

  it("handles zero penalty", () => {
    expect(calculatePoints(100, 5, 0)).toBe(100)
  })
})
