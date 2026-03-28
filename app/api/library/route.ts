import { createClient } from "@/lib/supabase/server"
import { getUserRole, canApproveLibrary } from "@/lib/auth/roles"
import { NextResponse } from "next/server"
import { z } from "zod"

// Sanitize search input for PostgREST ilike filter
function sanitizeSearch(input: string): string {
  return input.replace(/[%_\\,().:;!@#$^&*=<>{}[\]|`~"'/]/g, "").trim()
}

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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)))

    // Only admins can filter by non-approved status
    if (status && status !== "approved") {
      const role = await getUserRole(supabase)
      if (!canApproveLibrary(role)) {
        return NextResponse.json(
          { error: "Neturite teisės peržiūrėti šį statusą" },
          { status: 403 }
        )
      }
    }

    let query = supabase
      .from("library_items")
      .select("*, profiles!library_items_published_by_fkey(full_name, email)", { count: "exact" })
      .order("created_at", { ascending: false })

    // Filter by status; default to approved for non-admin users
    if (status) {
      query = query.eq("status", status)
    } else {
      // Non-admins only see approved items + their own items
      query = query.or(`status.eq.approved,published_by.eq.${user.id}`)
    }

    if (subject) {
      query = query.eq("subject", subject)
    }

    if (gradeLevel) {
      query = query.eq("grade_level", gradeLevel)
    }

    if (search) {
      const safeSearch = sanitizeSearch(search)
      if (safeSearch.length > 0) {
        query = query.or(`title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`)
      }
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    const { data, error, count } = await query.range(from, to)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich with publisher info and challenge count
    interface LibraryRow {
      profiles?: { full_name?: string; email?: string } | null
      challenge_data?: unknown[]
      [key: string]: unknown
    }
    const items = (data || []).map((item: LibraryRow) => ({
      ...item,
      publisher_name: item.profiles?.full_name || item.profiles?.email || "—",
      publisher_email: item.profiles?.email,
      challenge_count: Array.isArray(item.challenge_data)
        ? item.challenge_data.length
        : 0,
    }))

    return NextResponse.json({
      items,
      page,
      limit,
      total: count ?? items.length,
      total_pages: Math.ceil((count ?? items.length) / limit),
    })
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
    const parsed = publishSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Neteisingi duomenys" },
        { status: 400 }
      )
    }

    // Verify game ownership
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*, challenges(*)")
      .eq("id", parsed.data.game_id)
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
    interface ChallengeRow {
      title: string
      description: string | null
      type: string
      points: number
      hints: string[]
      options: string[] | null
      order_index: number
      image_url: string | null
      maps_url: string | null
    }
    const challengeData = (game.challenges as ChallengeRow[])
      .sort((a, b) => a.order_index - b.order_index)
      .map((c) => ({
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
        title: parsed.data.title,
        description: parsed.data.description || game.description,
        subject: parsed.data.subject,
        grade_level: parsed.data.grade_level,
        tags: parsed.data.tags || [],
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
    return NextResponse.json({ error: error instanceof Error ? error.message : "Vidinė klaida" }, { status: 500 })
  }
}
