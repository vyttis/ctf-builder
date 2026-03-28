import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    server: "ok",
    database: "error",
  }

  try {
    const supabase = createAdminClient()

    const { error } = await supabase.from("games").select("id").limit(1)
    checks.database = error ? "error" : "ok"
  } catch {
    checks.database = "error"
  }

  const healthy = Object.values(checks).every((v) => v === "ok")

  return NextResponse.json(
    { status: healthy ? "healthy" : "degraded", checks },
    { status: healthy ? 200 : 503 }
  )
}
