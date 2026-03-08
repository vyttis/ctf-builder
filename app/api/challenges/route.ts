import { createClient } from "@/lib/supabase/server"
import { hashAnswer } from "@/lib/game/answer-hasher"
import { NextResponse } from "next/server"
import { z } from "zod"

// Safe columns to return (never include answer_hash)
const MINIMAL_CHALLENGE_COLUMNS = "id, game_id, title, description, type, points, hints, options, order_index, image_url, maps_url, created_at, updated_at"
const EXTRA_COLUMNS = ", explanation, difficulty, hint_penalty"
const BASE_CHALLENGE_COLUMNS = MINIMAL_CHALLENGE_COLUMNS + EXTRA_COLUMNS
const DI_COLUMNS = ", generated_by_di, verification_verdict, verification_issues, verification_confidence"
const SAFE_CHALLENGE_COLUMNS = BASE_CHALLENGE_COLUMNS + DI_COLUMNS

const createChallengeSchema = z.object({
  game_id: z.string().uuid(),
  title: z.string().min(1, "Pavadinimas privalomas").max(200),
  description: z.string().max(5000).default(""),
  type: z.enum(["text", "number", "multiple_choice"]).default("text"),
  points: z.coerce.number().min(1).max(1000).default(100),
  correct_answer: z.coerce.string().min(1, "Atsakymas privalomas"),
  hints: z.array(z.string()).max(10).default([]),
  options: z.array(z.string()).nullable().default(null),
  order_index: z.number().default(0),
  image_url: z.string().url().refine(
    (url) => url.startsWith("https://"),
    { message: "Paveiksliuko URL turi prasidėti https://" }
  ).nullable().optional(),
  maps_url: z.string().url().refine(
    (url) => url.startsWith("https://"),
    { message: "Žemėlapio URL turi prasidėti https://" }
  ).nullable().optional(),
  explanation: z.string().nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
  hint_penalty: z.number().min(0).max(100).default(20),
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
      { error: parsed.error.issues[0]?.message || "Neteisingi duomenys" },
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

  const minimalPayload = {
    game_id: parsed.data.game_id,
    title: parsed.data.title,
    description: parsed.data.description,
    type: parsed.data.type,
    points: parsed.data.points,
    answer_hash: await hashAnswer(parsed.data.correct_answer),
    hints: parsed.data.hints,
    options: parsed.data.options,
    order_index: orderIndex,
    image_url: parsed.data.image_url ?? null,
    maps_url: parsed.data.maps_url ?? null,
  }

  const extraPayload = {
    explanation: parsed.data.explanation ?? null,
    difficulty: parsed.data.difficulty ?? null,
    hint_penalty: parsed.data.hint_penalty,
  }

  const diPayload = {
    generated_by_di: parsed.data.generated_by_di,
    verification_verdict: parsed.data.verification_verdict ?? null,
    verification_issues: parsed.data.verification_issues,
    verification_confidence: parsed.data.verification_confidence ?? null,
  }

  const isColumnError = (err: { message?: string; code?: string }) =>
    err.message?.includes("column") || err.code === "42703"

  // Try with all columns, progressively fall back if columns don't exist
  // Supabase dynamic select returns varying shapes, typed loosely for column fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: { data: any; error: any } = await supabase
    .from("challenges")
    .insert({ ...minimalPayload, ...extraPayload, ...diPayload })
    .select(SAFE_CHALLENGE_COLUMNS)
    .single()

  if (result.error && isColumnError(result.error)) {
    console.warn("DI columns missing, retrying without them:", result.error.message)
    result = await supabase
      .from("challenges")
      .insert({ ...minimalPayload, ...extraPayload })
      .select(BASE_CHALLENGE_COLUMNS)
      .single()
  }

  if (result.error && isColumnError(result.error)) {
    console.warn("Extra columns missing, retrying with minimal:", result.error.message)
    result = await supabase
      .from("challenges")
      .insert(minimalPayload)
      .select(MINIMAL_CHALLENGE_COLUMNS)
      .single()
  }

  if (result.error) {
    console.error("Challenge INSERT error:", result.error, "payload keys:", Object.keys({ ...minimalPayload, ...extraPayload, ...diPayload }))
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json(result.data, { status: 201 })
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: { data: any; error: any } = await supabase
    .from("challenges")
    .select(SAFE_CHALLENGE_COLUMNS)
    .eq("game_id", gameId)
    .order("order_index", { ascending: true })

  // Fall back progressively if columns don't exist yet
  if (result.error && (result.error.message?.includes("column") || result.error.code === "42703")) {
    result = await supabase
      .from("challenges")
      .select(BASE_CHALLENGE_COLUMNS)
      .eq("game_id", gameId)
      .order("order_index", { ascending: true })
  }

  if (result.error && (result.error.message?.includes("column") || result.error.code === "42703")) {
    result = await supabase
      .from("challenges")
      .select(MINIMAL_CHALLENGE_COLUMNS)
      .eq("game_id", gameId)
      .order("order_index", { ascending: true })
  }

  if (result.error) {
    console.error("Challenge SELECT error:", result.error)
    return NextResponse.json({ error: result.error.message }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
