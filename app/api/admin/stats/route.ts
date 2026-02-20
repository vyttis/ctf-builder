import { createClient } from "@/lib/supabase/server"
import { requireRole } from "@/lib/auth/roles"
import { NextResponse } from "next/server"

// GET /api/admin/stats — platform statistics (admin+ only)
export async function GET() {
  try {
    const supabase = await createClient()
    await requireRole(supabase, "admin", "super_admin")

    const { data, error } = await supabase.rpc("get_platform_stats")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prieiga uždrausta" },
      { status: 403 }
    )
  }
}
