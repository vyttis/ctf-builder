"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { GameStatus } from "@/types/game"
import { LiveTeamProgress } from "@/components/teacher/live-team-progress"
import { AnnouncementPanel } from "@/components/teacher/announcement-panel"
import { TimeControls } from "@/components/teacher/time-controls"
import { LiveActivityFeed } from "@/components/teacher/live-activity-feed"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Radio,
  Pause,
  Play,
  Square,
  Loader2,
  Copy,
  Check,
  QrCode,
} from "lucide-react"
import Link from "next/link"

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  {
    ssr: false,
    loading: () => (
      <div
        className="animate-pulse bg-muted rounded"
        style={{ width: 280, height: 280 }}
      />
    ),
  }
)

interface LiveDashboardProps {
  gameId: string
  gameTitle: string
  gameCode: string
  gameStatus: string
  settings: {
    time_limit_minutes: number | null
    max_teams: number
  }
}

function getPlayUrl(gameCode: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/play/${gameCode}`
  }
  return `/play/${gameCode}`
}

export function LiveDashboard({
  gameId,
  gameTitle,
  gameCode,
  gameStatus: initialStatus,
  settings,
}: LiveDashboardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [status, setStatus] = useState<string>(initialStatus)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const playUrl = getPlayUrl(gameCode)

  async function updateStatus(newStatus: GameStatus) {
    setLoading(true)
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Nepavyko atnaujinti būsenos")
      }

      setStatus(newStatus)

      toast({
        title: "Būsena atnaujinta!",
        description:
          newStatus === "active"
            ? "Žaidimas tęsiamas."
            : newStatus === "finished"
            ? "Žaidimas baigtas."
            : "Žaidimas pristabdytas.",
      })

      if (newStatus === "finished") {
        router.push(`/games/${gameId}/analytics`)
      }
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description:
          error instanceof Error
            ? error.message
            : "Nepavyko atnaujinti būsenos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(playUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status !== "active" && status !== "paused") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground mb-4">
          Žaidimas nėra aktyvus. Grįžkite į žaidimo puslapį.
        </p>
        <Link href={`/games/${gameId}`}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Grįžti
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/games/${gameId}`}>
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
              Atgal
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Radio className="h-5 w-5 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            </div>
            <h1 className="text-xl font-bold text-steam-dark truncate max-w-[300px]">
              {gameTitle}
            </h1>
            {status === "paused" && (
              <Badge
                variant="outline"
                className="border-highlight/40 text-highlight text-xs"
              >
                Pristabdytas
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Game code pill */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-mono font-bold text-steam-dark tracking-wider hover:bg-muted/80 transition-colors"
          >
            {gameCode}
            {copied ? (
              <Check className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>

          {/* QR button */}
          <Dialog open={showQR} onOpenChange={setShowQR}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <QrCode className="h-4 w-4" />
                QR
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md flex flex-col items-center py-12">
              <DialogTitle className="sr-only">
                QR kodas: {gameCode}
              </DialogTitle>
              <QRCodeSVG
                value={playUrl}
                size={280}
                level="H"
                includeMargin={false}
                fgColor="#00323C"
              />
              <p className="text-4xl font-mono font-bold text-steam-dark tracking-[0.3em] mt-6">
                {gameCode}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Nuskaitykite QR kodą arba įveskite kodą
              </p>
              <code className="text-xs text-muted-foreground mt-1">
                {playUrl}
              </code>
            </DialogContent>
          </Dialog>

          {/* Status controls */}
          {status === "active" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus("paused")}
                disabled={loading}
                className="gap-1.5"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
                Pristabdyti
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus("finished")}
                disabled={loading}
                className="gap-1.5 border-accent/30 text-accent hover:bg-accent/5"
              >
                <Square className="h-4 w-4" />
                Baigti
              </Button>
            </>
          )}
          {status === "paused" && (
            <>
              <Button
                size="sm"
                onClick={() => updateStatus("active")}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-white gap-1.5"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Tęsti
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateStatus("finished")}
                disabled={loading}
                className="gap-1.5 border-accent/30 text-accent hover:bg-accent/5"
              >
                <Square className="h-4 w-4" />
                Baigti
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Team progress (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <LiveTeamProgress gameId={gameId} />
          <LiveActivityFeed gameId={gameId} />
        </div>

        {/* Right sidebar: Announcements + Time */}
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
