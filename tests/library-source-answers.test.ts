import { describe, expect, it } from "vitest"
import { matchSourceChallenges, type SourceChallenge } from "@/lib/library/source-answers"

function source(over: Partial<SourceChallenge>): SourceChallenge {
  return {
    id: "s1",
    title: "Upė",
    type: "text",
    order_index: 0,
    options: null,
    answer_hash: "$2b$10$hash",
    explanation: "Nemunas",
    difficulty: "easy",
    hint_penalty: 20,
    needs_answer: false,
    ...over,
  }
}

describe("matchSourceChallenges", () => {
  it("matches by title, type and position", () => {
    const a = source({ id: "a", title: "A", order_index: 0 })
    const b = source({ id: "b", title: "B", order_index: 1 })
    const out = matchSourceChallenges(
      [
        { title: "A", type: "text", order_index: 0 },
        { title: "B", type: "text", order_index: 1 },
      ],
      [b, a],
    )
    expect(out.map((m) => m?.id)).toEqual(["a", "b"])
  })

  it("still matches a task moved since publishing when the title is unique", () => {
    const out = matchSourceChallenges([{ title: "A", type: "text", order_index: 0 }], [source({ id: "a", title: "A", order_index: 5 })])
    expect(out[0]?.id).toBe("a")
  })

  it("does not guess between two moved tasks with the same title", () => {
    const out = matchSourceChallenges(
      [{ title: "A", type: "text", order_index: 0 }],
      [source({ id: "a1", title: "A", order_index: 3 }), source({ id: "a2", title: "A", order_index: 4 })],
    )
    expect(out[0]).toBeNull()
  })

  it("uses each source task once", () => {
    const out = matchSourceChallenges(
      [
        { title: "A", type: "text", order_index: 0 },
        { title: "A", type: "text", order_index: 7 },
      ],
      [source({ id: "a", title: "A", order_index: 0 })],
    )
    expect(out.map((m) => m?.id ?? null)).toEqual(["a", null])
  })

  it("needs the same options for a choice task and the same type", () => {
    const choice = source({ id: "c", title: "C", type: "multiple_choice", options: ["x", "y"] })
    expect(matchSourceChallenges([{ title: "C", type: "multiple_choice", options: ["x", "y"] }], [choice])[0]?.id).toBe("c")
    expect(matchSourceChallenges([{ title: "C", type: "multiple_choice", options: ["x", "z"] }], [choice])[0]).toBeNull()
    expect(matchSourceChallenges([{ title: "C", type: "text" }], [choice])[0]).toBeNull()
  })

  it("skips source tasks that have no real answer", () => {
    const out = matchSourceChallenges([{ title: "A", type: "text", order_index: 0 }], [source({ id: "a", title: "A", needs_answer: true })])
    expect(out[0]).toBeNull()
  })
})
