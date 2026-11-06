import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync, statSync } from "fs"
import path from "path"

// Migration 00022 replaced the table-level SELECT grant on public.teams with
// column grants (session_token is hidden). PostgREST then rejects
// `teams(count)` embeds and `teams(*)` for anon/authenticated clients with
// "permission denied for table teams", which silently emptied the teacher
// dashboard. This guard keeps those embeds out of the codebase.
const ROOTS = ["app", "components", "lib"]
// 20261106120000 did the same for challenges (answer_hash, answer) and
// submissions, so their count and star embeds fail the same way.
const FORBIDDEN = [/\b(teams|challenges|submissions)\(\s*(count|\*)\s*\)/]

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

describe("column grants", () => {
  it("no query embeds teams, challenges or submissions with (count) or (*)", () => {
    const offenders = ROOTS.flatMap(walk).filter((file) => {
      const source = readFileSync(file, "utf8")
        .split("\n")
        .filter((line) => !/^(\/\/|\*|\/\*)/.test(line.trim()))
        .join("\n")
      return FORBIDDEN.some((re) => re.test(source))
    })
    expect(offenders).toEqual([])
  })
})
