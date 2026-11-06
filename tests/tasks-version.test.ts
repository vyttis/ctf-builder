import { describe, expect, it } from "vitest"
import { remapTaskIndex, tasksVersion } from "@/lib/game/tasks-version"

describe("tasksVersion", () => {
  const a = { id: "a", updated_at: "2026-11-06T10:00:00.000+00:00" }
  const b = { id: "b", updated_at: "2026-11-06T10:05:00.000+00:00" }

  it("changes when a task is saved", () => {
    expect(tasksVersion([a, b])).not.toBe(tasksVersion([{ ...a, updated_at: "2026-11-06T10:01:00.000+00:00" }, b]))
  })

  it("changes when a save commits with an earlier time than the latest", () => {
    // a saved at 10:03 commits after b's 10:05: the latest time stays 10:05.
    const before = tasksVersion([a, b])
    const after = tasksVersion([{ ...a, updated_at: "2026-11-06T10:03:00.000+00:00" }, b])
    expect(after).not.toBe(before)
  })

  it("changes when a task is added or removed", () => {
    expect(tasksVersion([a, b])).not.toBe(tasksVersion([a, b, { id: "c", updated_at: a.updated_at }]))
    expect(tasksVersion([a, b])).not.toBe(tasksVersion([b]))
  })

  it("does not depend on row order", () => {
    expect(tasksVersion([a, b])).toBe(tasksVersion([b, a]))
  })

  it("handles no tasks", () => {
    expect(tasksVersion(null)).toBe(tasksVersion([]))
    expect(tasksVersion([]).startsWith("0:")).toBe(true)
  })
})

describe("remapTaskIndex", () => {
  const prev = [{ id: "a" }, { id: "b" }, { id: "c" }]

  it("follows the open task to its new place", () => {
    expect(remapTaskIndex(prev, [{ id: "x" }, ...prev], 1)).toBe(2)
  })

  it("returns null when the task is gone or nothing was open", () => {
    expect(remapTaskIndex(prev, [{ id: "a" }, { id: "c" }], 1)).toBeNull()
    expect(remapTaskIndex(prev, prev, null)).toBeNull()
    expect(remapTaskIndex(prev, prev, 3)).toBeNull()
  })
})
