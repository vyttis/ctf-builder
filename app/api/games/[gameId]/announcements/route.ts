import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const createAnnouncementSchema = z.object({
  message: z.string().min(1, "Pranešimas negali būti tuščias").max(500, "Pranešimas per ilgas (max 500 simbolių)"),
})

export async function POST(
  request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  // Verify teacher owns this game
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id")
    .eq("id", params.gameId)
    .eq("teacher_id", user.id)
    .single()

  if (gameError || !game) {
    return NextResponse.json(
      { error: "Žaidimas nerastas arba neturite teisių" },
      { status: 404 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Netinkamas užklausos formatas" },
      { status: 400 }
    )
  }

  const parsed = createAnnouncementSchema.safeParse(body)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || "Neteisingi duomenys"
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  const { data: announcement, error: insertError } = await supabase
    .from("announcements")
    .insert({
      game_id: params.gameId,
      message: parsed.data.message,
      created_by: user.id,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json(
      { error: insertError.message },
      { status: 500 }
    )
  }

  return NextResponse.json(announcement, { status: 201 })
  } catch (err) {
    console.error("Announcements POST error:", err)
    return NextResponse.json({ error: "Serverio klaida" }, { status: 500 })
  }
}

export async function GET(
  _request: Request,
  { params }: { params: { gameId: string } }
) {
  try {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  // Verify teacher owns this game
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id")
    .eq("id", params.gameId)
    .eq("teacher_id", user.id)
    .single()

  if (gameError || !game) {
    return NextResponse.json(
      { error: "Žaidimas nerastas arba neturite teisių" },
      { status: 404 }
    )
  }

  const { data: announcements, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("game_id", params.gameId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(announcements)
  } catch (err) {
    console.error("Announcements GET error:", err)
    return NextResponse.json({ error: "Serverio klaida" }, { status: 500 })
  }
}
