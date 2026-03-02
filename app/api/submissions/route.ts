import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { z } from "zod"

const submitAnswerSchema = z.object({
  session_token: z.string().min(1),
  challenge_id: z.string().uuid(),
  answer: z.string().min(1, "Atsakymas privalomas"),
})

export async function POST(request: Request) {
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
    .select("id, status")
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

  // Get challenge details
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, points, game_id")
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

  // If correct, update team score atomically via RPC
  if (isCorrect) {
    await supabase.rpc("increment_team_score", {
      p_team_id: team.id,
      p_points: pointsAwarded,
    })
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
  })
}
