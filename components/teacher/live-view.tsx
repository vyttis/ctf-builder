"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useLiveGame } from "@/hooks/use-live-game"
import { LiveLeaderboardBoard } from "./live-leaderboard-board"
import { LiveActivityFeed } from "./live-activity-feed"
import { LiveConnectionBanner } from "./live-connection-banner"
import { GameStatusActions } from "./game-status-actions"
import { TimeControls } from "./time-controls"
import { getPlayUrl } from "@/lib/game/play-url"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import type { GameStatus } from "@/types/game"
import {
  ArrowLeft,
  Clock,
  Eye,
  EyeOff,
  Maximize2,
  Megaphone,
  Pause,
  Send,
  Square,
} from "lucide-react"

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse bg-white/20 rounded" style={{ width: 180, height: 180 }} />
    ),
  }
)

interface LiveViewProps {
  game: {
    id: string
    title: string
    game_code: string
    status: GameStatus
    starts_at: string | null
    time_limit_minutes: number | null
  }
  challengeCount: number
}

function formatClock(totalSeconds: number): string {
  const abs = Math.max(0, totalSeconds)
  const h = Math.floor(abs / 3600)
  const m = Math.floor((abs % 3600) / 60)
  const s = abs % 60
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

// Projector "class screen": big leaderboard + QR + activity feed on a dark
// background, with a collapsible teacher control bar.
export function LiveView({ game, challengeCount }: LiveViewProps) {
  const { toast } = useToast()
  const { teams, solvedCounts, connectionState, retry } = useLiveGame(game.id)

  const [status, setStatus] = useState<GameStatus>(game.status)
  const [startsAt, setStartsAt] = useState<string | null>(game.starts_at)
  const [timeLimit, setTimeLimit] = useState<number | null>(game.time_limit_minutes)
  const [nowTick, setNowTick] = useState(() => Date.now())

  // Presentation mode hides the control bar (projector shows only the board)
  const [presentationMode, setPresentationMode] = useState(false)

  // Announce input
  const [announcement, setAnnouncement] = useState("")
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false)

  // Live status/settings updates (teacher-owned row — RLS delivers these)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`live_view_game_${game.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${game.id}` },
        (payload) => {
          const updated = payload.new as {
            status?: GameStatus
            starts_at?: string | null
            settings?: { time_limit_minutes?: number | null }
          }
          if (updated.status) setStatus(updated.status)
          if (updated.starts_at !== undefined) setStartsAt(updated.starts_at)
          if (updated.settings?.time_limit_minutes !== undefined) {
            setTimeLimit(updated.settings.time_limit_minutes)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [game.id])

  // Clock tick
  useEffect(() => {
    if (status !== "active") return
    const interval = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [status])

  // Esc leaves presentation mode
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setPresentationMode(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const playUrl = useMemo(() => getPlayUrl(game.game_code), [game.game_code])

  // Class-wide clock anchored on starts_at (per-team timers may differ —
  // this is the shared classroom time)
  const clock = useMemo(() => {
    if (!startsAt) return null
    const startMs = new Date(startsAt).getTime()
    const elapsedSec = Math.floor((nowTick - startMs) / 1000)
    if (timeLimit) {
      return { label: "Liko laiko", value: timeLimit * 60 - elapsedSec, countdown: true }
    }
    return { label: "Bendras laikas", value: elapsedSec, countdown: false }
  }, [startsAt, timeLimit, nowTick])

  const handleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }, [])

  async function handleAnnounce() {
    const trimmed = announcement.trim()
    if (!trimmed || sendingAnnouncement) return
    setSendingAnnouncement(true)
    try {
      const res = await fetch(`/api/games/${game.id}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setAnnouncement("")
      toast({ title: "Pranešimas išsiųstas" })
    } catch {
      toast({
        title: "Nepavyko išsiųsti pranešimo",
        variant: "destructive",
      })
    } finally {
      setSendingAnnouncement(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col text-white">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          {!presentationMode && (
            <Link href={`/games/${game.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-white/60 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <h1 className="text-xl sm:text-2xl font-bold truncate">{game.title}</h1>
          {status === "paused" && (
            <span className="flex items-center gap-1.5 rounded-full bg-highlight/20 text-highlight px-3 py-1 text-sm font-medium shrink-0">
              <Pause className="h-3.5 w-3.5" />
              Pristabdyta
            </span>
          )}
          {status === "finished" && (
            <span className="flex items-center gap-1.5 rounded-full bg-accent/20 text-accent px-3 py-1 text-sm font-medium shrink-0">
              <Square className="h-3.5 w-3.5" />
              Baigta
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {clock && status !== "finished" && (
            <div className="text-right">
              <p
                className={`font-mono text-3xl font-bold tabular-nums ${
                  clock.countdown && clock.value <= 60
                    ? "text-accent animate-pulse"
                    : "text-white"
                }`}
              >
                {formatClock(clock.value)}
              </p>
              <p className="text-[11px] text-white/50 uppercase tracking-wide flex items-center gap-1 justify-end">
                <Clock className="h-3 w-3" />
                {clock.label}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFullscreen}
            className="text-white/60 hover:text-white hover:bg-white/10"
            title="Visas ekranas"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPresentationMode((p) => !p)}
            className="gap-2 text-white/60 hover:text-white hover:bg-white/10"
            title={presentationMode ? "Rodyti valdiklius (Esc)" : "Pateikties režimas"}
          >
            {presentationMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            <span className="hidden sm:inline">
              {presentationMode ? "Valdikliai" : "Pateiktis"}
            </span>
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 px-6 py-6">
        {connectionState === "degraded" && (
          <div className="mb-4">
            <LiveConnectionBanner onRetry={retry} />
          </div>
        )}

        {status === "finished" && (
          <div className="mb-6 rounded-2xl border border-accent/40 bg-accent/10 px-6 py-4 text-center">
            <p className="text-2xl font-bold">Žaidimas baigtas!</p>
            <p className="text-white/60 mt-1">Galutiniai rezultatai žemiau 🏆</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Leaderboard */}
          <LiveLeaderboardBoard
            teams={teams}
            solvedCounts={solvedCounts}
            totalChallenges={challengeCount}
          />

          {/* Side panel: QR + activity */}
          <div className="space-y-4">
            {status !== "finished" && (
              <div className="rounded-xl border border-white/10 bg-white p-4 text-center">
                <QRCodeSVG
                  value={playUrl}
                  size={180}
                  level="H"
                  includeMargin={false}
                  fgColor="#00323C"
                  className="mx-auto"
                />
                <p className="mt-3 font-mono text-3xl font-bold tracking-[0.25em] text-steam-dark">
                  {game.game_code}
                </p>
                <p className="text-xs text-muted-foreground mt-1 break-all">{playUrl}</p>
              </div>
            )}
            <LiveActivityFeed gameId={game.id} variant="projector" />
          </div>
        </div>
      </div>

      {/* Control bar */}
      {!presentationMode && (
        <footer className="sticky bottom-0 border-t border-white/10 bg-steam-dark/95 backdrop-blur px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <GameStatusActions
              gameId={game.id}
              status={status}
              challengeCount={challengeCount}
            />
            {(status === "active" || status === "paused") && (
              <>
                <div className="[&_button]:border-white/20 [&_button]:text-white/80">
                  <TimeControls gameId={game.id} currentTimeLimit={timeLimit} />
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                  <Megaphone className="h-4 w-4 text-white/40 shrink-0" />
                  <Input
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value.slice(0, 500))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAnnounce()
                    }}
                    placeholder="Pranešimas komandoms..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-9"
                  />
                  <Button
                    size="sm"
                    onClick={handleAnnounce}
                    disabled={!announcement.trim() || sendingAnnouncement}
                    className="bg-secondary hover:bg-secondary/90 text-white gap-1.5 shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Siųsti
                  </Button>
                </div>
              </>
            )}
          </div>
        </footer>
      )}
    </div>
  )
}
