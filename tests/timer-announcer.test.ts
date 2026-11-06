import { describe, expect, it } from "vitest"
import { timerMark } from "@/components/player/timer-announcer"

describe("timerMark", () => {
  it("changes only at 5 min, 1 min, 30 s and 10 s", () => {
    const marks = new Set<number | null>()
    for (let s = 400; s >= 0; s--) marks.add(timerMark(s))
    expect([...marks]).toEqual([null, 300, 60, 30, 10, null].filter((m, i, a) => a.indexOf(m) === i))
    expect(timerMark(301)).toBeNull()
    expect(timerMark(300)).toBe(300)
    expect(timerMark(61)).toBe(300)
    expect(timerMark(60)).toBe(60)
    expect(timerMark(11)).toBe(30)
    expect(timerMark(1)).toBe(10)
    expect(timerMark(0)).toBeNull()
  })
})
