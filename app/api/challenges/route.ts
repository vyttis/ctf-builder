import { createClient } from "@/lib/supabase/server"
import { hashAnswer } from "@/lib/game/answer-hasher"
import { NextResponse } from "next/server"
import { z } from "zod"
import { isLiveStatus, LIVE_EDIT_BLOCKED } from "@/lib/game/live-edit"

// Safe columns to return (never include answer_hash)
const MINIMAL_CHALLENGE_COLUMNS = "id, game_id, title, description, type, points, hints, options, order_index, image_url, maps_url, created_at, updated_at"
const EXTRA_COLUMNS = ", explanation, difficulty, hint_penalty"
const BASE_CHALLENGE_COLUMNS = MINIMAL_CHALLENGE_COLUMNS + EXTRA_COLUMNS
const DI_COLUMNS = ", generated_by_di, verification_verdict, verification_issues, verification_confidence"
const PATH_COLUMNS = ", prerequisites"
const LEGACY_CHALLENGE_COLUMNS = BASE_CHALLENGE_COLUMNS + DI_COLUMNS + PATH_COLUMNS
const NEEDS_ANSWER_COLUMNS = ", needs_answer"
const SAFE_CHALLENGE_COLUMNS = LEGACY_CHALLENGE_COLUMNS + NEEDS_ANSWER_COLUMNS

const createChallengeSchema = z.object({
  game_id: z.string().uuid(),
  title: z.string().min(1, "Pavadinimas privalomas").max(200),
  description: z.string().max(5000).default(""),
  type: z.enum(["text", "number", "multiple_choice"]).default("text"),
  points: z.coerce.number().min(1).max(1000).default(100),
  correct_answer: z.coerce.string().min(1, "Atsakymas privalomas").optional(),
  // Duplicated/cloned challenges arrive without an answer: they get an
  // unguessable random answer_hash and are flagged until the teacher sets one.
  needs_answer: z.boolean().default(false),
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
  prerequisites: z.array(z.string().uuid()).default([]),
}).refine((d) => d.needs_answer || (d.correct_answer && d.correct_answer.length > 0), {
  message: "Atsakymas privalomas",
  path: ["correct_answer"],
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
    .select("id, status")
    .eq("id", parsed.data.game_id)
    .eq("teacher_id", user.id)
    .single()

  if (!game) {
    return NextResponse.json(
      { error: "Veikla nerasta" },
      { status: 404 }
    )
  }
  // Participants would see a task nobody can solve.
  if (parsed.data.needs_answer && isLiveStatus(game.status)) {
    return NextResponse.json({ error: LIVE_EDIT_BLOCKED.needsAnswer, code: "live" }, { status: 409 })
  }

  // Get next order_index from max(order_index)+1 — a row count collides with
  // existing indexes after deletions or concurrent inserts, and duplicated
  // order_index values silently break the duplicate route's prerequisite
  // remapping (it maps old→new ids by order_index).
  const { data: maxRow } = await supabase
    .from("challenges")
    .select("order_index")
    .eq("game_id", parsed.data.game_id)
    .order("order_index", { ascending: false })
    .limit(1)
    .maybeSingle()

  // order_index defaults to 0 in the schema, so 0 means "auto-assign"
  const orderIndex =
    parsed.data.order_index ||
    (maxRow ? (maxRow.order_index as number) + 1 : 0)

  // needs_answer challenges get a random unguessable answer so no fixed
  // magic string (like the old "placeholder") can ever solve them
  const answerToHash = parsed.data.needs_answer
    ? crypto.randomUUID()
    : parsed.data.correct_answer!

  const minimalPayload = {
    game_id: parsed.data.game_id,
    title: parsed.data.title,
    description: parsed.data.description,
    type: parsed.data.type,
    points: parsed.data.points,
    answer_hash: await hashAnswer(answerToHash, parsed.data.type),
    hints: parsed.data.hints,
    options: parsed.data.options,
    order_index: orderIndex,
    image_url: parsed.data.image_url ?? null,
    maps_url: parsed.data.maps_url ?? null,
  }

  const needsAnswerPayload = {
    needs_answer: parsed.data.needs_answer,
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
    prerequisites: [...new Set(parsed.data.prerequisites)],
  }

  const isColumnError = (err: { message?: string; code?: string }) =>
    err.message?.includes("column") || err.code === "42703"

  // Try with all columns, progressively fall back if columns don't exist
  type ChallengeQueryResult = {
    data: Record<string, unknown> | null
    error: { message?: string; code?: string } | null
  }
  let result = (await supabase
    .from("challenges")
    .insert({ ...minimalPayload, ...extraPayload, ...diPayload, ...needsAnswerPayload })
    .select(SAFE_CHALLENGE_COLUMNS)
    .single()) as ChallengeQueryResult

  if (result.error && isColumnError(result.error)) {
    console.warn("needs_answer column missing, retrying without it:", result.error.message)
    result = (await supabase
      .from("challenges")
      .insert({ ...minimalPayload, ...extraPayload, ...diPayload })
      .select(LEGACY_CHALLENGE_COLUMNS)
      .single()) as ChallengeQueryResult
  }

  if (result.error && isColumnError(result.error)) {
    console.warn("DI columns missing, retrying without them:", result.error.message)
    result = (await supabase
      .from("challenges")
      .insert({ ...minimalPayload, ...extraPayload })
      .select(BASE_CHALLENGE_COLUMNS)
      .single()) as ChallengeQueryResult
  }

  if (result.error && isColumnError(result.error)) {
    console.warn("Extra columns missing, retrying with minimal:", result.error.message)
    result = (await supabase
      .from("challenges")
      .insert(minimalPayload)
      .select(MINIMAL_CHALLENGE_COLUMNS)
      .single()) as ChallengeQueryResult
  }

  if (result.error) {
    console.error("Challenge INSERT error:", result.error)
    return NextResponse.json({ error: "Nepavyko sukurti užduoties. Bandykite dar kartą." }, { status: 500 })
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

  type ChallengeListResult = {
    data: Record<string, unknown>[] | null
    error: { message?: string; code?: string } | null
  }
  let result = (await supabase
    .from("challenges")
    .select(SAFE_CHALLENGE_COLUMNS)
    .eq("game_id", gameId)
    .order("order_index", { ascending: true })) as ChallengeListResult

  // Fall back progressively if columns don't exist yet
  if (result.error && (result.error.message?.includes("column") || result.error.code === "42703")) {
    result = (await supabase
      .from("challenges")
      .select(LEGACY_CHALLENGE_COLUMNS)
      .eq("game_id", gameId)
      .order("order_index", { ascending: true })) as ChallengeListResult
  }

  if (result.error && (result.error.message?.includes("column") || result.error.code === "42703")) {
    result = (await supabase
      .from("challenges")
      .select(BASE_CHALLENGE_COLUMNS)
      .eq("game_id", gameId)
      .order("order_index", { ascending: true })) as ChallengeListResult
  }

  if (result.error && (result.error.message?.includes("column") || result.error.code === "42703")) {
    result = (await supabase
      .from("challenges")
      .select(MINIMAL_CHALLENGE_COLUMNS)
      .eq("game_id", gameId)
      .order("order_index", { ascending: true })) as ChallengeListResult
  }

  if (result.error) {
    console.error("Challenge SELECT error:", result.error)
    return NextResponse.json({ error: "Nepavyko gauti užduočių sąrašo." }, { status: 500 })
  }

  return NextResponse.json(result.data)
}
