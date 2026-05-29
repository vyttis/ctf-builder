"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import {
  BarChart3,
  Users,
  Trophy,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react"
import type { GameStats, ChallengeStatItem } from "@/types/game"

interface GameResultsSummaryProps {
  gameId: string
  totalChallenges: number
}

/**
 * Post-game pedagogical summary for the teacher.
 * Mirrors the data the Ministry inspector expects to see: completion rate,
 * difficulty distribution, hardest-challenge call-out, team leaderboard.
 *
 * Renders only after at least one team has joined and submitted answers —
 * empty otherwise.
 */
export function GameResultsSummary({ gameId, totalChallenges }: GameResultsSummaryProps) {
  const [stats, setStats] = useState<GameStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/games/${gameId}/analytics`)
        if (!res.ok) {
          if (!cancelled) setError("Nepavyko gauti statistikos")
          return
        }
        const data = (await res.json()) as GameStats
        if (!cancelled) setStats(data)
      } catch {
        if (!cancelled) setError("Nepavyko gauti statistikos")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [gameId])

  if (loading) {
    return (
      <Card className="border-border/50 bg-white">
        <CardContent className="p-6 flex items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Skaičiuojama klasės statistika…</span>
        </CardContent>
      </Card>
    )
  }

  if (error || !stats) return null
  if (stats.total_teams === 0) return null

  const overallAccuracy =
    stats.total_submissions > 0
      ? Math.round((stats.correct_submissions / stats.total_submissions) * 100)
      : 0
  const completionPct =
    totalChallenges > 0 && stats.total_teams > 0
      ? Math.round(
          (stats.challenge_stats.reduce((sum, c) => sum + c.solves, 0) /
            (totalChallenges * stats.total_teams)) *
            100,
        )
      : 0

  const hardest = [...stats.challenge_stats]
    .filter((c) => c.attempts > 0)
    .sort((a, b) => a.solves / Math.max(a.attempts, 1) - b.solves / Math.max(b.attempts, 1))
    .slice(0, 3)

  const easiest = [...stats.challenge_stats]
    .filter((c) => c.attempts > 0)
    .sort((a, b) => b.solves / Math.max(b.attempts, 1) - a.solves / Math.max(a.attempts, 1))
    .slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 to-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-secondary" />
            Klasės rezultatų suvestinė
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Pedagoginis pamokos eigos apibendrinimas — kas pavyko, kur reikia grįžti.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Top-line KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard
              icon={<Users className="h-4 w-4" />}
              label="Komandos"
              value={stats.total_teams.toString()}
              tint="secondary"
            />
            <KpiCard
              icon={<CheckCircle2 className="h-4 w-4" />}
              label="Užbaigta"
              value={`${completionPct}%`}
              hint={`${stats.challenge_stats.reduce((s, c) => s + c.solves, 0)} / ${totalChallenges * stats.total_teams}`}
              tint="primary"
            />
            <KpiCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Bandymų tikslumas"
              value={`${overallAccuracy}%`}
              hint={`${stats.correct_submissions} iš ${stats.total_submissions}`}
              tint="highlight"
            />
            <KpiCard
              icon={<Trophy className="h-4 w-4" />}
              label="Iš viso užduočių"
              value={totalChallenges.toString()}
              tint="accent"
            />
          </div>

          {/* Hardest / easiest split */}
          {hardest.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              <ChallengeListPanel
                title="Sudėtingiausios užduotys"
                hint="Kur klasė užstrigo — verta aptarti."
                icon={<AlertCircle className="h-4 w-4 text-accent" />}
                tone="accent"
                items={hardest}
                totalTeams={stats.total_teams}
              />
              <ChallengeListPanel
                title="Lengviausiai pavyko"
                hint="Mokiniai jau valdo šią medžiagą."
                icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
                tone="primary"
                items={easiest}
                totalTeams={stats.total_teams}
              />
            </div>
          )}

          {/* Methodological note */}
          <div className="rounded-lg border border-secondary/30 bg-secondary/5 p-3 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-secondary">Metodinė pastaba.</strong>{" "}
            Suvestinė pateikia kiekybinius rodiklius. Pedagoginis vertinimas reikalauja
            kokybinės refleksijos su klase — kas pavyko, kodėl, ką darysite kitą pamoką.
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  tint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  tint: "primary" | "secondary" | "highlight" | "accent"
}) {
  const tints: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    highlight: "bg-highlight/15 text-steam-dark",
    accent: "bg-accent/10 text-accent",
  }
  return (
    <div className="rounded-xl border border-border/40 bg-white p-3">
      <div className={`inline-flex items-center justify-center w-7 h-7 rounded-md ${tints[tint]} mb-2`}>
        {icon}
      </div>
      <div className="text-xl font-bold text-steam-dark tabular-nums leading-none">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mt-1">{label}</div>
      {hint && <div className="text-[10px] text-muted-foreground/70 mt-0.5">{hint}</div>}
    </div>
  )
}

function ChallengeListPanel({
  title,
  hint,
  icon,
  tone,
  items,
  totalTeams,
}: {
  title: string
  hint: string
  icon: React.ReactNode
  tone: "primary" | "accent"
  items: ChallengeStatItem[]
  totalTeams: number
}) {
  const borderTone = tone === "primary" ? "border-primary/20" : "border-accent/20"
  return (
    <div className={`rounded-xl border ${borderTone} bg-white p-4`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h4 className="text-sm font-semibold text-steam-dark">{title}</h4>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">{hint}</p>
      <ol className="space-y-2">
        {items.map((c) => {
          const successRate = c.attempts > 0 ? Math.round((c.solves / c.attempts) * 100) : 0
          const coveragePct = totalTeams > 0 ? Math.round((c.solves / totalTeams) * 100) : 0
          return (
            <li key={c.challenge_id} className="flex items-start justify-between gap-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-steam-dark text-[13px] truncate">
                  {c.order_index + 1}. {c.title}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  <span>{c.solves} išsprendė</span>
                  <span>·</span>
                  <span>{successRate}% tikslumas</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 ${tone === "primary" ? "border-primary/30 text-primary" : "border-accent/30 text-accent"}`}
              >
                {coveragePct}% klasės
              </Badge>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
