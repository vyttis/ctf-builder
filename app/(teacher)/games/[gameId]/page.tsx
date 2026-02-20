import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { GameStatus, GameSettings, Challenge } from "@/types/game"
import { QRDisplay } from "@/components/teacher/qr-display"
import { GameStatusActions } from "@/components/teacher/game-status-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PublishDialog } from "@/components/teacher/publish-dialog"
import {
  ArrowLeft,
  Puzzle,
  Settings,
  Users,
  Clock,
  Trophy,
  BarChart3,
} from "lucide-react"
import Link from "next/link"

export default async function GameDetailPage({
  params,
}: {
  params: { gameId: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: game } = await supabase
    .from("games")
    .select("*, challenges(*), teams(count)")
    .eq("id", params.gameId)
    .eq("teacher_id", user!.id)
    .single()

  if (!game) {
    notFound()
  }

  const challenges = (game.challenges || []) as Challenge[]
  const teamCount = (game.teams as { count: number }[])?.[0]?.count || 0
  const settings = game.settings as GameSettings | null

  return (
    <div>
      {/* Back */}
      <Link href="/dashboard" className="inline-block mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Visi žaidimai
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-steam-dark">{game.title}</h1>
          {game.description && (
            <p className="text-muted-foreground mt-1">{game.description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <GameStatusActions
            gameId={game.id}
            status={game.status as GameStatus}
            challengeCount={challenges.length}
          />
          <Link href={`/games/${game.id}/analytics`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
            >
              <BarChart3 className="h-4 w-4" />
              Analitika
            </Button>
          </Link>
          {(game.status === "active" || game.status === "finished") &&
            challenges.length > 0 && (
              <PublishDialog
                gameId={game.id}
                gameTitle={game.title}
                gameDescription={game.description}
              />
            )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="border-border/50 bg-white">
              <CardContent className="p-4 text-center">
                <Puzzle className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold text-steam-dark">
                  {challenges.length}
                </p>
                <p className="text-xs text-muted-foreground">Užduotys</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-white">
              <CardContent className="p-4 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-secondary" />
                <p className="text-2xl font-bold text-steam-dark">
                  {teamCount}
                </p>
                <p className="text-xs text-muted-foreground">Komandos</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-white">
              <CardContent className="p-4 text-center">
                <Trophy className="h-5 w-5 mx-auto mb-1 text-highlight" />
                <p className="text-2xl font-bold text-steam-dark">
                  {challenges.reduce(
                    (sum: number, c: Challenge) => sum + (c.points || 0),
                    0
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Viso taškų</p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-white">
              <CardContent className="p-4 text-center">
                <Clock className="h-5 w-5 mx-auto mb-1 text-accent" />
                <p className="text-2xl font-bold text-steam-dark">
                  {settings?.time_limit_minutes || "∞"}
                </p>
                <p className="text-xs text-muted-foreground">Minutės</p>
              </CardContent>
            </Card>
          </div>

          {/* Challenges section */}
          <Card className="border-border/50 bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Puzzle className="h-5 w-5 text-primary" />
                Užduotys
              </CardTitle>
              <Link href={`/games/${game.id}/challenges`}>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white gap-1"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Valdyti
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {challenges.length > 0 ? (
                <div className="space-y-3">
                  {[...challenges]
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((challenge, index) => (
                      <div
                        key={challenge.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                          {index + 1}
                        </div>
                        {challenge.image_url && (
                          <img
                            src={challenge.image_url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border/30"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-steam-dark truncate">
                            {challenge.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {challenge.points} tšk. &middot;{" "}
                            {challenge.type === "text"
                              ? "Tekstas"
                              : challenge.type === "number"
                              ? "Skaičius"
                              : "Pasirinkimas"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs"
                        >
                          {challenge.points} tšk.
                        </Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <img
                    src="/illustrations/empty-state.svg"
                    alt=""
                    className="w-32 h-32 mx-auto mb-3 opacity-50"
                  />
                  <p className="text-muted-foreground text-sm">
                    Dar nėra užduočių.{" "}
                    <Link
                      href={`/games/${game.id}/challenges`}
                      className="text-primary hover:underline"
                    >
                      Pridėkite pirmąją
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column - QR code */}
        <div className="space-y-6">
          <QRDisplay gameCode={game.game_code} />

          {/* Game info */}
          <Card className="border-border/50 bg-white">
            <CardContent className="p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sukurtas</span>
                <span className="text-steam-dark font-medium">
                  {new Date(game.created_at).toLocaleDateString("lt-LT")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Maks. komandų</span>
                <span className="text-steam-dark font-medium">
                  {settings?.max_teams || 50}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Leaderboard</span>
                <span className="text-steam-dark font-medium">
                  {settings?.show_leaderboard ? "Taip" : "Ne"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
