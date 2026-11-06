import { createClient } from "@/lib/supabase/server"
import { withChallengeCount } from "@/lib/game/challenge-count"
import { generateGameCode } from "@/lib/game/code-generator"
import { NextResponse } from "next/server"
import { z } from "zod"

const createGameSchema = z.object({
  title: z.string().min(3, "Pavadinimas turi būti bent 3 simbolių"),
  description: z.string().optional(),
  settings: z
    .object({
      max_teams: z.number().min(2).max(100).default(50),
      time_limit_minutes: z.number().int().min(1).max(1440).nullable().default(null),
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

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Netinkamas užklausos formatas" }, { status: 400 })
  }

  const parsed = createGameSchema.safeParse(body)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Neteisingi duomenys"
    return NextResponse.json(
      { error: firstError },
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
    console.error("Game INSERT error:", error)
    return NextResponse.json({ error: "Nepavyko sukurti veiklos. Bandykite dar kartą." }, { status: 500 })
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
    .select("*, challenges(id)")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Games SELECT error:", error)
    return NextResponse.json({ error: "Nepavyko gauti veiklų sąrašo." }, { status: 500 })
  }

  // challenges(count) is rejected under column grants; see challenge-count.ts
  return NextResponse.json((data ?? []).map(withChallengeCount))
}
