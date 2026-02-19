"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GameWithChallengeCount, GameStatus } from "@/types/game"
import { motion } from "framer-motion"
import {
  Play,
  Pause,
  CheckCircle2,
  FileEdit,
  QrCode,
  Puzzle,
  Eye,
} from "lucide-react"
import Link from "next/link"

const statusConfig: Record<
  GameStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  draft: {
    label: "Juodraštis",
    variant: "outline",
    icon: <FileEdit className="h-3 w-3" />,
  },
  active: {
    label: "Aktyvus",
    variant: "default",
    icon: <Play className="h-3 w-3" />,
  },
  paused: {
    label: "Pristabdytas",
    variant: "secondary",
    icon: <Pause className="h-3 w-3" />,
  },
  finished: {
    label: "Baigtas",
    variant: "secondary",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
}

interface GameCardProps {
  game: GameWithChallengeCount
  index: number
}

export function GameCard({ game, index }: GameCardProps) {
  const status = statusConfig[game.status as GameStatus]
  const challengeCount = game.challenges?.[0]?.count || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Link href={`/games/${game.id}`}>
        <Card className="group cursor-pointer border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 bg-white">
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-steam-dark text-lg truncate group-hover:text-primary transition-colors">
                  {game.title}
                </h3>
                {game.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {game.description}
                  </p>
                )}
              </div>
              <Badge
                variant={status.variant}
                className="ml-3 shrink-0 gap-1"
              >
                {status.icon}
                {status.label}
              </Badge>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Puzzle className="h-3.5 w-3.5" />
                <span>
                  {challengeCount}{" "}
                  {challengeCount === 1 ? "užduotis" : "užduotys"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs bg-muted/50 px-2 py-0.5 rounded">
                <QrCode className="h-3 w-3" />
                {game.game_code}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
              {game.status === "active" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-secondary hover:text-secondary"
                  onClick={(e) => {
                    e.preventDefault()
                    // TODO: open monitor
                  }}
                >
                  <Eye className="h-3 w-3" />
                  Stebėti
                </Button>
              )}
              <div className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {new Date(game.created_at).toLocaleDateString("lt-LT")}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}
