import { createClient } from "@/lib/supabase/server"
import { normalizeAnswer } from "@/lib/game/answer-hasher"
import { NextResponse } from "next/server"
import { z } from "zod"

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

  const body = await request.json()
  const parsed = updateChallengeSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
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
    .select()
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

  const { error } = await supabase
    .from("challenges")
    .delete()
    .eq("id", params.challengeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
