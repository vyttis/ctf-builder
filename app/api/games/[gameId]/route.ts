import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

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
    .select("*, challenges(*)")
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

  const body = await request.json()
  const parsed = updateGameSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
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

  const { data, error } = await supabase
    .from("games")
    .update(parsed.data)
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
