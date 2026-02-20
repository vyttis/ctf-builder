import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/auth/roles"
import { NextResponse } from "next/server"
import { z } from "zod"

// GET /api/admin/users — list all users (admin+ only)
export async function GET() {
  try {
    const supabase = await createClient()
    await requireRole(supabase, "admin", "super_admin")

    const { data: users, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(users)
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prieiga uždrausta" },
      { status: 403 }
    )
  }
}

const updateRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["teacher", "admin", "super_admin"]),
})

// PATCH /api/admin/users — change user role (super_admin only)
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    await requireRole(supabase, "super_admin")

    const body = await request.json()
    const { userId, role } = updateRoleSchema.parse(body)

    // Prevent self-demotion
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user?.id === userId) {
      return NextResponse.json(
        { error: "Negalite keisti savo paties rolės" },
        { status: 400 }
      )
    }

    // Use admin client to bypass RLS for role update
    const adminClient = createAdminClient()
    const { error } = await adminClient
      .from("profiles")
      .update({ role })
      .eq("id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
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
      { error: error instanceof Error ? error.message : "Prieiga uždrausta" },
      { status: 403 }
    )
  }
}
