import { createAdminClient } from "@/lib/supabase/admin"
import { verifyAnswer } from "@/lib/game/answer-hasher"
import { evaluateAchievements, saveAchievements } from "@/lib/game/achievements"
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

    // Validate team via session_token
    const { data: team } = await supabase
      .from("teams")
      .select("id, game_id, total_points, current_challenge_index")
      .eq("session_token", parsed.data.session_token)
      .single()

    if (!team) {
      return NextResponse.json(
        { error: "Sesija nerasta. Prisijunkite iš naujo." },
        { status: 401 }
      )
    }

    // Check game is still active before accepting submissions
    const { data: game } = await supabase
      .from("games")
      .select("id, status, settings")
      .eq("id", team.game_id)
      .single()

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

    // Check if already solved this challenge
    const { data: existingSolve } = await supabase
      .from("submissions")
      .select("id")
      .eq("team_id", team.id)
      .eq("challenge_id", parsed.data.challenge_id)
      .eq("is_correct", true)
      .single()

    if (existingSolve) {
      return NextResponse.json({
        is_correct: true,
        points_awarded: 0,
        message: "Ši užduotis jau išspręsta!",
        already_solved: true,
      })
    }

    // Rate limiting: max 10 attempts per minute per team
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString()
    const { count: recentAttempts } = await supabase
      .from("submissions")
      .select("*", { count: "exact", head: true })
      .eq("team_id", team.id)
      .gte("attempted_at", oneMinuteAgo)

    if (recentAttempts && recentAttempts >= 10) {
      return NextResponse.json(
        { error: "Per daug bandymų. Palaukite minutę." },
        { status: 429 }
      )
    }

    // In free mode, verify challenge is unlocked
    const gameSettings = (game.settings as Record<string, unknown>) || {}
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

    // Get challenge details (include answer_hash for server-side bcrypt verification)
    const { data: challenge } = await supabase
      .from("challenges")
      .select("id, points, game_id, explanation, hint_penalty, hints, answer_hash")
      .eq("id", parsed.data.challenge_id)
      .single()

    if (!challenge || challenge.game_id !== team.game_id) {
      return NextResponse.json(
        { error: "Užduotis nerasta" },
        { status: 404 }
      )
    }

    // Verify answer server-side with bcrypt (supports legacy plaintext hashes)
    const isCorrect = await verifyAnswer(parsed.data.answer, challenge.answer_hash)

    // Server-side hint penalty: cap hints_used to actual available hints
    const availableHints = Array.isArray(challenge.hints) ? challenge.hints.length : 0
    const hintsUsed = Math.min(parsed.data.hints_used, availableHints)
    const hintPenalty = hintsUsed * (challenge.hint_penalty || 0)
    const pointsAwarded = isCorrect ? Math.max(0, challenge.points - hintPenalty) : 0

    // Record submission with hints_used
    await supabase.from("submissions").insert({
      team_id: team.id,
      challenge_id: parsed.data.challenge_id,
      answer: parsed.data.answer,
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
      hints_used: hintsUsed,
    })

    // If correct, update team score atomically via RPC
    let earnedAchievements: { type: string; challengeId: string | null; metadata: Record<string, unknown> }[] = []

    if (isCorrect) {
      await supabase.rpc("increment_team_score", {
        p_team_id: team.id,
        p_points: pointsAwarded,
      })

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
        ? `Teisingai! +${pointsAwarded} taškų`
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
