import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateGameCode } from "@/lib/game/code-generator"
import { hashAnswer } from "@/lib/game/answer-hasher"

/**
 * Convert a saved lesson plan into a student activity (game).
 * Creates a new game with challenges derived from the lesson plan stages.
 */
export async function POST(
  request: Request,
  { params }: { params: { planId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
    }

    // Fetch lesson plan
    const { data: plan, error: planError } = await supabase
      .from("lesson_plans")
      .select("*")
      .eq("id", params.planId)
      .eq("teacher_id", user.id)
      .single()

    if (planError || !plan) {
      return NextResponse.json({ error: "Pamokos planas nerastas" }, { status: 404 })
    }

    // Create game
    const gameCode = generateGameCode()
    const { data: game, error: gameError } = await supabase
      .from("games")
      .insert({
        teacher_id: user.id,
        title: plan.title,
        description: `Veikla mokiniams pagal pamokos planą: ${plan.topic}`,
        game_code: gameCode,
        status: "draft",
        settings: {
          max_teams: 50,
          time_limit_minutes: plan.duration,
          show_leaderboard: true,
          shuffle_challenges: false,
        },
      })
      .select()
      .single()

    if (gameError || !game) {
      console.error("Game creation error:", gameError)
      return NextResponse.json({ error: "Nepavyko sukurti veiklos" }, { status: 500 })
    }

    // Convert stages to challenges
    const stages = (plan.stages as Array<{
      title: string
      description: string
      type: string
      correct_answer: string
      options: string[] | null
      hints: string[]
      explanation: string
      points: number
      difficulty: string
    }>) || []

    let successCount = 0
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i]
      const answerHash = await hashAnswer(String(stage.correct_answer))

      const { error: challengeError } = await supabase
        .from("challenges")
        .insert({
          game_id: game.id,
          title: stage.title,
          description: stage.description || "",
          type: stage.type,
          points: stage.points || 100,
          answer_hash: answerHash,
          hints: (stage.hints || []).slice(0, 10),
          options: stage.type === "multiple_choice" ? stage.options : null,
          explanation: stage.explanation || null,
          difficulty: stage.difficulty || null,
          order_index: i,
          generated_by_di: true,
        })

      if (!challengeError) successCount++
    }

    // Mark lesson plan as converted
    await supabase
      .from("lesson_plans")
      .update({ status: "converted", source_game_id: game.id })
      .eq("id", plan.id)

    return NextResponse.json({
      game_id: game.id,
      game_code: gameCode,
      challenges_created: successCount,
    })
  } catch (error) {
    console.error("Convert error:", error)
    return NextResponse.json({ error: "Konvertavimas nepavyko" }, { status: 500 })
  }
}
