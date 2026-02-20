import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

// GET /api/library — list approved library items (+ own items for teachers)
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Neprisijungęs" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get("subject")
    const gradeLevel = searchParams.get("grade_level")
    const search = searchParams.get("search")
    const status = searchParams.get("status") // for admin: pending_review, rejected

    let query = supabase
      .from("library_items")
      .select("*, profiles!library_items_published_by_fkey(full_name, email)")
      .order("created_at", { ascending: false })

    // Filter by status (admins can see pending_review)
    if (status) {
      query = query.eq("status", status)
    }

    if (subject) {
      query = query.eq("subject", subject)
    }

    if (gradeLevel) {
      query = query.eq("grade_level", gradeLevel)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query.limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich with publisher info and challenge count
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (data || []).map((item: any) => ({
      ...item,
      publisher_name: item.profiles?.full_name || item.profiles?.email || "—",
      publisher_email: item.profiles?.email,
      challenge_count: Array.isArray(item.challenge_data)
        ? item.challenge_data.length
        : 0,
    }))

    return NextResponse.json(items)
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Vidinė klaida" }, { status: 500 })
  }
}

const publishSchema = z.object({
  game_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  subject: z.string().optional(),
  grade_level: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

// POST /api/library — publish a game to the library
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Neprisijungęs" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = publishSchema.parse(body)

    // Verify game ownership
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*, challenges(*)")
      .eq("id", parsed.game_id)
      .eq("teacher_id", user.id)
      .single()

    if (gameError || !game) {
      return NextResponse.json(
        { error: "Žaidimas nerastas arba neturite teisės" },
        { status: 404 }
      )
    }

    if (!game.challenges || game.challenges.length === 0) {
      return NextResponse.json(
        { error: "Žaidimas neturi užduočių" },
        { status: 400 }
      )
    }

    // Create challenge snapshot (without answer_hash for security)
    const challengeData = game.challenges
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => a.order_index - b.order_index)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((c: any) => ({
        title: c.title,
        description: c.description,
        type: c.type,
        points: c.points,
        hints: c.hints,
        options: c.options,
        order_index: c.order_index,
        image_url: c.image_url || null,
        maps_url: c.maps_url || null,
      }))

    const { data: libraryItem, error: insertError } = await supabase
      .from("library_items")
      .insert({
        source_game_id: game.id,
        title: parsed.title,
        description: parsed.description || game.description,
        subject: parsed.subject,
        grade_level: parsed.grade_level,
        tags: parsed.tags || [],
        challenge_data: challengeData,
        settings: game.settings,
        published_by: user.id,
        status: "pending_review",
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(libraryItem, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neteisingi duomenys" },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : "Vidinė klaida" }, { status: 500 })
  }
}
