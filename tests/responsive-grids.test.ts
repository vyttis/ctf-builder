import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

// A grid with only breakpoint columns (`grid sm:grid-cols-2`) falls back to an
// implicit `auto` track on phones. One `truncate` title inside it then sizes
// the track to its full text and the page scrolls sideways (the teacher
// dashboard grew to 800px wide on a 390px phone). `grid-cols-1` gives the
// mobile track `minmax(0, 1fr)`.

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return tsxFiles(path)
    return path.endsWith(".tsx") ? [path] : []
  })
}

const CLASS_ATTR = /className=(?:"([^"]*)"|\{`([^`]*)`\})/g
const BREAKPOINT_COLS = /^(sm|md|lg|xl|2xl):grid-cols-/
const BASE_COLS = /^grid-cols-/

describe("responsive grids", () => {
  it("define a mobile column template", () => {
    const offenders: string[] = []
    for (const file of [...tsxFiles("app"), ...tsxFiles("components")]) {
      const source = readFileSync(file, "utf8")
      for (const match of source.matchAll(CLASS_ATTR)) {
        const tokens = (match[1] ?? match[2] ?? "").split(/\s+/)
        if (
          tokens.includes("grid") &&
          tokens.some((t) => BREAKPOINT_COLS.test(t)) &&
          !tokens.some((t) => BASE_COLS.test(t))
        ) {
          const line = source.slice(0, match.index).split("\n").length
          offenders.push(`${file}:${line}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
