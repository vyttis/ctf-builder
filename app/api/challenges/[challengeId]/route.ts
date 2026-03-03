import { createClient } from "@/lib/supabase/server"
import { normalizeAnswer } from "@/lib/game/answer-hasher"
import { NextResponse } from "next/server"
import { z } from "zod"

// Safe columns to return (never include answer_hash)
const SAFE_CHALLENGE_COLUMNS = "id, game_id, title, description, type, points, hints, options, order_index, image_url, maps_url, generated_by_di, verification_verdict, verification_issues, verification_confidence, created_at, updated_at"

const updateChallengeSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["text", "number", "multiple_choice"]).optional(),
  points: z.number().min(1).max(1000).optional(),
  correct_answer: z.string().min(1).optional(),
  hints: z.array(z.string()).optional(),
  options: z.array(z.string()).nullable().optional(),
  order_index: z.number().optional(),
  image_url: z.string().url().nullable().optional(),
  maps_url: z.string().url().nullable().optional(),
})

async function verifyChallengeOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  challengeId: string,
  userId: string
) {
  const { data: challenge } = await supabase
    .from("challenges")
    .select("id, game_id")
    .eq("id", challengeId)
    .single()

  if (!challenge) return false

  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("id", challenge.game_id)
    .eq("teacher_id", userId)
    .single()

  return !!game
}

export async function PATCH(
  request: Request,
  { params }: { params: { challengeId: string } }
) {
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
  const isOwner = await verifyChallengeOwnership(supabase, params.challengeId, user.id)
  if (!isOwner) {
    return NextResponse.json(
      { error: "Užduotis nerasta arba neturite teisės" },
      { status: 404 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { ...parsed.data }

  // If answer is being updated, normalize it
  if (updateData.correct_answer) {
    updateData.answer_hash = normalizeAnswer(updateData.correct_answer as string)
    delete updateData.correct_answer
  }

  const { data, error } = await supabase
    .from("challenges")
    .update(updateData)
    .eq("id", params.challengeId)
    .select(SAFE_CHALLENGE_COLUMNS)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { challengeId: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  // Verify the challenge belongs to a game owned by this teacher
  const isOwner = await verifyChallengeOwnership(supabase, params.challengeId, user.id)
  if (!isOwner) {
    return NextResponse.json(
      { error: "Užduotis nerasta arba neturite teisės" },
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from("challenges")
    .delete()
    .eq("id", params.challengeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
