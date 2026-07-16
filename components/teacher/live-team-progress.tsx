"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useLiveGame } from "@/hooks/use-live-game"
import { LiveConnectionBanner } from "./live-connection-banner"
import { Users, Trophy, Clock, AlertTriangle } from "lucide-react"

interface LiveTeamProgressProps {
  gameId: string
}

function formatTimeSince(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "ką tik"
  if (diffMin < 60) return `prieš ${diffMin} min.`
  const diffHours = Math.floor(diffMin / 60)
  return `prieš ${diffHours} val.`
}

function teamLabel(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 19) return "komandų"
  if (mod10 === 1) return "komanda"
  if (mod10 >= 2 && mod10 <= 9) return "komandos"
  return "komandų"
}

export function LiveTeamProgress({ gameId }: LiveTeamProgressProps) {
  const { teams, solvedCounts, lastSubmissions, connectionState, retry } =
    useLiveGame(gameId)
  const [, setTick] = useState(0)

  // Tick every 30s to update relative times
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000)
    return () => clearInterval(interval)
  }, [])

  function isStuck(teamId: string): boolean {
    const lastSub = lastSubmissions.get(teamId)
    if (!lastSub) return false
    const diffMs = Date.now() - new Date(lastSub).getTime()
    return diffMs > 5 * 60 * 1000 // 5 minutes
  }

  if (teams.length === 0) {
    return (
      <div className="space-y-3">
        {connectionState === "degraded" && (
          <LiveConnectionBanner onRetry={retry} />
        )}
        <Card className="border-border/50 bg-white">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">
                Dar nėra prisijungusių komandų
              </p>
              <p className="text-xs mt-1">
                Komandos atsiras čia, kai prisijungs prie žaidimo
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {connectionState === "degraded" && (
        <LiveConnectionBanner onRetry={retry} />
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span>
          {teams.length} {teamLabel(teams.length)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {teams.map((team, index) => {
          const lastSub = lastSubmissions.get(team.id)
          const stuck = isStuck(team.id)

          return (
            <Card
              key={team.id}
              className={`border-border/50 bg-white transition-shadow hover:shadow-md ${
                stuck ? "ring-1 ring-steam-yellow/50" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-steam-dark truncate">
                      {index === 0 && teams.length > 1 && (
                        <Trophy className="inline h-3.5 w-3.5 text-steam-yellow mr-1 -mt-0.5" />
                      )}
                      {team.name}
                    </p>
                  </div>
                  {stuck && (
                    <Badge className="shrink-0 bg-steam-yellow/15 text-steam-yellow border-steam-yellow/30 hover:bg-steam-yellow/20">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Įstrigo!
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-0.5">Taškai</p>
                    <p className="font-bold text-lg text-steam-green leading-none">
                      {team.total_points}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-0.5">
                      Užduočių išspręsta
                    </p>
                    <p className="font-bold text-lg text-steam-dark leading-none">
                      {solvedCounts.get(team.id) ?? 0}
                    </p>
                  </div>
                </div>

                {lastSub && (
                  <div className="mt-3 pt-2 border-t border-border/40 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Paskutinis atsakymas: {formatTimeSince(lastSub)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
