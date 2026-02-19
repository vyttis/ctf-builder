import { createClient } from "@/lib/supabase/server"
import { generateGameCode } from "@/lib/game/code-generator"
import { NextResponse } from "next/server"
import { z } from "zod"

const createGameSchema = z.object({
  title: z.string().min(3, "Pavadinimas turi būti bent 3 simbolių"),
  description: z.string().optional(),
  settings: z
    .object({
      max_teams: z.number().min(2).max(100).default(50),
      time_limit_minutes: z.number().nullable().default(null),
      show_leaderboard: z.boolean().default(true),
      shuffle_challenges: z.boolean().default(false),
    })
    .default({
      max_teams: 50,
      time_limit_minutes: null,
      show_leaderboard: true,
      shuffle_challenges: false,
    }),
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
  const parsed = createGameSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const gameCode = generateGameCode()

  const { data, error } = await supabase
    .from("games")
    .insert({
      teacher_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description || null,
      game_code: gameCode,
      settings: parsed.data.settings,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("games")
    .select("*, challenges(count)")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
