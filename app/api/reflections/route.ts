import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { z } from "zod"

const reflectionSchema = z.object({
  session_token: z.string().min(1),
  hardest_challenge_id: z.string().uuid().nullable(),
  improvement_text: z.string().min(1, "Tekstas privalomas").max(500),
  liked_text: z.string().max(300).nullable().optional(),
})

// POST /api/reflections — player submits post-game reflection
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = reflectionSchema.safeParse(body)

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
      .select("id, game_id")
      .eq("session_token", parsed.data.session_token)
      .single()

    if (!team) {
      return NextResponse.json(
        { error: "Sesija nerasta. Prisijunkite iš naujo." },
        { status: 401 }
      )
    }

    // If hardest_challenge_id provided, verify it belongs to this game
    if (parsed.data.hardest_challenge_id) {
      const { data: challenge } = await supabase
        .from("challenges")
        .select("id")
        .eq("id", parsed.data.hardest_challenge_id)
        .eq("game_id", team.game_id)
        .single()

      if (!challenge) {
        return NextResponse.json(
          { error: "Užduotis nerasta" },
          { status: 400 }
        )
      }
    }

    // Insert reflection
    const { error } = await supabase.from("reflections").insert({
      game_id: team.game_id,
      team_id: team.id,
      hardest_challenge_id: parsed.data.hardest_challenge_id,
      improvement_text: parsed.data.improvement_text,
      liked_text: parsed.data.liked_text || null,
    })

    if (error) {
      // Unique constraint violation — already submitted
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Refleksija jau pateikta" },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Serverio klaida" },
      { status: 500 }
    )
  }
}
