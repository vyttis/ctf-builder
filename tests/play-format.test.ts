import { describe, expect, it } from "vitest"
import { formatTime, normalizeNumericAnswer, openedHintCount, sheetKey } from "@/lib/game/play-format"

describe("formatTime", () => {
  it("shows minutes and seconds, hours only from an hour up", () => {
    expect(formatTime(0)).toBe("00:00")
    expect(formatTime(-5)).toBe("00:00")
    expect(formatTime(59)).toBe("00:59")
    expect(formatTime(5 * 60 + 7)).toBe("05:07")
    expect(formatTime(3600 + 2 * 60 + 3)).toBe("1:02:03")
  })
})

describe("normalizeNumericAnswer", () => {
  it("trims and turns a decimal comma into a dot", () => {
    expect(normalizeNumericAnswer(" 3,14 ")).toBe("3.14")
    expect(normalizeNumericAnswer("42")).toBe("42")
  })
})

describe("openedHintCount", () => {
  it("counts hints whose text has arrived", () => {
    expect(openedHintCount({ hints: ["a", null, "b"] })).toBe(2)
    expect(openedHintCount({ hints: [] })).toBe(0)
    expect(openedHintCount(undefined)).toBe(0)
  })
})

describe("sheetKey", () => {
  it("changes with the task, its type or its choices", () => {
    const base = { id: "t1", type: "multiple_choice", options: ["A", "B"] }
    expect(sheetKey(base)).toBe(sheetKey({ ...base }))
    expect(sheetKey(base)).not.toBe(sheetKey({ ...base, id: "t2" }))
    expect(sheetKey(base)).not.toBe(sheetKey({ ...base, type: "text" }))
    expect(sheetKey(base)).not.toBe(sheetKey({ ...base, options: ["A", "C"] }))
    expect(sheetKey(undefined)).toBe("none")
  })
})
