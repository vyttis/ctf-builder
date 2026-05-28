import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"

// GET /api/play/state?game_code=ABC123&session_token=xxx
// Single round-trip player state lookup — replaces 3 sequential anon queries.
// Backwards compatible: if the get_player_game_state RPC isn't deployed yet
// (function_does_not_exist 42883), falls back to parallel raw queries that
// produce the same shape.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameCode = searchParams.get("game_code")?.toUpperCase()
  const sessionToken = searchParams.get("session_token")

  if (!gameCode || gameCode.length < 6) {
    return NextResponse.json({ error: "Netinkamas žaidimo kodas" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Fast path: RPC
  const { data, error } = await supabase.rpc("get_player_game_state", {
    p_game_code: gameCode,
    p_session_token: sessionToken || null,
  })

  if (!error) {
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=0, must-revalidate" },
    })
  }

  const code = (error as { code?: string }).code
  if (code !== "42883" && code !== "PGRST202") {
    // Real error, not just "function not deployed"
    console.error("get_player_game_state RPC error:", error.message)
    return NextResponse.json({ error: "Serverio klaida" }, { status: 500 })
  }

  // Fallback: raw queries (parallel)
  console.warn("get_player_game_state RPC unavailable — falling back to raw queries. Apply migration 00018.")
  const fallback = await fetchPlayerStateRaw(supabase, gameCode, sessionToken)
  return NextResponse.json(fallback, {
    headers: { "Cache-Control": "private, max-age=0, must-revalidate" },
  })
}

async function fetchPlayerStateRaw(
  supabase: SupabaseClient,
  gameCode: string,
  sessionToken: string | null,
) {
  const { data: game } = await supabase
    .from("games")
    .select("id, title, description, status, settings")
    .eq("game_code", gameCode)
    .in("status", ["active", "finished"])
    .maybeSingle()

  if (!game) {
    return { game: null }
  }

  // Parallel: challenges + (if session_token) team
  const [challengesRes, teamRes] = await Promise.all([
    supabase
      .from("challenges")
      .select(
        "id, title, description, type, points, hints, options, order_index, image_url, maps_url, hint_penalty, prerequisites",
      )
      .eq("game_id", game.id)
      .order("order_index", { ascending: true }),
    sessionToken
      ? supabase
          .from("teams")
          .select("id, name, total_points, current_challenge_index")
          .eq("session_token", sessionToken)
          .eq("game_id", game.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const team = (teamRes as { data: { id: string; name: string; total_points: number; current_challenge_index: number } | null }).data
  let solved: { challenge_id: string; points_awarded: number }[] = []

  if (team) {
    const { data } = await supabase
      .from("submissions")
      .select("challenge_id, points_awarded")
      .eq("team_id", team.id)
      .eq("is_correct", true)
    solved = data ?? []
  }

  return {
    game: {
      id: game.id,
      title: game.title,
      description: game.description,
      status: game.status,
      settings: game.settings,
    },
    challenges: challengesRes.data ?? [],
    team,
    solved,
  }
}
