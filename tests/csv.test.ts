import { describe, expect, it } from "vitest"
import { CSV_SEPARATOR, csvFileSlug, neutralizeFormula } from "@/lib/csv"

describe("CSV export", () => {
  it("uses the separator Lithuanian Excel expects", () => {
    expect(CSV_SEPARATOR).toBe(";")
  })

  it("makes a file name part from a Lithuanian title", () => {
    expect(csvFileSlug("Greičio ir pagreičio pamoka, 7 kl.")).toBe("greicio-ir-pagreicio-pamoka-7-kl")
    expect(csvFileSlug("   ")).toBe("veikla")
    expect(csvFileSlug("a".repeat(80)).length).toBe(40)
  })

  it("still neutralises formulas", () => {
    expect(neutralizeFormula("=1+1")).toBe("'=1+1")
    expect(neutralizeFormula("-5")).toBe("-5")
  })
})
