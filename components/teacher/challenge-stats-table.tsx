"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChallengeStatItem } from "@/types/game"
import type { DetailedChallengeStat } from "@/lib/game/detailed-stats"
import { exportCsv } from "@/lib/csv"
import { BarChart3, Download } from "lucide-react"

interface ChallengeStatsTableProps {
  stats: ChallengeStatItem[]
  // Enriched stats from /analytics/detailed — when present the table shows
  // accuracy, completion rate and auto-difficulty instead of the basic view
  detailedStats?: DetailedChallengeStat[] | null
}

const difficultyLabels: Record<string, { label: string; className: string }> = {
  easy: { label: "Lengva", className: "text-primary-ink border-primary/30 bg-primary/5" },
  medium: { label: "Vidutinė", className: "text-highlight-ink border-highlight/30 bg-highlight/5" },
  hard: { label: "Sunki", className: "text-accent-ink border-accent/30 bg-accent/5" },
}

function ProgressCell({ percent }: { percent: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8">{percent}%</span>
    </div>
  )
}

export function ChallengeStatsTable({ stats, detailedStats }: ChallengeStatsTableProps) {
  const hasDetailed = !!detailedStats && detailedStats.length > 0

  function handleExport() {
    if (hasDetailed) {
      exportCsv(
        `uzduociu_statistika_${new Date().toISOString().slice(0, 10)}.csv`,
        [
          "#",
          "Užduotis",
          "Taškai",
          "Bandymai",
          "Išsprendė (komandų)",
          "Tikslumas %",
          "Užbaigimo %",
          "Vid. bandymų iki sprendimo",
          "Sunkumas (pagal rezultatus)",
        ],
        detailedStats!.map((s, i) => [
          i + 1,
          s.title,
          s.points,
          s.total_attempts,
          s.solves,
          s.accuracy,
          s.completion_rate,
          s.avg_attempts_to_solve || "-",
          s.auto_difficulty === "unknown"
            ? "-"
            : difficultyLabels[s.auto_difficulty]?.label || "-",
        ])
      )
    } else {
      exportCsv(
        `uzduociu_statistika_${new Date().toISOString().slice(0, 10)}.csv`,
        ["#", "Užduotis", "Taškai", "Bandymai", "Išsprendė", "Vid. bandymų"],
        stats.map((s, i) => [
          i + 1,
          s.title,
          s.points,
          s.attempts,
          s.solves,
          s.avg_attempts_to_solve || "-",
        ])
      )
    }
  }

  const rowCount = hasDetailed ? detailedStats!.length : stats.length

  return (
    <Card className="border-border/50 bg-white">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary-ink" />
          Užduočių statistika
        </CardTitle>
        {rowCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="gap-2 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Eksportuoti CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {rowCount === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Dar nėra statistikos duomenų
            </p>
          </div>
        ) : hasDetailed ? (
          <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="region" aria-label="Užduočių statistika">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">#</th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">Užduotis</th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">Taškai</th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">Bandymai</th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2 whitespace-nowrap">
                    Išsprendė (komandų)
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">Tikslumas</th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">Užbaigimas</th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2 whitespace-nowrap">
                    Vid. bandymų
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2 whitespace-nowrap">
                    Sunkumas (pagal rezultatus)
                  </th>
                </tr>
              </thead>
              <tbody>
                {detailedStats!.map((stat, index) => {
                  const autoDiff =
                    stat.auto_difficulty !== "unknown"
                      ? difficultyLabels[stat.auto_difficulty]
                      : null
                  return (
                    <tr
                      key={stat.challenge_id}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary-ink">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm font-medium text-steam-dark">
                          {stat.title}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="text-xs">
                          {stat.points}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-muted-foreground">
                        {stat.total_attempts}
                      </td>
                      <td className="py-3 px-2 text-center text-sm font-medium text-primary-ink">
                        {stat.solves}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <ProgressCell percent={stat.accuracy} />
                      </td>
                      <td className="py-3 px-2 text-center">
                        <ProgressCell percent={stat.completion_rate} />
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-muted-foreground">
                        {stat.avg_attempts_to_solve || "-"}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {autoDiff ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${autoDiff.className}`}
                          >
                            {autoDiff.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" tabIndex={0} role="region" aria-label="Užduočių statistika">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">#</th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">Užduotis</th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">Taškai</th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">Bandymai</th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">Išsprendė</th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">Sėkmės %</th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">Vid. bandymų</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((stat, index) => {
                  const successRate =
                    stat.attempts > 0
                      ? Math.round((stat.solves / stat.attempts) * 100)
                      : 0
                  return (
                    <tr
                      key={stat.challenge_id}
                      className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary-ink">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-sm font-medium text-steam-dark">
                          {stat.title}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant="outline" className="text-xs">
                          {stat.points}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-muted-foreground">
                        {stat.attempts}
                      </td>
                      <td className="py-3 px-2 text-center text-sm font-medium text-primary-ink">
                        {stat.solves}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <ProgressCell percent={successRate} />
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-muted-foreground">
                        {stat.avg_attempts_to_solve || "-"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
