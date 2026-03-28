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
    const message = error instanceof Error ? error.message : "Prieiga uždrausta"
    const isAuthError = message.includes("role") || message.includes("Prieiga") || message.includes("prisijung")
    return NextResponse.json(
      { error: message },
      { status: isAuthError ? 403 : 500 }
    )
  }
}
