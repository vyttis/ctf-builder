"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AnalyticsCards } from "@/components/teacher/analytics-cards"
import { ChallengeStatsTable } from "@/components/teacher/challenge-stats-table"
import { Button } from "@/components/ui/button"
import { GameStats } from "@/types/game"
import { ArrowLeft, BarChart3, Loader2 } from "lucide-react"
import Link from "next/link"

export default function GameAnalyticsPage() {
  const params = useParams()
  const gameId = params.gameId as string
  const [stats, setStats] = useState<GameStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/games/${gameId}/analytics`)
        if (!res.ok) {
          throw new Error("Nepavyko gauti statistikos")
        }
        const data = await res.json()
        setStats(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Nežinoma klaida")
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [gameId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-accent text-sm">{error}</p>
        <Link href={`/games/${gameId}`}>
          <Button variant="outline" size="sm" className="mt-4">
            Grįžti
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link href={`/games/${gameId}`} className="inline-block mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Žaidimo detalės
        </Button>
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-steam-dark flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Žaidimo analitika
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Detalūs žaidimo statistikos duomenys
          </p>
        </div>
      </div>

      {stats && (
        <div className="space-y-6">
          <AnalyticsCards stats={stats} />
          <ChallengeStatsTable stats={stats.challenge_stats || []} />
        </div>
      )}
    </div>
  )
}
