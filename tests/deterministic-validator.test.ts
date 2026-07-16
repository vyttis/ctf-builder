import { describe, it, expect } from "vitest"
import { validateDeterministic } from "@/lib/ai/deterministic-validator"
import type { AiSuggestion } from "@/lib/ai/types"

function suggestion(overrides: Partial<AiSuggestion> = {}): AiSuggestion {
  return {
    title: "Testinė užduotis",
    description: "Aprašymas be matematikos",
    type: "text",
    points: 100,
    correct_answer: "atsakymas",
    hints: [],
    options: null,
    ...overrides,
  }
}

describe("multiple_choice validation", () => {
  it("fails when there are fewer than 2 options", () => {
    const result = validateDeterministic(
      suggestion({ type: "multiple_choice", options: ["Vienas"] })
    )
    expect(result?.verdict).toBe("fail")
  })

  it("fails when the correct answer is not among options", () => {
    const result = validateDeterministic(
      suggestion({
        type: "multiple_choice",
        options: ["Deguonis", "Azotas"],
        correct_answer: "Vandenilis",
      })
    )
    expect(result?.verdict).toBe("fail")
    expect(result?.issues[0]).toContain("Vandenilis")
  })

  it("accepts case/whitespace differences between answer and option", () => {
    const result = validateDeterministic(
      suggestion({
        type: "multiple_choice",
        options: ["Deguonis", "Azotas"],
        correct_answer: "  deguonis ",
      })
    )
    // Passes the MC rule; falls through to sanity checks -> null (LLM fallback)
    expect(result).toBeNull()
  })
})

describe("number validation", () => {
  it("fails when the answer is not numeric", () => {
    const result = validateDeterministic(
      suggestion({ type: "number", correct_answer: "daug" })
    )
    expect(result?.verdict).toBe("fail")
  })

  it("passes when a single math expression in the description matches the answer", () => {
    const result = validateDeterministic(
      suggestion({
        type: "number",
        description: "Kiek yra 15 * 7?",
        correct_answer: "105",
      })
    )
    expect(result?.verdict).toBe("pass")
  })

  it("fails when the computed math result differs from the answer", () => {
    const result = validateDeterministic(
      suggestion({
        type: "number",
        description: "Kiek yra 15 * 7?",
        correct_answer: "100",
      })
    )
    expect(result?.verdict).toBe("fail")
  })

  it("does not fail division by zero — falls back to LLM", () => {
    const result = validateDeterministic(
      suggestion({
        type: "number",
        description: "Kiek yra 5 / 0?",
        correct_answer: "0",
      })
    )
    // Math eval returns null -> no deterministic verdict from the math rule
    expect(result).toBeNull()
  })
})

describe("sanity checks", () => {
  it("fails on a too-short title", () => {
    const result = validateDeterministic(suggestion({ title: "Ab" }))
    expect(result?.verdict).toBe("fail")
  })

  it("fails on points outside 50-500", () => {
    expect(validateDeterministic(suggestion({ points: 10 }))?.verdict).toBe("fail")
    expect(validateDeterministic(suggestion({ points: 1000 }))?.verdict).toBe("fail")
  })

  it("returns null (LLM fallback) for a plausible text task", () => {
    expect(validateDeterministic(suggestion())).toBeNull()
  })
})
