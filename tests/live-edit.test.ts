import { describe, it, expect } from "vitest"
import { isLiveStatus, samePrerequisites } from "@/lib/game/live-edit"

describe("live edit rules", () => {
  it("treats running and paused activities as live", () => {
    expect(isLiveStatus("active")).toBe(true)
    expect(isLiveStatus("paused")).toBe(true)
    expect(isLiveStatus("draft")).toBe(false)
    expect(isLiveStatus("finished")).toBe(false)
    expect(isLiveStatus(null)).toBe(false)
  })

  it("compares prerequisite lists as sets", () => {
    expect(samePrerequisites(["a", "b"], ["b", "a"])).toBe(true)
    expect(samePrerequisites([], null)).toBe(true)
    expect(samePrerequisites(["a"], ["a", "b"])).toBe(false)
    expect(samePrerequisites(["a", "c"], ["a", "b"])).toBe(false)
  })
})
