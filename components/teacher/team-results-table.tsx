"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { csvFileSlug, exportCsv } from "@/lib/csv"
import type { TeamResultStat } from "@/lib/game/detailed-stats"
import { Download, Trophy, Users } from "lucide-react"

interface TeamResultsTableProps {
  teamStats: TeamResultStat[]
  totalChallenges: number
  /** Activity title, added to the file name. */
  fileLabel?: string
}

export function TeamResultsTable({
  teamStats,
  totalChallenges,
  fileLabel,
}: TeamResultsTableProps) {
  function handleExport() {
    const label = fileLabel ? `${csvFileSlug(fileLabel)}_` : ""
    exportCsv(
      `rezultatai_${label}${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Vieta",
        "Komanda",
        "Taškai",
        "Išspręsta užduočių",
        "Bandymai",
        "Panaudota užuominų",
        "Prisijungė",
        "Paskutinis aktyvumas",
      ],
      teamStats.map((t, i) => [
        i + 1,
        t.name,
        t.total_points,
        `${t.solved} / ${totalChallenges}`,
        t.attempts,
        t.hints_used,
        new Date(t.joined_at).toLocaleString("lt-LT"),
        t.last_activity ? new Date(t.last_activity).toLocaleString("lt-LT") : "—",
      ])
    )
  }

  if (teamStats.length === 0) {
    return (
      <Card className="border-border/50 bg-white">
        <CardContent className="py-10 text-center text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Žaidime nedalyvavo nė viena komanda</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-highlight" />
          Komandų rezultatai
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-2 text-xs"
        >
          <Download className="h-3.5 w-3.5" />
          Eksportuoti CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">#</th>
                <th className="text-left py-2.5 px-3 font-medium text-muted-foreground">Komanda</th>
                <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Taškai</th>
                <th className="text-right py-2.5 px-3 font-medium text-muted-foreground whitespace-nowrap">Išspręsta</th>
                <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Bandymai</th>
                <th className="text-right py-2.5 px-3 font-medium text-muted-foreground">Užuominos</th>
                <th className="text-left py-2.5 px-3 font-medium text-muted-foreground whitespace-nowrap">Paskutinis aktyvumas</th>
              </tr>
            </thead>
            <tbody>
              {teamStats.map((team, index) => (
                <tr key={team.team_id} className="border-b last:border-0 hover:bg-muted/10">
                  <td className="py-2.5 px-3">
                    {index < 3 ? (
                      <Badge
                        variant="outline"
                        className={`text-xs px-1.5 ${
                          index === 0
                            ? "border-highlight/50 text-highlight"
                            : index === 1
                            ? "border-border text-muted-foreground"
                            : "border-accent/40 text-accent"
                        }`}
                      >
                        {index + 1}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">{index + 1}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-steam-dark">{team.name}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-steam-green tabular-nums">
                    {team.total_points}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums">
                    {team.solved} / {totalChallenges}
                  </td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground tabular-nums">
                    {team.attempts}
                  </td>
                  <td className="py-2.5 px-3 text-right text-muted-foreground tabular-nums">
                    {team.hints_used}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                    {team.last_activity
                      ? new Date(team.last_activity).toLocaleString("lt-LT", {
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
