import { describe, expect, it } from "vitest"
import { readdirSync } from "fs"
import path from "path"

// The Supabase CLI keys supabase_migrations.schema_migrations on the version
// (the digits before the first underscore) and compares versions as strings.
// Two files with one version cannot both be recorded, so `migration list` and
// `db push` stop working. 00007 is the one known duplicate; the repair
// procedure in docs/migration-history.md renames 00007_bcrypt_answer_hash to
// 000071 before the history is recorded. No new duplicates may appear.
const DIR = path.join(__dirname, "..", "supabase", "migrations")
const KNOWN_DUPLICATES = new Set(["00007"])
const files = readdirSync(DIR).filter((name) => name.endsWith(".sql"))
const versionOf = (name: string) => /^([0-9]+)_.+\.sql$/.exec(name)?.[1]

describe("migration versions", () => {
  it("every file is named <version>_<name>.sql", () => {
    expect(files.filter((name) => versionOf(name) === undefined)).toEqual([])
  })

  it("versions are unique apart from the documented 00007 pair", () => {
    const counts = new Map<string, number>()
    for (const name of files) {
      const version = versionOf(name)!
      counts.set(version, (counts.get(version) ?? 0) + 1)
    }
    const duplicates = [...counts].filter(([, n]) => n > 1).map(([v]) => v)
    expect(duplicates.filter((v) => !KNOWN_DUPLICATES.has(v))).toEqual([])
  })

  it("new migrations use 14-digit timestamps after every earlier version", () => {
    const versions = files.map((name) => versionOf(name)!).sort()
    const timestamps = versions.filter((v) => v.length === 14)
    // Legacy five- and six-digit versions sort before all timestamps.
    expect(versions.slice(versions.length - timestamps.length)).toEqual(timestamps)
    expect(versions.filter((v) => v.length !== 14 && v.length !== 5 && v.length !== 6)).toEqual([])
    expect(timestamps.length).toBeGreaterThan(0)
  })
})
