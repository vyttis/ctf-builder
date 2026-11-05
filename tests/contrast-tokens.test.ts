import { describe, expect, it } from "vitest"
import { readdirSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"

// White text on the brand green (#00D296) is 2:1, far below the 4.5:1 that
// WCAG AA asks for body text. Green surfaces take `text-primary-foreground`
// (navy, 6.9:1) instead.

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return tsxFiles(path)
    return path.endsWith(".tsx") ? [path] : []
  })
}

const STRING_LITERAL = /(["`])([^"`\n]*?)\1/g
const SOLID_GREEN = /^bg-(primary|steam-green)$/

describe("contrast tokens", () => {
  it("never put white text on the brand green", () => {
    const offenders: string[] = []
    for (const file of [...tsxFiles("app"), ...tsxFiles("components")]) {
      const source = readFileSync(file, "utf8")
      for (const match of source.matchAll(STRING_LITERAL)) {
        const tokens = match[2].split(/\s+/)
        if (tokens.some((t) => SOLID_GREEN.test(t)) && tokens.includes("text-white")) {
          const line = source.slice(0, match.index).split("\n").length
          offenders.push(`${file}:${line}`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
