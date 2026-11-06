import { createAdminClient } from "@/lib/supabase/admin"
import { tasksVersion } from "@/lib/game/tasks-version"
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
      .select("status, settings, paused_ms, paused_at, resumed_at, challenges(id, updated_at)")
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
        // Clock: pauses stop the countdown (lib/game/clock.ts). now lets
        // the phone correct for its own clock being off.
        paused_ms: Number(game.paused_ms ?? 0),
        paused_at: game.paused_at ?? null,
        // When the last pause ended: the facilitator's page counts the
        // "stuck" time from it.
        resumed_at: game.resumed_at ?? null,
        now: new Date().toISOString(),
        // Changes when a task is added, removed or saved: the phone then
        // reloads the tasks. Hidden before the start, like the tasks.
        tasks_version: game.status === "draft" ? null : tasksVersion(game.challenges),
      },
      {
        // Every phone of a class asks every 5 s (30 phones: 6 requests a
        // second). The answer is the same for all of them, so the CDN keeps
        // it for one second: the database is asked at most once a second per
        // activity, and "now" is at most a second old (PERF-02). Browsers do
        // not keep it.
        headers: {
          "Cache-Control": "private, no-store",
          "CDN-Cache-Control": "public, s-maxage=1",
          "Vercel-CDN-Cache-Control": "public, s-maxage=1",
        },
      }
    )
  } catch {
    return NextResponse.json({ error: "Serverio klaida" }, { status: 500 })
  }
}
