import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// GET /api/play/status?game_code=XXXXXX — lightweight game-status poll for
// the player page. Uses the admin client so paused games are visible even
// on databases without migration 00020 (anon RLS may hide paused rows, and
// realtime UPDATE events for them are then never delivered).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameCode = searchParams.get("game_code")?.toUpperCase()

  if (!gameCode || gameCode.length < 6) {
    return NextResponse.json({ error: "game_code privalomas" }, { status: 400 })
  }

  try {
    const supabase = createAdminClient()
    const { data: game } = await supabase
      .from("games")
      .select("status, settings")
      .eq("game_code", gameCode)
      .maybeSingle()

    if (!game) {
      return NextResponse.json(
        { status: null },
        { headers: { "Cache-Control": "no-store" } }
      )
    }

    const settings =
      (game.settings as { time_limit_minutes?: number | null; allow_access_requests?: boolean }) || {}

    return NextResponse.json(
      {
        status: game.status,
        time_limit_minutes: settings.time_limit_minutes ?? null,
        allow_access_requests: settings.allow_access_requests === true,
      },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch {
    return NextResponse.json({ error: "Serverio klaida" }, { status: 500 })
  }
}
