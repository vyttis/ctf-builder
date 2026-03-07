import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/games/[gameId]/analytics/detailed — per-challenge detailed stats
export async function GET(
  _request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Neprisijungęs" }, { status: 401 })
    }

    // Verify game access
    const { data: game } = await supabase
      .from("games")
      .select("id, teacher_id")
      .eq("id", params.gameId)
      .maybeSingle()

    if (!game) {
      return NextResponse.json({ error: "Žaidimas nerastas" }, { status: 404 })
    }

    if (game.teacher_id !== user.id) {
      const { data: roleData } = await supabase.rpc("get_my_role")
      if (!roleData || !["admin", "super_admin"].includes(roleData as string)) {
        return NextResponse.json({ error: "Neturite prieigos" }, { status: 403 })
      }
    }

    // Get challenges
    const { data: challenges } = await supabase
      .from("challenges")
      .select("id, title, points, order_index, difficulty, type")
      .eq("game_id", params.gameId)
      .order("order_index", { ascending: true })

    if (!challenges) {
      return NextResponse.json({ challenge_stats: [] })
    }

    // Get all submissions for this game's challenges
    const challengeIds = challenges.map((c) => c.id)
    const { data: submissions } = await supabase
      .from("submissions")
      .select("challenge_id, is_correct, points_awarded, team_id")
      .in("challenge_id", challengeIds)

    // Get team count
    const { count: teamCount } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("game_id", params.gameId)

    // Compute per-challenge stats
    const challengeStats = challenges.map((challenge) => {
      const subs = (submissions || []).filter(
        (s) => s.challenge_id === challenge.id
      )
      const totalAttempts = subs.length
      const correctSubs = subs.filter((s) => s.is_correct)
      const solves = correctSubs.length

      // Unique teams that solved
      const solvedTeams = new Set(correctSubs.map((s) => s.team_id))
      const uniqueSolves = solvedTeams.size

      // Accuracy
      const accuracy = totalAttempts > 0 ? solves / totalAttempts : 0

      // Auto-difficulty based on accuracy
      let autoDifficulty: string
      if (totalAttempts < 3) {
        autoDifficulty = "unknown"
      } else if (accuracy < 0.3) {
        autoDifficulty = "hard"
      } else if (accuracy < 0.7) {
        autoDifficulty = "medium"
      } else {
        autoDifficulty = "easy"
      }

      // Completion rate
      const completionRate =
        teamCount && teamCount > 0 ? uniqueSolves / teamCount : 0

      // Avg attempts to solve (only for teams that solved)
      let avgAttemptsToSolve = 0
      if (uniqueSolves > 0) {
        const attemptsPerTeam = new Map<string, number>()
        for (const sub of subs) {
          const current = attemptsPerTeam.get(sub.team_id) || 0
          attemptsPerTeam.set(sub.team_id, current + 1)
          if (sub.is_correct) break // count up to first correct
        }
        const totalAttemptsForSolvers = Array.from(solvedTeams).reduce(
          (sum, teamId) => sum + (attemptsPerTeam.get(teamId) || 0),
          0
        )
        avgAttemptsToSolve = totalAttemptsForSolvers / uniqueSolves
      }

      return {
        challenge_id: challenge.id,
        title: challenge.title,
        order_index: challenge.order_index,
        points: challenge.points,
        type: challenge.type,
        difficulty: challenge.difficulty,
        total_attempts: totalAttempts,
        solves: uniqueSolves,
        accuracy: Math.round(accuracy * 100),
        completion_rate: Math.round(completionRate * 100),
        avg_attempts_to_solve: Math.round(avgAttemptsToSolve * 10) / 10,
        auto_difficulty: autoDifficulty,
      }
    })

    return NextResponse.json({
      challenge_stats: challengeStats,
      total_teams: teamCount || 0,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Serverio klaida" },
      { status: 500 }
    )
  }
}
