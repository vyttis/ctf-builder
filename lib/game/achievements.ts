import { SupabaseClient } from "@supabase/supabase-js"

export type AchievementType =
  | "first_solver"
  | "speed_demon"
  | "hint_free"
  | "perfect_game"
  | "streak"

export interface AchievementEvalContext {
  teamId: string
  gameId: string
  challengeId: string
  hintsUsed: number
  totalChallengesInGame: number
}

export interface EarnedAchievement {
  type: AchievementType
  challengeId: string | null
  metadata: Record<string, unknown>
}

export const ACHIEVEMENT_CONFIG: Record<
  AchievementType,
  { name: string; icon: string; color: string }
> = {
  first_solver: { name: "Pirmas sprendėjas", icon: "Crown", color: "#FAC846" },
  speed_demon: { name: "Greičio demonas", icon: "Zap", color: "#FA2864" },
  hint_free: { name: "Be užuominų", icon: "Brain", color: "#00D296" },
  perfect_game: { name: "Tobulas žaidimas", icon: "Trophy", color: "#FAC846" },
  streak: { name: "Sėkmės serija", icon: "Flame", color: "#008CB4" },
}

/**
 * Evaluate which achievements a team has earned after a correct submission.
 */
export async function evaluateAchievements(
  supabase: SupabaseClient,
  ctx: AchievementEvalContext
): Promise<EarnedAchievement[]> {
  const earned: EarnedAchievement[] = []

  // Run independent checks in parallel
  const [firstSolver, speedDemon, streakResult, perfectGame] =
    await Promise.all([
      checkFirstSolver(supabase, ctx),
      checkSpeedDemon(supabase, ctx),
      checkStreak(supabase, ctx),
      checkPerfectGame(supabase, ctx),
    ])

  if (firstSolver) earned.push(firstSolver)
  if (ctx.hintsUsed === 0) {
    earned.push({
      type: "hint_free",
      challengeId: ctx.challengeId,
      metadata: {},
    })
  }
  if (speedDemon) earned.push(speedDemon)
  if (perfectGame) earned.push(perfectGame)
  if (streakResult) earned.push(streakResult)

  return earned
}

async function checkFirstSolver(
  supabase: SupabaseClient,
  ctx: AchievementEvalContext
): Promise<EarnedAchievement | null> {
  const { count } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("challenge_id", ctx.challengeId)
    .eq("is_correct", true)
    .neq("team_id", ctx.teamId)

  if (count === 0) {
    return {
      type: "first_solver",
      challengeId: ctx.challengeId,
      metadata: {},
    }
  }

  return null
}

async function checkSpeedDemon(
  supabase: SupabaseClient,
  ctx: AchievementEvalContext
): Promise<EarnedAchievement | null> {
  // Get the team's first attempt on this challenge
  const { data: firstAttempt } = await supabase
    .from("submissions")
    .select("attempted_at")
    .eq("team_id", ctx.teamId)
    .eq("challenge_id", ctx.challengeId)
    .order("attempted_at", { ascending: true })
    .limit(1)
    .single()

  if (!firstAttempt) return null

  const firstAttemptTime = new Date(firstAttempt.attempted_at).getTime()
  const now = Date.now()
  const diffSeconds = (now - firstAttemptTime) / 1000

  if (diffSeconds < 60) {
    return {
      type: "speed_demon",
      challengeId: ctx.challengeId,
      metadata: { solve_seconds: Math.round(diffSeconds) },
    }
  }

  return null
}

async function checkPerfectGame(
  supabase: SupabaseClient,
  ctx: AchievementEvalContext
): Promise<EarnedAchievement | null> {
  // Get all correct submissions for this team in this game
  const { data: correctSubmissions } = await supabase
    .from("submissions")
    .select("id, hints_used, challenge_id")
    .eq("team_id", ctx.teamId)
    .eq("is_correct", true)
    .in(
      "challenge_id",
      // Subquery: all challenge IDs in this game
      (
        await supabase
          .from("challenges")
          .select("id")
          .eq("game_id", ctx.gameId)
      ).data?.map((c) => c.id) ?? []
    )

  if (!correctSubmissions) return null

  // Deduplicate by challenge_id (take the first correct per challenge)
  const uniqueChallenges = new Set(
    correctSubmissions.map((s) => s.challenge_id)
  )

  if (uniqueChallenges.size !== ctx.totalChallengesInGame) return null

  // Check all had zero hints
  const allHintFree = correctSubmissions.every(
    (s) => (s.hints_used ?? 0) === 0
  )
  if (!allHintFree) return null

  return {
    type: "perfect_game",
    challengeId: null,
    metadata: { challenges_solved: ctx.totalChallengesInGame },
  }
}

async function checkStreak(
  supabase: SupabaseClient,
  ctx: AchievementEvalContext
): Promise<EarnedAchievement | null> {
  // Get all submissions for this team in this game, ordered by time
  const { data: challengeIds } = await supabase
    .from("challenges")
    .select("id")
    .eq("game_id", ctx.gameId)

  if (!challengeIds?.length) return null

  const { data: submissions } = await supabase
    .from("submissions")
    .select("is_correct, attempted_at")
    .eq("team_id", ctx.teamId)
    .in(
      "challenge_id",
      challengeIds.map((c) => c.id)
    )
    .order("attempted_at", { ascending: true })

  if (!submissions?.length) return null

  // Count consecutive correct answers from the end
  let streakCount = 0
  for (let i = submissions.length - 1; i >= 0; i--) {
    if (submissions[i].is_correct) {
      streakCount++
    } else {
      break
    }
  }

  if (streakCount < 3) return null

  // Check if we already have a streak achievement with same or higher count
  const { data: existing } = await supabase
    .from("achievements")
    .select("metadata")
    .eq("game_id", ctx.gameId)
    .eq("team_id", ctx.teamId)
    .eq("type", "streak")
    .is("challenge_id", null)
    .maybeSingle()

  if (existing) {
    const existingCount =
      (existing.metadata as Record<string, unknown>)?.streak_count
    if (typeof existingCount === "number" && existingCount >= streakCount) {
      return null
    }
  }

  return {
    type: "streak",
    challengeId: null,
    metadata: { streak_count: streakCount },
  }
}

/**
 * Persist earned achievements with conflict ignore (upsert).
 */
export async function saveAchievements(
  supabase: SupabaseClient,
  gameId: string,
  teamId: string,
  achievements: EarnedAchievement[]
): Promise<void> {
  if (achievements.length === 0) return

  const rows = achievements.map((a) => ({
    game_id: gameId,
    team_id: teamId,
    type: a.type,
    challenge_id: a.challengeId,
    metadata: a.metadata,
  }))

  // For streak achievements, we need to update metadata if streak grew.
  // Handle streak separately with an upsert, others with insert-ignore.
  const streakAchievements = rows.filter((r) => r.type === "streak")
  const otherAchievements = rows.filter((r) => r.type !== "streak")

  if (otherAchievements.length > 0) {
    // Insert with onConflict ignore — uses the partial unique indexes
    // Since Supabase JS doesn't support partial index conflict targets directly,
    // we insert one-by-one and ignore errors for duplicates.
    await Promise.all(
      otherAchievements.map((row) =>
        supabase.from("achievements").insert(row).select().maybeSingle()
      )
    )
  }

  if (streakAchievements.length > 0) {
    for (const streak of streakAchievements) {
      // Delete old streak and insert new one (streak can only grow)
      await supabase
        .from("achievements")
        .delete()
        .eq("game_id", gameId)
        .eq("team_id", teamId)
        .eq("type", "streak")
        .is("challenge_id", null)

      await supabase.from("achievements").insert(streak)
    }
  }
}
