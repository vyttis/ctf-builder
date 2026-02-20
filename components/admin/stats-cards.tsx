import { Card, CardContent } from "@/components/ui/card"
import {
  Gamepad2,
  Users,
  Trophy,
  CheckCircle,
  BookOpen,
  Zap,
  Target,
} from "lucide-react"
import { PlatformStats } from "@/types/game"

interface StatsCardsProps {
  stats: PlatformStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      label: "Viso žaidimų",
      value: stats.total_games,
      icon: Gamepad2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Aktyvūs žaidimai",
      value: stats.active_games,
      icon: Zap,
      color: "text-highlight",
      bg: "bg-highlight/10",
    },
    {
      label: "Mokytojai",
      value: stats.total_teachers,
      icon: Users,
      color: "text-secondary",
      bg: "bg-secondary/10",
    },
    {
      label: "Viso vartotojų",
      value: stats.total_users,
      icon: Users,
      color: "text-steam-dark",
      bg: "bg-steam-dark/10",
    },
    {
      label: "Komandos",
      value: stats.total_teams,
      icon: Trophy,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      label: "Atsakymai",
      value: stats.total_submissions,
      icon: Target,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
    {
      label: "Teisingi atsakymai",
      value: stats.correct_submissions,
      icon: CheckCircle,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Biblioteka",
      value: stats.library_items_approved,
      icon: BookOpen,
      color: "text-secondary",
      bg: "bg-secondary/10",
      extra: stats.library_items_pending > 0
        ? `+${stats.library_items_pending} laukia`
        : undefined,
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="border-border/50 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}
              >
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-steam-dark leading-none">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {card.label}
                </p>
                {card.extra && (
                  <p className="text-xs text-highlight font-medium">
                    {card.extra}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
