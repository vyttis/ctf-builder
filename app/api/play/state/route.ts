import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

// GET /api/play/state?game_code=ABC123&session_token=xxx
// Single round-trip player state lookup — replaces 3 sequential anon queries.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameCode = searchParams.get("game_code")?.toUpperCase()
  const sessionToken = searchParams.get("session_token")

  if (!gameCode || gameCode.length < 6) {
    return NextResponse.json({ error: "Netinkamas žaidimo kodas" }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc("get_player_game_state", {
    p_game_code: gameCode,
    p_session_token: sessionToken || null,
  })

  if (error) {
    console.error("get_player_game_state error:", error.message)
    return NextResponse.json({ error: "Serverio klaida" }, { status: 500 })
  }

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
    },
  })
}
