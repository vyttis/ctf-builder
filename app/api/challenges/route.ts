import { createClient } from "@/lib/supabase/server"
import { normalizeAnswer } from "@/lib/game/answer-hasher"
import { NextResponse } from "next/server"
import { z } from "zod"

// Safe columns to return (never include answer_hash)
const SAFE_CHALLENGE_COLUMNS = "id, game_id, title, description, type, points, hints, options, order_index, image_url, maps_url, generated_by_di, verification_verdict, verification_issues, verification_confidence, created_at, updated_at"

const createChallengeSchema = z.object({
  game_id: z.string().uuid(),
  title: z.string().min(1, "Pavadinimas privalomas").max(200),
  description: z.string().max(2000).default(""),
  type: z.enum(["text", "number", "multiple_choice"]).default("text"),
  points: z.number().min(1).max(1000).default(100),
  correct_answer: z.string().min(1, "Atsakymas privalomas"),
  hints: z.array(z.string()).max(5).default([]),
  options: z.array(z.string()).nullable().default(null),
  order_index: z.number().default(0),
  image_url: z.string().url().nullable().optional(),
  maps_url: z.string().url().nullable().optional(),
  generated_by_di: z.boolean().default(false),
  verification_verdict: z.enum(["pass", "fail", "uncertain"]).nullable().optional(),
  verification_issues: z.array(z.string()).default([]),
  verification_confidence: z.number().min(0).max(1).nullable().optional(),
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

  const parsed = createChallengeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Neteisingi duomenys. Patikrinkite laukus." },
      { status: 400 }
    )
  }

  // Validate multiple choice has options
  if (parsed.data.type === "multiple_choice") {
    if (!parsed.data.options || parsed.data.options.length < 2) {
      return NextResponse.json(
        { error: "Pasirinkimo užduotis turi turėti bent 2 variantus" },
        { status: 400 }
      )
    }
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

  // Get next order_index
  const { count } = await supabase
    .from("challenges")
    .select("*", { count: "exact", head: true })
    .eq("game_id", parsed.data.game_id)

  const orderIndex = parsed.data.order_index || (count || 0)

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
      generated_by_di: parsed.data.generated_by_di,
      verification_verdict: parsed.data.verification_verdict ?? null,
      verification_issues: parsed.data.verification_issues,
      verification_confidence: parsed.data.verification_confidence ?? null,
    })
    .select(SAFE_CHALLENGE_COLUMNS)
    .single()

  if (error) {
    return NextResponse.json({ error: "Nepavyko sukurti užduoties" }, { status: 500 })
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
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  // Verify game ownership
  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("id", gameId)
    .eq("teacher_id", user.id)
    .single()

  if (!game) {
    return NextResponse.json({ error: "Žaidimas nerastas" }, { status: 404 })
  }

  const { data, error } = await supabase
    .from("challenges")
    .select(SAFE_CHALLENGE_COLUMNS)
    .eq("game_id", gameId)
    .order("order_index", { ascending: true })

  if (error) {
    return NextResponse.json({ error: "Nepavyko gauti užduočių" }, { status: 500 })
  }

  return NextResponse.json(data)
}
