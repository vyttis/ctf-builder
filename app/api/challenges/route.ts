import { createClient } from "@/lib/supabase/server"
import { normalizeAnswer } from "@/lib/game/answer-hasher"
import { NextResponse } from "next/server"
import { z } from "zod"

const createChallengeSchema = z.object({
  game_id: z.string().uuid(),
  title: z.string().min(1, "Pavadinimas privalomas"),
  description: z.string().default(""),
  type: z.enum(["text", "number", "multiple_choice"]).default("text"),
  points: z.number().min(1).max(1000).default(100),
  correct_answer: z.string().min(1, "Atsakymas privalomas"),
  hints: z.array(z.string()).default([]),
  options: z.array(z.string()).nullable().default(null),
  order_index: z.number().default(0),
  image_url: z.string().url().nullable().optional(),
  maps_url: z.string().url().nullable().optional(),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createChallengeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    )
  }

  // Verify game ownership
  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("id", parsed.data.game_id)
    .eq("teacher_id", user.id)
    .single()

  if (!game) {
    return NextResponse.json(
      { error: "Žaidimas nerastas" },
      { status: 404 }
    )
  }

  // Get next order_index if not specified
  let orderIndex = parsed.data.order_index
  if (orderIndex === 0) {
    const { count } = await supabase
      .from("challenges")
      .select("*", { count: "exact", head: true })
      .eq("game_id", parsed.data.game_id)

    orderIndex = (count || 0)
  }

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      game_id: parsed.data.game_id,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      points: parsed.data.points,
      answer_hash: normalizeAnswer(parsed.data.correct_answer),
      hints: parsed.data.hints,
      options: parsed.data.options,
      order_index: orderIndex,
      image_url: parsed.data.image_url ?? null,
      maps_url: parsed.data.maps_url ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get("game_id")

  if (!gameId) {
    return NextResponse.json(
      { error: "game_id privalomas" },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .eq("game_id", gameId)
    .order("order_index", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
