"use client"

import { Radio } from "lucide-react"
import { LiveTeamProgress } from "@/components/teacher/live-team-progress"
import { AnnouncementPanel } from "@/components/teacher/announcement-panel"
import { TimeControls } from "@/components/teacher/time-controls"

interface LiveControlCenterProps {
  gameId: string
  gameStatus: string
  settings: {
    time_limit_minutes: number | null
    max_teams: number
  }
}

export function LiveControlCenter({
  gameId,
  gameStatus,
  settings,
}: LiveControlCenterProps) {
  if (gameStatus !== "active" && gameStatus !== "paused") {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Radio className="h-6 w-6 text-primary" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-steam-green animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-steam-dark tracking-tight">
          Valdymo centras
        </h2>
        {gameStatus === "paused" && (
          <span className="inline-flex items-center rounded-md bg-steam-yellow/15 px-2.5 py-0.5 text-xs font-semibold text-steam-yellow border border-steam-yellow/30">
            Pristabdytas
          </span>
        )}
      </div>

      {/* Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Progress - spans 2 cols on desktop */}
        <div className="lg:col-span-2">
          <LiveTeamProgress gameId={gameId} />
        </div>

        {/* Right sidebar: Announcements + Time Controls */}
        <div className="space-y-6">
          <AnnouncementPanel gameId={gameId} />
          <TimeControls
            gameId={gameId}
            currentTimeLimit={settings.time_limit_minutes}
          />
        </div>
      </div>
    </div>
  )
}
