"use client"

import { useRouter } from "next/navigation"
import { GameCard } from "./game-card"
import { GameWithChallengeCount } from "@/types/game"

interface GamesGridProps {
  games: GameWithChallengeCount[]
}

export function GamesGrid({ games }: GamesGridProps) {
  const router = useRouter()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {games.map((game, index) => (
        <GameCard
          key={game.id}
          game={game}
          index={index}
          onUpdate={() => router.refresh()}
        />
      ))}
    </div>
  )
}
