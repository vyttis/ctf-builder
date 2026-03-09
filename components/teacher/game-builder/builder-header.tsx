"use client"

import { useState } from "react"
import { GameStatus } from "@/types/game"
import { GameStatusActions } from "@/components/teacher/game-status-actions"
import { QRDisplay } from "@/components/teacher/qr-display"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Settings, Rocket } from "lucide-react"
import Link from "next/link"

interface BuilderHeaderProps {
  game: {
    id: string
    title: string
    description: string | null
    status: GameStatus
    game_code: string
  }
  challengeCount: number
  totalPoints: number
  onOpenSettings: () => void
}

const statusLabels: Record<GameStatus, string> = {
  draft: "Juodraštis",
  active: "Aktyvus",
  paused: "Pristabdytas",
  finished: "Baigtas",
}

const statusColors: Record<GameStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/10 text-primary border-primary/20",
  paused: "bg-highlight/10 text-highlight border-highlight/20",
  finished: "bg-secondary/10 text-secondary border-secondary/20",
}

export function BuilderHeader({
  game,
  challengeCount,
  totalPoints,
  onOpenSettings,
}: BuilderHeaderProps) {
  const [launchOpen, setLaunchOpen] = useState(false)

  return (
    <>
      <div className="border-b border-border/50 bg-white -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/games/${game.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-steam-dark truncate">
                  {game.title}
                </h1>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-[10px] ${statusColors[game.status]}`}
                >
                  {statusLabels[game.status]}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {challengeCount} užd. &middot; {totalPoints} tšk.
                {game.description && (
                  <span className="hidden sm:inline">
                    {" "}&middot; {game.description}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-muted-foreground"
              onClick={onOpenSettings}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <GameStatusActions
              gameId={game.id}
              status={game.status}
              challengeCount={challengeCount}
            />
            <Button
              size="sm"
              className="bg-accent hover:bg-accent/90 text-white gap-1.5 h-8"
              onClick={() => setLaunchOpen(true)}
            >
              <Rocket className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Paleisti</span>
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={launchOpen} onOpenChange={setLaunchOpen}>
        <DialogContent className="max-w-sm sm:max-w-md">
          <DialogTitle className="text-lg font-bold text-steam-dark text-center">
            Paleisti veiklą
          </DialogTitle>
          <QRDisplay gameCode={game.game_code} />
        </DialogContent>
      </Dialog>
    </>
  )
}
