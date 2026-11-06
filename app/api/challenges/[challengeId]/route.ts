import { createClient } from "@/lib/supabase/server"
import { hashAnswer } from "@/lib/game/answer-hasher"
import { isLiveStatus, LIVE_EDIT_BLOCKED } from "@/lib/game/live-edit"
import { NextResponse } from "next/server"
import { z } from "zod"

// Safe columns to return (never include answer_hash)
const LEGACY_CHALLENGE_COLUMNS = "id, game_id, title, description, type, points, hints, options, order_index, image_url, maps_url, explanation, difficulty, hint_penalty, generated_by_di, verification_verdict, verification_issues, verification_confidence, prerequisites, created_at, updated_at"
const SAFE_CHALLENGE_COLUMNS = LEGACY_CHALLENGE_COLUMNS + ", needs_answer"

const updateChallengeSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["text", "number", "multiple_choice"]).optional(),
  points: z.number().min(1).max(1000).optional(),
  correct_answer: z.string().min(1).optional(),
  hints: z.array(z.string()).optional(),
  options: z.array(z.string()).nullable().optional(),
  order_index: z.number().optional(),
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
  hint_penalty: z.number().min(0).max(100).optional(),
  prerequisites: z.array(z.string().uuid()).optional(),
}).strict()

type ChallengeUpdatePayload = z.infer<typeof updateChallengeSchema> & {
  answer_hash?: string
  needs_answer?: boolean
  correct_answer?: never
}

async function verifyChallengeOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challengeId: string,
  userId: string
) {
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, game_id, type")
    .eq("id", challengeId)
    .single()

  if (!challenge) return null

  const { data: game } = await supabase
    .from("games")
    .select("id, status")
    .eq("id", challenge.game_id)
    .eq("teacher_id", userId)
    .single()

  return game ? { type: challenge.type as string | null, gameStatus: game.status as string } : null
}

export async function PATCH(request: Request, props: { params: Promise<{ challengeId: string }> }) {
  const params = await props.params;
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

  const parsed = updateChallengeSchema.safeParse(body)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Neteisingi duomenys"
    return NextResponse.json(
      { error: firstError },
      { status: 400 }
    )
  }

  // Verify the challenge belongs to a game owned by this teacher
  const owned = await verifyChallengeOwnership(supabase, params.challengeId, user.id)
  if (!owned) {
    return NextResponse.json(
      { error: "Užduotis nerasta arba neturite teisės" },
      { status: 404 }
    )
  }

  // Moving a task while the activity runs shifts teams in linear mode; the
  // order changes only through the reorder route, which refuses it too.
  if (parsed.data.order_index !== undefined && isLiveStatus(owned.gameStatus)) {
    return NextResponse.json({ error: LIVE_EDIT_BLOCKED.reorder, code: "live" }, { status: 409 })
  }

  const { correct_answer, ...rest } = parsed.data
  const updateData: ChallengeUpdatePayload = { ...rest }

  // If answer is being updated, hash it with bcrypt (never stored/returned in
  // plaintext) and clear the needs_answer flag set on duplicated/cloned tasks
  if (correct_answer) {
    // Text answers fold diacritics, choices keep the exact form: use the
    // type being saved, or the task's current one when it is unchanged
    updateData.answer_hash = await hashAnswer(correct_answer, parsed.data.type ?? owned.type)
    updateData.needs_answer = false
  }

  let { data, error } = await supabase
    .from("challenges")
    .update(updateData)
    .eq("id", params.challengeId)
    .select(SAFE_CHALLENGE_COLUMNS)
    .single()

  // needs_answer column may not exist on unmigrated DBs — retry without it
  if (error && (error.message?.includes("column") || error.code === "42703")) {
    delete updateData.needs_answer
    ;({ data, error } = await supabase
      .from("challenges")
      .update(updateData)
      .eq("id", params.challengeId)
      .select(LEGACY_CHALLENGE_COLUMNS)
      .single())
  }

  if (error) {
    console.error("Challenge UPDATE error:", error)
    return NextResponse.json({ error: "Nepavyko atnaujinti užduoties." }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: Request, props: { params: Promise<{ challengeId: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  // Verify the challenge belongs to a game owned by this teacher
  const owned = await verifyChallengeOwnership(supabase, params.challengeId, user.id)
  if (!owned) {
    return NextResponse.json(
      { error: "Užduotis nerasta arba neturite teisės" },
      { status: 404 }
    )
  }
  if (isLiveStatus(owned.gameStatus)) {
    return NextResponse.json({ error: LIVE_EDIT_BLOCKED.delete, code: "live" }, { status: 409 })
  }

  const { error } = await supabase
    .from("challenges")
    .delete()
    .eq("id", params.challengeId)

  if (error) {
    console.error("Challenge DELETE error:", error)
    return NextResponse.json({ error: "Nepavyko ištrinti užduoties." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
