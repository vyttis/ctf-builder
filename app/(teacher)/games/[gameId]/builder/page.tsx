import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { GameStatus, GameSettings, Challenge } from "@/types/game"
import { GameBuilder } from "@/components/teacher/game-builder/game-builder"

export default async function BuilderPage({
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
    .select("*, challenges(*)")
    .eq("id", params.gameId)
    .eq("teacher_id", user!.id)
    .single()

  if (!game) {
    notFound()
  }

  const challenges = (game.challenges || []) as Challenge[]
  const sortedChallenges = [...challenges].sort(
    (a, b) => a.order_index - b.order_index
  )
  const settings = (game.settings as GameSettings | null) || {
    max_teams: 50,
    time_limit_minutes: null,
    show_leaderboard: true,
    shuffle_challenges: false,
  }

  return (
    <GameBuilder
      initialGame={{
        id: game.id,
        title: game.title,
        description: game.description,
        status: game.status as GameStatus,
        settings,
        game_code: game.game_code,
      }}
      initialChallenges={sortedChallenges}
    />
  )
}
