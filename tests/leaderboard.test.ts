import { readdirSync, readFileSync, statSync } from "fs"
import path from "path"
import { describe, expect, it } from "vitest"
import { buildLeaderboard, leaderboardDisabled, leaderboardVisible } from "@/lib/game/leaderboard"

describe("participant leaderboard", () => {
  const teams = [
    { id: "a", name: "Antra", total_points: 100, updated_at: "2026-11-07T10:05:00Z", submissions: [{ challenge_id: "c1" }] },
    {
      id: "b",
      name: "Pirma",
      total_points: 100,
      updated_at: "2026-11-07T10:01:00Z",
      submissions: [{ challenge_id: "c1" }, { challenge_id: "c2" }, { challenge_id: "c2" }],
    },
    { id: "c", name: "Trečia", total_points: 0, updated_at: "2026-11-07T10:00:00Z", submissions: [] },
  ]

  it("orders by points, then by who got there first", () => {
    expect(buildLeaderboard(teams, []).map((t) => t.id)).toEqual(["b", "a", "c"])
  })

  it("counts distinct solved tasks and keeps only what the board shows", () => {
    const [first] = buildLeaderboard(teams, [])
    expect(first).toEqual({ id: "b", name: "Pirma", total_points: 100, solved: 2, achievements: [] })
    expect(Object.keys(first).sort()).toEqual(["achievements", "id", "name", "solved", "total_points"])
  })

  it("groups badges per team in the order earned and drops unknown types", () => {
    const board = buildLeaderboard(teams, [
      { id: "x2", team_id: "a", type: "hint_free", earned_at: "2026-11-07T10:06:00Z" },
      { id: "x1", team_id: "a", type: "first_solver", earned_at: "2026-11-07T10:02:00Z" },
      { id: "x3", team_id: "a", type: "made_up", earned_at: "2026-11-07T10:03:00Z" },
    ])
    expect(board.find((t) => t.id === "a")?.achievements).toEqual([
      { id: "x1", type: "first_solver" },
      { id: "x2", type: "hint_free" },
    ])
  })

  it("is shown for running, paused and finished activities only", () => {
    expect(["active", "paused", "finished"].every(leaderboardVisible)).toBe(true)
    expect(leaderboardVisible("draft")).toBe(false)
    expect(leaderboardVisible(null)).toBe(false)
  })

  it("respects the facilitator turning the board off", () => {
    expect(leaderboardDisabled({ show_leaderboard: false })).toBe(true)
    expect(leaderboardDisabled({ show_leaderboard: true })).toBe(false)
    expect(leaderboardDisabled(null)).toBe(false)
  })
})

// 20261107120000: participants cannot read activities, teams or results with
// the anon key, so participant pages must not use the browser Supabase
// client at all; they read through /api/play/*.
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) return walk(full)
    return /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

describe("participant pages", () => {
  it("never use the browser Supabase client", () => {
    const offenders = walk("app/play").filter((file) => readFileSync(file, "utf8").includes("@/lib/supabase/client"))
    expect(offenders).toEqual([])
  })

  it("give the announcement banner the status poll's announcement", () => {
    for (const file of ["app/play/[gameCode]/play/page.tsx", "components/player/play-screens.tsx"]) {
      const banners = readFileSync(file, "utf8").match(/<AnnouncementBanner[^>]*>/g) ?? []
      expect(banners.length, file).toBeGreaterThan(0)
      for (const banner of banners) expect(banner, file).toContain("latest=")
    }
  })
})
