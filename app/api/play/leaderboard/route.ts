import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import {
  buildLeaderboard,
  leaderboardDisabled,
  leaderboardVisible,
  type LeaderboardResponse,
} from "@/lib/game/leaderboard"

// GET /api/play/leaderboard?game_code=XXXXXX: the participant leaderboard.
// Participants cannot read teams, results or achievements with the anon key
// (20261107120000), so the board comes from here, for whoever has the code.
// Only names, points, solved counts and badges: no answers, no tokens.
const CODE = /^[A-Z0-9]{6}$/

function json(body: LeaderboardResponse | { error: string }, status = 200, cache = true) {
  return NextResponse.json(body, {
    status,
    headers: cache
      ? {
          // Every phone on the board asks every few seconds; the answer is
          // the same for all of them, so the CDN keeps it for 2 s (the
          // database is asked at most every 2 s per activity). Browsers do
          // not keep it.
          "Cache-Control": "private, no-store",
          "CDN-Cache-Control": "public, s-maxage=2",
          "Vercel-CDN-Cache-Control": "public, s-maxage=2",
        }
      : { "Cache-Control": "no-store" },
  })
}

export async function GET(request: Request) {
  const gameCode = new URL(request.url).searchParams.get("game_code")?.toUpperCase() ?? ""
  if (!CODE.test(gameCode)) return json({ error: "Netinkamas veiklos kodas" }, 400, false)

  try {
    const supabase = createAdminClient()
    const { data: game, error } = await supabase
      .from("games")
      .select("id, status, settings")
      .eq("game_code", gameCode)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!game || !leaderboardVisible(game.status)) return json({ state: "not_found" }, 404)
    if (leaderboardDisabled(game.settings)) return json({ state: "disabled" })

    const [teamsRes, achievementsRes] = await Promise.all([
      supabase
        .from("teams")
        .select("id, name, total_points, updated_at, submissions(challenge_id)")
        .eq("game_id", game.id)
        .eq("submissions.is_correct", true),
      supabase.from("achievements").select("id, team_id, type, earned_at").eq("game_id", game.id),
    ])
    if (teamsRes.error) throw new Error(teamsRes.error.message)
    if (achievementsRes.error) console.error("leaderboard achievements read failed:", achievementsRes.error.message)

    return json({ state: "ok", teams: buildLeaderboard(teamsRes.data ?? [], achievementsRes.data ?? []) })
  } catch (e) {
    console.error("leaderboard read failed:", e instanceof Error ? e.message : e)
    return json({ error: "Serverio klaida" }, 500, false)
  }
}
