import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { LiveView } from "@/components/teacher/live-view"
import type { GameSettings, GameStatus } from "@/types/game"

export default async function LiveViewPage({
  params,
}: {
  params: { gameId: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: game } = await supabase
    .from("games")
    .select("id, title, game_code, status, settings, starts_at, challenges(count)")
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
  const challengeCount =
    (game.challenges as { count: number }[])?.[0]?.count || 0

  return (
    <LiveView
      game={{
        id: game.id,
        title: game.title,
        game_code: game.game_code,
        status: game.status as GameStatus,
        starts_at: game.starts_at,
        time_limit_minutes: settings?.time_limit_minutes ?? null,
      }}
      challengeCount={challengeCount}
    />
  )
}
