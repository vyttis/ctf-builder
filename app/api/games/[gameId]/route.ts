import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

// Safe columns to return for challenges (never include answer_hash)
const SAFE_CHALLENGE_SELECT = "id, game_id, title, description, type, points, hints, options, order_index, image_url, maps_url, created_at, updated_at"

const updateGameSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "active", "paused", "finished"]).optional(),
  settings: z
    .object({
      max_teams: z.number().min(2).max(100).optional(),
      time_limit_minutes: z.number().nullable().optional(),
      show_leaderboard: z.boolean().optional(),
      shuffle_challenges: z.boolean().optional(),
    })
    .optional(),
})

export async function GET(
  _request: Request,
  { params }: { params: { gameId: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("games")
    .select(`*, challenges(${SAFE_CHALLENGE_SELECT})`)
    .eq("id", params.gameId)
    .eq("teacher_id", user.id)
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: "Žaidimas nerastas" },
      { status: 404 }
    )
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: { gameId: string } }
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

  const parsed = updateGameSchema.safeParse(body)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Neteisingi duomenys"
    return NextResponse.json(
      { error: firstError },
      { status: 400 }
    )
  }

  // If activating, check that at least 1 challenge exists
  if (parsed.data.status === "active") {
    const { count } = await supabase
      .from("challenges")
      .select("*", { count: "exact", head: true })
      .eq("game_id", params.gameId)

    if (!count || count === 0) {
      return NextResponse.json(
        { error: "Žaidimas turi turėti bent 1 užduotį" },
        { status: 400 }
      )
    }
  }

  // Build update payload carefully
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {}
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description
  if (parsed.data.status !== undefined) updateData.status = parsed.data.status

  // Deep merge settings to avoid destroying unmentioned fields
  if (parsed.data.settings) {
    const { data: currentGame } = await supabase
      .from("games")
      .select("settings")
      .eq("id", params.gameId)
      .eq("teacher_id", user.id)
      .single()

    if (!currentGame) {
      return NextResponse.json({ error: "Žaidimas nerastas" }, { status: 404 })
    }

    const currentSettings = (currentGame.settings as Record<string, unknown>) || {}
    updateData.settings = {
      ...currentSettings,
      ...parsed.data.settings,
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nėra ką atnaujinti" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("games")
    .update(updateData)
    .eq("id", params.gameId)
    .eq("teacher_id", user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { gameId: string } }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  const { error } = await supabase
    .from("games")
    .delete()
    .eq("id", params.gameId)
    .eq("teacher_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
