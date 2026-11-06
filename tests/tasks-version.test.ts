import { describe, expect, it } from "vitest"
import { remapTaskIndex, tasksVersion } from "@/lib/game/tasks-version"

describe("tasksVersion", () => {
  const a = { updated_at: "2026-11-06T10:00:00.000+00:00" }
  const b = { updated_at: "2026-11-06T10:05:00.000+00:00" }

  it("changes when a task is saved", () => {
    expect(tasksVersion([a, a])).not.toBe(tasksVersion([a, b]))
  })

  it("changes when a task is added or removed", () => {
    expect(tasksVersion([a, b])).not.toBe(tasksVersion([a, b, a]))
    expect(tasksVersion([a, b])).not.toBe(tasksVersion([b]))
  })

  it("does not depend on row order", () => {
    expect(tasksVersion([a, b])).toBe(tasksVersion([b, a]))
  })

  it("handles no tasks", () => {
    expect(tasksVersion(null)).toBe("0:")
    expect(tasksVersion([])).toBe("0:")
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
