import { createAdminClient } from "@/lib/supabase/admin"
import { verifyAnswer } from "@/lib/game/answer-hasher"
import { evaluateAchievements, saveAchievements } from "@/lib/game/achievements"
import { pluralizeLt } from "@/lib/utils"
import { NextResponse } from "next/server"
import { z } from "zod"

const submitAnswerSchema = z.object({
  session_token: z.string().min(1),
  challenge_id: z.string().uuid(),
  answer: z.string().min(1, "Atsakymas privalomas"),
  hints_used: z.number().int().min(0).max(20).default(0),
})

export async function POST(request: Request) {
  try {
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Netinkamas užklausos formatas" }, { status: 400 })
    }

    const parsed = submitAnswerSchema.safeParse(body)

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "Neteisingi duomenys"
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Validate team via session_token first — every other query depends on team.id/game_id.
    // started_at drives the server-side time-limit check below; tolerate its
    // absence (migration 00023 not applied yet) with a column-less retry.
    let team: {
      id: string
      game_id: string
      total_points: number
      current_challenge_index: number
      started_at?: string | null
    } | null = null
    {
      const withStart = await supabase
        .from("teams")
        .select("id, game_id, total_points, current_challenge_index, started_at")
        .eq("session_token", parsed.data.session_token)
        .maybeSingle()
      if (withStart.error?.code === "42703") {
        const legacy = await supabase
          .from("teams")
          .select("id, game_id, total_points, current_challenge_index")
          .eq("session_token", parsed.data.session_token)
          .maybeSingle()
        team = legacy.data
      } else {
        team = withStart.data
      }
    }

    if (!team) {
      return NextResponse.json(
        { error: "Sesija nerasta. Prisijunkite iš naujo." },
        { status: 401 }
      )
    }

    // Parallel fan-out: game status, existing solve, rate-limit count, challenge
    // details, and server-recorded hint reveals for this challenge.
    // Was sequential round-trips; now one ~50-100ms wait.
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
    const [gameRes, existingSolveRes, recentAttemptsRes, challengeRes, hintRevealsRes] = await Promise.all([
      supabase
        .from("games")
        .select("id, status, settings")
        .eq("id", team.game_id)
        .single(),
      supabase
        .from("submissions")
        .select("id")
        .eq("team_id", team.id)
        .eq("challenge_id", parsed.data.challenge_id)
        .eq("is_correct", true)
        .maybeSingle(),
      // Count only WRONG submissions for rate-limit — don't penalize a team
      // that's correctly solving a fast streak of challenges.
      supabase
        .from("submissions")
        .select("*", { count: "exact", head: true })
        .eq("team_id", team.id)
        .eq("is_correct", false)
        .gte("attempted_at", oneMinuteAgo),
      supabase
        .from("challenges")
        .select("id, points, game_id, explanation, hint_penalty, hints, answer_hash")
        .eq("id", parsed.data.challenge_id)
        .single(),
      // Authoritative hint count (00024). If the table is missing the query
      // errors and we fall back to the client-declared count below.
      supabase
        .from("hint_reveals")
        .select("*", { count: "exact", head: true })
        .eq("team_id", team.id)
        .eq("challenge_id", parsed.data.challenge_id),
    ])

    const game = gameRes.data
    const existingSolve = existingSolveRes.data
    const recentAttempts = recentAttemptsRes.count
    const challenge = challengeRes.data

    if (!game || game.status !== "active") {
      const statusMessages: Record<string, string> = {
        draft: "Žaidimas dar neprasidėjo.",
        paused: "Žaidimas pristabdytas. Palaukite, kol mokytojas tęs.",
        finished: "Žaidimas baigtas!",
      }
      return NextResponse.json(
        { error: statusMessages[game?.status ?? ""] || "Žaidimas nepasiekiamas" },
        { status: 403 }
      )
    }

    if (existingSolve) {
      return NextResponse.json({
        is_correct: true,
        points_awarded: 0,
        message: "Ši užduotis jau išspręsta!",
        already_solved: true,
      })
    }

    if (recentAttempts && recentAttempts >= 10) {
      return NextResponse.json(
        { error: "Per daug bandymų. Palaukite minutę." },
        { status: 429 }
      )
    }

    const gameSettings = (game.settings as Record<string, unknown>) || {}

    // Server-side time limit: reject submissions past the team's deadline.
    // Anchored on teams.started_at (stamped by /api/play/start), not a
    // client clock, so clearing localStorage / switching devices can't buy
    // extra time. Skipped when there's no limit or the team hasn't started
    // (started_at NULL, or column absent on an unmigrated DB).
    const timeLimitMinutes =
      typeof gameSettings.time_limit_minutes === "number"
        ? gameSettings.time_limit_minutes
        : null
    if (timeLimitMinutes && team.started_at) {
      const deadlineMs =
        new Date(team.started_at).getTime() + timeLimitMinutes * 60_000
      if (Date.now() > deadlineMs) {
        return NextResponse.json(
          { error: "Laikas baigėsi. Rezultatai išsaugoti." },
          { status: 403 }
        )
      }
    }

    // In free mode, verify challenge is unlocked
    const pathMode = (gameSettings.challenge_path_mode as string) || "linear"

    if (pathMode === "free") {
      const { data: unlocked } = await supabase.rpc("is_challenge_unlocked", {
        p_team_id: team.id,
        p_challenge_id: parsed.data.challenge_id,
      })

      if (unlocked === false) {
        return NextResponse.json(
          { error: "Ši užduotis dar neprieinama. Pirmiausia išspręskite reikalingas užduotis." },
          { status: 403 }
        )
      }
    }

    if (!challenge || challenge.game_id !== team.game_id) {
      return NextResponse.json(
        { error: "Užduotis nerasta" },
        { status: 404 }
      )
    }

    // Verify answer server-side with bcrypt (supports legacy plaintext hashes)
    const isCorrect = await verifyAnswer(parsed.data.answer, challenge.answer_hash)

    // Hint penalty from server-recorded reveals (00024), not the client-declared
    // count — otherwise a student could reveal hints and submit hints_used: 0.
    // Falls back to the client count only when the table is missing (the count
    // query errors and hintRevealsRes.count is null on an unmigrated DB).
    const availableHints = Array.isArray(challenge.hints) ? challenge.hints.length : 0
    const serverHintCount =
      typeof hintRevealsRes.count === "number" ? hintRevealsRes.count : null
    const hintsUsed = Math.min(
      serverHintCount ?? parsed.data.hints_used,
      availableHints
    )
    const hintPenalty = hintsUsed * (challenge.hint_penalty || 0)
    const pointsAwarded = isCorrect ? Math.max(0, challenge.points - hintPenalty) : 0

    // Record submission with hints_used. The insert result MUST be checked:
    // two concurrent submits can both pass the existingSolve guard above, and
    // the loser hits idx_submissions_unique_solve (23505). Skipping the check
    // would double-award points via increment_team_score below.
    const { error: insertError } = await supabase.from("submissions").insert({
      team_id: team.id,
      challenge_id: parsed.data.challenge_id,
      answer: parsed.data.answer,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
      hints_used: hintsUsed,
    })

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json({
          is_correct: true,
          points_awarded: 0,
          message: "Ši užduotis jau išspręsta!",
          already_solved: true,
        })
      }
      console.error("Submission insert failed:", insertError.message)
      return NextResponse.json(
        { error: "Nepavyko išsaugoti atsakymo. Bandykite dar kartą." },
        { status: 500 }
      )
    }

    // If correct, update team score atomically via RPC
    let earnedAchievements: { type: string; challengeId: string | null; metadata: Record<string, unknown> }[] = []

    if (isCorrect) {
      const { error: scoreError } = await supabase.rpc("increment_team_score", {
        p_team_id: team.id,
        p_points: pointsAwarded,
      })
      if (scoreError) {
        // The submission is already stored; without this log a failed score
        // update stays invisible (as it did for two teams in March 2026).
        console.error(
          JSON.stringify({
            event: "team_score_update_failed",
            team_id: team.id,
            code: scoreError.code,
            message: scoreError.message,
          })
        )
      }

      // Evaluate and save achievements
      try {
        const { count: totalChallenges } = await supabase
          .from("challenges")
          .select("*", { count: "exact", head: true })
          .eq("game_id", team.game_id)

        const achievements = await evaluateAchievements(supabase, {
          teamId: team.id,
          gameId: team.game_id,
          challengeId: parsed.data.challenge_id,
          hintsUsed: hintsUsed,
          totalChallengesInGame: totalChallenges || 0,
        })

        if (achievements.length > 0) {
          await saveAchievements(supabase, team.game_id, team.id, achievements)
          earnedAchievements = achievements
        }
      } catch (err) {
        // Don't fail the submission if achievements fail
        console.error("Achievement evaluation error:", err)
      }
    }

    // Fetch updated team score for accurate response
    const newTotalPoints = isCorrect
      ? team.total_points + pointsAwarded
      : team.total_points

    return NextResponse.json({
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
      message: isCorrect
        ? `Teisingai! +${pointsAwarded} ${pluralizeLt(pointsAwarded, "taškas", "taškai", "taškų")}`
        : "Neteisingai. Bandykite dar kartą!",
      total_points: newTotalPoints,
      explanation: isCorrect ? (challenge.explanation || null) : null,
      achievements: earnedAchievements,
    })
  } catch (err) {
    console.error("Submissions API error:", err)
    return NextResponse.json(
      { error: "Serverio klaida. Bandykite dar kartą." },
      { status: 500 }
    )
  }
}
