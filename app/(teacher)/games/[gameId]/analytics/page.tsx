"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { AnalyticsCards } from "@/components/teacher/analytics-cards"
import { ChallengeStatsTable } from "@/components/teacher/challenge-stats-table"
import { ReflectionsTable } from "@/components/teacher/reflections-table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GameStats } from "@/types/game"
import { ArrowLeft, BarChart3, Loader2, MessageSquare } from "lucide-react"
import Link from "next/link"

interface Reflection {
  id: string
  team_name: string
  hardest_challenge_title: string | null
  improvement_text: string
  liked_text: string | null
  created_at: string
}

export default function GameAnalyticsPage() {
  const params = useParams()
  const gameId = params.gameId as string
  const [stats, setStats] = useState<GameStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Reflections state (lazy-loaded)
  const [reflections, setReflections] = useState<Reflection[] | null>(null)
  const [totalTeams, setTotalTeams] = useState(0)
  const [reflectionsLoading, setReflectionsLoading] = useState(false)
  const [reflectionsError, setReflectionsError] = useState("")

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

  async function loadReflections() {
    if (reflections !== null) return // Already loaded
    setReflectionsLoading(true)
    setReflectionsError("")
    try {
      const res = await fetch(`/api/games/${gameId}/reflections`)
      if (!res.ok) {
        throw new Error("Nepavyko gauti refleksijų")
      }
      const data = await res.json()
      setReflections(data.reflections || [])
      setTotalTeams(data.total_teams || 0)
    } catch (err: unknown) {
      setReflectionsError(err instanceof Error ? err.message : "Nežinoma klaida")
    } finally {
      setReflectionsLoading(false)
    }
  }

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

      <Tabs defaultValue="stats" onValueChange={(v) => {
        if (v === "reflections") loadReflections()
      }}>
        <TabsList className="mb-6">
          <TabsTrigger value="stats" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Statistika
          </TabsTrigger>
          <TabsTrigger value="reflections" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Refleksijos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          {stats && (
            <div className="space-y-6">
              <AnalyticsCards stats={stats} />
              <ChallengeStatsTable stats={stats.challenge_stats || []} />
            </div>
          )}
        </TabsContent>

        <TabsContent value="reflections">
          {reflectionsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {reflectionsError && (
            <div className="text-center py-12">
              <p className="text-accent text-sm">{reflectionsError}</p>
            </div>
          )}
          {reflections !== null && !reflectionsLoading && !reflectionsError && (
            <ReflectionsTable
              reflections={reflections}
              totalTeams={totalTeams}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
