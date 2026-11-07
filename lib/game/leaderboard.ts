import type { AchievementType } from "@/types/game"

/**
 * The participant leaderboard as /api/play/leaderboard returns it: only what
 * the board shows. Since 20261107120000 participants cannot read teams,
 * results or achievements with the anon key, so the server builds this for
 * whoever has the activity code (as the open read allowed before).
 */
export type LeaderboardTeam = {
  id: string
  name: string
  total_points: number
  /** Tasks solved (distinct correct answers). */
  solved: number
  achievements: { id: string; type: AchievementType }[]
}

export type LeaderboardResponse =
  | { state: "ok"; teams: LeaderboardTeam[] }
  | { state: "disabled" }
  | { state: "not_found" }

/** Activities whose board participants may see (as the old anon policy). */
export const LEADERBOARD_STATUSES = ["active", "paused", "finished"] as const

export function leaderboardVisible(status: string | null | undefined): boolean {
  return (LEADERBOARD_STATUSES as readonly string[]).includes(status ?? "")
}

export function leaderboardDisabled(settings: unknown): boolean {
  return (settings as { show_leaderboard?: unknown } | null)?.show_leaderboard === false
}

type TeamRow = {
  id: string
  name: string
  total_points: number | null
  updated_at: string | null
  /** Correct answers only (the query filters them). */
  submissions?: { challenge_id: string }[] | null
}

type AchievementRow = { id: string; team_id: string; type: string; earned_at: string | null }

const ACHIEVEMENT_TYPES = new Set<string>(["first_solver", "speed_demon", "hint_free", "perfect_game", "streak"])

/** Most points first; on a tie, the team that got there earlier. */
export function buildLeaderboard(teams: TeamRow[], achievements: AchievementRow[]): LeaderboardTeam[] {
  const byTeam = new Map<string, AchievementRow[]>()
  for (const a of achievements) {
    if (!ACHIEVEMENT_TYPES.has(a.type)) continue
    const list = byTeam.get(a.team_id) ?? []
    list.push(a)
    byTeam.set(a.team_id, list)
  }
  return [...teams]
    .sort((a, b) => {
      const points = (b.total_points ?? 0) - (a.total_points ?? 0)
      if (points !== 0) return points
      return Date.parse(a.updated_at ?? "") - Date.parse(b.updated_at ?? "") || 0
    })
    .map((t) => ({
      id: t.id,
      name: t.name,
      total_points: t.total_points ?? 0,
      solved: new Set((t.submissions ?? []).map((s) => s.challenge_id)).size,
      achievements: (byTeam.get(t.id) ?? [])
        .sort((a, b) => Date.parse(a.earned_at ?? "") - Date.parse(b.earned_at ?? "") || 0)
        .map((a) => ({ id: a.id, type: a.type as AchievementType })),
    }))
}
