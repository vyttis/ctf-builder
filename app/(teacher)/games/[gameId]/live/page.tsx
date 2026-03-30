import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { GameSettings } from "@/types/game"
import { LiveDashboard } from "@/components/teacher/live-dashboard"

export default async function LivePage({
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
    .select("id, title, status, game_code, settings")
    .eq("id", params.gameId)
    .eq("teacher_id", user!.id)
    .single()

  if (!game) {
    notFound()
  }

  const settings = game.settings as GameSettings | null

  return (
    <LiveDashboard
      gameId={game.id}
      gameTitle={game.title}
      gameCode={game.game_code}
      gameStatus={game.status}
      settings={{
        time_limit_minutes: settings?.time_limit_minutes ?? null,
        max_teams: settings?.max_teams ?? 50,
      }}
    />
  )
}
