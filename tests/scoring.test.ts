import { describe, it, expect } from "vitest"
import { calculatePoints, nextHintCost } from "@/lib/game/scoring"

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

  it("takes at most half of the points for hints", () => {
    expect(calculatePoints(100, 10)).toBe(50)
    expect(calculatePoints(50, 3, 20)).toBe(25)
    expect(calculatePoints(51, 5, 20)).toBe(26)
  })

  it("prices the next hint by what it still takes", () => {
    expect(nextHintCost(100, 0, 20)).toBe(20)
    expect(nextHintCost(100, 2, 20)).toBe(10)
    expect(nextHintCost(100, 3, 20)).toBe(0)
    expect(nextHintCost(50, 1, 20)).toBe(5)
  })

  it("handles zero penalty", () => {
    expect(calculatePoints(100, 5, 0)).toBe(100)
  })
})
