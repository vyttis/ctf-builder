import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { LiveView } from "@/components/teacher/live-view"
import type { GameSettings, GameStatus } from "@/types/game"
import { activityRequestToken } from "@/lib/access/tokens"

export const metadata: Metadata = { title: "Vykstanti veikla" }

export default async function LiveViewPage(
  props: {
    params: Promise<{ gameId: string }>
  }
) {
  const params = await props.params;
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: game } = await supabase
    .from("games")
    // challenges(count) is rejected under column grants; embed ids instead
    .select("id, title, game_code, status, settings, starts_at, paused_ms, paused_at, challenges(id)")
    .eq("id", params.gameId)
    .eq("teacher_id", user!.id)
    .single()

  if (!game) {
    notFound()
  }

  // The class screen only makes sense for a started game
  if (game.status === "draft") {
    redirect(`/games/${game.id}`)
  }

  const settings = (game.settings as GameSettings | null) || null
  const challengeCount = ((game.challenges as { id: string }[] | null) ?? []).length

  // Request QR for activities run for teachers; the signed token is what
  // makes the request page exist (see app/prasymas/veikla).
  const accessRequestPath = settings?.allow_access_requests
    ? `/prasymas/veikla/${game.game_code}?t=${activityRequestToken(game.id)}`
    : null

  return (
    <LiveView
      accessRequestPath={accessRequestPath}
      game={{
        id: game.id,
        title: game.title,
        game_code: game.game_code,
        status: game.status as GameStatus,
        starts_at: game.starts_at,
        time_limit_minutes: settings?.time_limit_minutes ?? null,
        paused_ms: Number(game.paused_ms ?? 0),
        paused_at: game.paused_at ?? null,
        show_leaderboard: settings?.show_leaderboard !== false,
      }}
      challengeCount={challengeCount}
    />
  )
}
