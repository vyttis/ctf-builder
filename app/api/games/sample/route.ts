import { createClient } from "@/lib/supabase/server"
import { generateGameCode } from "@/lib/game/code-generator"
import { hashAnswer } from "@/lib/game/answer-hasher"
import { SAMPLE_GAME, SAMPLE_CHALLENGES } from "@/lib/game/sample-game-content"
import { unauthorized, serverError } from "@/lib/api/responses"
import { NextResponse } from "next/server"

// POST /api/games/sample — seed a ready-made demo game with real answers so
// a new teacher can run the full loop (start -> QR -> solve -> results).
export async function POST() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return unauthorized()
    }

    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({
        teacher_id: user.id,
        title: SAMPLE_GAME.title,
        description: SAMPLE_GAME.description,
        game_code: generateGameCode(),
        status: "draft",
        settings: SAMPLE_GAME.settings,
      })
      .select()
      .single()

    if (gameError || !game) {
      return serverError(gameError?.message || "Nepavyko sukurti veiklos")
    }

    const challenges = await Promise.all(
      SAMPLE_CHALLENGES.map(async (c) => ({
        game_id: game.id,
        title: c.title,
        description: c.description,
        type: c.type,
        points: c.points,
        answer_hash: await hashAnswer(c.correct_answer, c.type),
        hints: c.hints,
        options: c.options,
        order_index: c.order_index,
        explanation: c.explanation,
        difficulty: c.difficulty,
      }))
    )

    const { error: challengeError } = await supabase
      .from("challenges")
      .insert(challenges)

    if (challengeError) {
      // Clean up the empty shell rather than leaving a broken demo
      await supabase.from("games").delete().eq("id", game.id)
      return serverError("Nepavyko sukurti demonstracinių užduočių")
    }

    return NextResponse.json(
      { game_id: game.id, game_code: game.game_code },
      { status: 201 }
    )
  } catch (error: unknown) {
    return serverError(
      error instanceof Error ? error.message : "Serverio klaida"
    )
  }
}
