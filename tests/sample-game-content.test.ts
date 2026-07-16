import { describe, it, expect } from "vitest"
import { SAMPLE_GAME, SAMPLE_CHALLENGES } from "@/lib/game/sample-game-content"

// The sample game is seeded for brand-new teachers — it must always be
// internally consistent and playable.
describe("sample game content", () => {
  it("has a title and sane settings", () => {
    expect(SAMPLE_GAME.title.length).toBeGreaterThan(3)
    expect(SAMPLE_GAME.settings.max_teams).toBeGreaterThan(0)
  })

  it("every challenge has a non-empty answer (never a placeholder)", () => {
    for (const c of SAMPLE_CHALLENGES) {
      expect(c.correct_answer.trim().length).toBeGreaterThan(0)
      expect(c.correct_answer.toLowerCase()).not.toContain("placeholder")
    }
  })

  it("multiple choice answers are among their options", () => {
    for (const c of SAMPLE_CHALLENGES) {
      if (c.type === "multiple_choice") {
        expect(c.options).not.toBeNull()
        const normalized = c.options!.map((o) => o.trim().toLowerCase())
        expect(normalized).toContain(c.correct_answer.trim().toLowerCase())
      }
    }
  })

  it("number answers are numeric", () => {
    for (const c of SAMPLE_CHALLENGES) {
      if (c.type === "number") {
        expect(Number.isNaN(parseFloat(c.correct_answer))).toBe(false)
      }
    }
  })

  it("order indexes are sequential from 0", () => {
    const indexes = SAMPLE_CHALLENGES.map((c) => c.order_index).sort()
    expect(indexes).toEqual(SAMPLE_CHALLENGES.map((_, i) => i))
  })

  it("every challenge has an explanation and at least one hint", () => {
    for (const c of SAMPLE_CHALLENGES) {
      expect(c.explanation.length).toBeGreaterThan(10)
      expect(c.hints.length).toBeGreaterThan(0)
    }
  })
})
