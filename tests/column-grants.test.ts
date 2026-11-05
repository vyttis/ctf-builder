import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync, statSync } from "fs"
import path from "path"

// Migration 00022 replaced the table-level SELECT grant on public.teams with
// column grants (session_token is hidden). PostgREST then rejects
// `teams(count)` embeds and `teams(*)` for anon/authenticated clients with
// "permission denied for table teams", which silently emptied the teacher
// dashboard. This guard keeps those embeds out of the codebase.
const ROOTS = ["app", "components", "lib"]
const FORBIDDEN = [/teams\(\s*count\s*\)/, /teams\(\s*\*\s*\)/]

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

describe("teams column grants", () => {
  it("no query embeds teams(count) or teams(*)", () => {
    const offenders = ROOTS.flatMap(walk).filter((file) => {
      const source = readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => !line.trim().startsWith("//"))
        .join("\n")
      return FORBIDDEN.some((re) => re.test(source))
    })
    expect(offenders).toEqual([])
  })
})
