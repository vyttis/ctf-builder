import { describe, expect, it } from "vitest"
import { MAX_IN_FILTER_VALUES, submissionFilter } from "@/lib/realtime/submission-filter"

const id = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`

describe("submissionFilter", () => {
  it("builds a Realtime in-filter over the activity's task ids", () => {
    expect(submissionFilter([id(2), id(1)])).toBe(`challenge_id=in.(${id(1)},${id(2)})`)
  })

  it("is the same for the same tasks in any order, so it does not resubscribe", () => {
    expect(submissionFilter([id(3), id(1), id(2)])).toBe(submissionFilter([id(1), id(2), id(3), id(2)]))
  })

  it("is off with no tasks or past the Realtime limit", () => {
    expect(submissionFilter([])).toBeNull()
    const many = Array.from({ length: MAX_IN_FILTER_VALUES + 1 }, (_, i) => id(i + 1))
    expect(submissionFilter(many)).toBeNull()
    expect(submissionFilter(many.slice(0, MAX_IN_FILTER_VALUES))).not.toBeNull()
  })

  it("is off when an id is not a plain uuid (it goes into the filter text)", () => {
    expect(submissionFilter([id(1), "x),team_id=neq.(y"])).toBeNull()
  })
})
