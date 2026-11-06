import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync, statSync } from "fs"
import path from "path"

// A date written with toLocale…String on the server (UTC) and again in the
// browser (Vilnius) differs by two or three hours: React then throws a
// hydration error (#418) and the facilitator may see a wrong time. Every
// such call names the time zone.
const ROOTS = ["app", "components"]
const CALL = /toLocale(?:Date|Time)?String\(\s*"lt-LT"\s*(?:\)|,\s*\{([^}]*)\})/g

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.tsx?$/.test(name) ? [full] : []
  })
}

describe("dates on pages", () => {
  it("name the Europe/Vilnius time zone", () => {
    const offenders: string[] = []
    for (const file of ROOTS.flatMap(walk)) {
      const source = readFileSync(file, "utf8")
      for (const match of source.matchAll(CALL)) {
        if (!match[1] || !/timeZone/.test(match[1])) {
          const line = source.slice(0, match.index).split("\n").length
          offenders.push(`${file}:${line}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
