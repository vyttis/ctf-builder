import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

/**
 * Liveness + DB ping for uptime monitoring.
 * Cheap: single SELECT 1 on a small system catalog.
 */
export async function GET() {
  const startedAt = Date.now()

  try {
    const supabase = createAdminClient()
    // Postgres roundtrip via a no-op RPC fallback that all installations have
    const { error } = await supabase.from("games").select("id", { count: "exact", head: true }).limit(0)

    const dbLatencyMs = Date.now() - startedAt

    if (error) {
      return NextResponse.json(
        {
          status: "degraded",
          timestamp: new Date().toISOString(),
          db_latency_ms: dbLatencyMs,
          error: error.message,
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        db_latency_ms: dbLatencyMs,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    )
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    )
  }
}
