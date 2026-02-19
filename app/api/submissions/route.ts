import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { z } from "zod"

const submitAnswerSchema = z.object({
  session_token: z.string().min(1),
  challenge_id: z.string().uuid(),
  answer: z.string().min(1, "Atsakymas privalomas"),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = submitAnswerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
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

  // Get challenge details
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, points, answer_hash, game_id")
    .eq("id", parsed.data.challenge_id)
    .single()

  if (!challenge || challenge.game_id !== team.game_id) {
    return NextResponse.json(
      { error: "Užduotis nerasta" },
      { status: 404 }
    )
  }

  // Check answer using Postgres function
  const { data: isCorrectResult } = await supabase.rpc("check_answer", {
    p_challenge_id: parsed.data.challenge_id,
    p_answer: parsed.data.answer,
  })

  const isCorrect = isCorrectResult === true
  const pointsAwarded = isCorrect ? challenge.points : 0

  // Record submission
  await supabase.from("submissions").insert({
    team_id: team.id,
    challenge_id: parsed.data.challenge_id,
    answer: parsed.data.answer,
    is_correct: isCorrect,
    points_awarded: pointsAwarded,
  })

  // If correct, update team score
  if (isCorrect) {
    await supabase
      .from("teams")
      .update({
        total_points: team.total_points + pointsAwarded,
        current_challenge_index: team.current_challenge_index + 1,
      })
      .eq("id", team.id)
  }

  return NextResponse.json({
    is_correct: isCorrect,
    points_awarded: pointsAwarded,
    message: isCorrect
      ? `Teisingai! +${pointsAwarded} taškų 🎉`
      : "Neteisingai. Bandykite dar kartą!",
    total_points: isCorrect
      ? team.total_points + pointsAwarded
      : team.total_points,
  })
}
