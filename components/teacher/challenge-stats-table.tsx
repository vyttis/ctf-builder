import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChallengeStatItem } from "@/types/game"
import { BarChart3 } from "lucide-react"

interface ChallengeStatsTableProps {
  stats: ChallengeStatItem[]
}

export function ChallengeStatsTable({ stats }: ChallengeStatsTableProps) {
  return (
    <Card className="border-border/50 bg-white">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Užduočių statistika
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats && stats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">
                    #
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground py-3 px-2">
                    Užduotis
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">
                    Taškai
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">
                    Bandymai
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">
                    Išsprendė
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">
                    Sėkmės %
                  </th>
                  <th className="text-center text-xs font-medium text-muted-foreground py-3 px-2">
                    Vid. bandymų
                  </th>
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
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
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
                      <td className="py-3 px-2 text-center text-sm font-medium text-primary">
                        {stat.solves}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">
                            {successRate}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-muted-foreground">
                        {stat.avg_attempts_to_solve || "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Dar nėra statistikos duomenų
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
