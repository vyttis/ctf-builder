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
    const message = error instanceof Error ? error.message : "Prieiga uždrausta"
    const isAuthError = message.includes("role") || message.includes("Prieiga") || message.includes("prisijung")
    return NextResponse.json(
      { error: message },
      { status: isAuthError ? 403 : 500 }
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
    const parsed = updateRoleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Neteisingi duomenys" },
        { status: 400 }
      )
    }
    const { userId, role } = parsed.data

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
    const message = error instanceof Error ? error.message : "Prieiga uždrausta"
    const isAuthError = message.includes("role") || message.includes("Prieiga") || message.includes("prisijung")
    return NextResponse.json(
      { error: message },
      { status: isAuthError ? 403 : 500 }
    )
  }
}
