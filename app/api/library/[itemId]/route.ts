import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/roles"
import { NextResponse } from "next/server"
import { z } from "zod"

// GET /api/library/[itemId] — get single library item
export async function GET(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Neprisijungęs" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("library_items")
      .select("*, profiles!library_items_published_by_fkey(full_name, email)")
      .eq("id", params.itemId)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Nerasta" }, { status: 404 })
    }

    return NextResponse.json({
      ...data,
      publisher_name: data.profiles?.full_name || data.profiles?.email || "—",
      challenge_count: Array.isArray(data.challenge_data)
        ? data.challenge_data.length
        : 0,
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Vidinė klaida" }, { status: 500 })
  }
}

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  review_notes: z.string().optional(),
})

// PATCH /api/library/[itemId] — approve/reject (admin+ only)
export async function PATCH(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const supabase = await createClient()
    await requireRole(supabase, "admin", "super_admin")

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const body = await request.json()
    const { status, review_notes } = reviewSchema.parse(body)

    const { error } = await supabase
      .from("library_items")
      .update({
        status,
        review_notes: review_notes || null,
        reviewed_by: user!.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", params.itemId)

    if (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Vidinė klaida" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Neteisingi duomenys" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : undefined) || "Prieiga uždrausta" },
      { status: 403 }
    )
  }
}

// DELETE /api/library/[itemId] — delete (super_admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { itemId: string } }
) {
  try {
    const supabase = await createClient()
    await requireRole(supabase, "super_admin")

    const { error } = await supabase
      .from("library_items")
      .delete()
      .eq("id", params.itemId)

    if (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Vidinė klaida" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : undefined) || "Prieiga uždrausta" },
      { status: 403 }
    )
  }
}
