import { createClient } from "@/lib/supabase/server"
import { withChallengeCount } from "@/lib/game/challenge-count"
import { GamesGrid } from "@/components/teacher/games-grid"
import { OnboardingChecklist } from "@/components/teacher/onboarding-checklist"
import { CreateSampleGameButton } from "@/components/teacher/create-sample-game-button"
import { GameWithChallengeCount } from "@/types/game"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Gamepad2, GraduationCap, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // teams, challenges and submissions have column-level grants only, so a
  // `teams(count)` or `challenges(count)` embed is rejected with
  // "permission denied". Embed the granted `id` column and count here.
  const { data: games, error: gamesError } = await supabase
    .from("games")
    .select("*, challenges(id), teams(id)")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false })

  if (gamesError) {
    // Surface the failure instead of rendering a misleading empty state.
    console.error("[dashboard] games query failed", {
      code: gamesError.code,
      message: gamesError.message,
    })
    throw new Error("Nepavyko įkelti veiklų")
  }

  // First-success checklist state, derived from the teacher's actual data
  type GameRow = GameWithChallengeCount & { teams?: { id: string }[] }
  const gameRows = (games || []).map(withChallengeCount) as GameRow[]
  const hasGame = gameRows.length > 0
  const gameWithTasks = gameRows.find((g) => (g.challenges?.[0]?.count || 0) > 0)
  const startedGame = gameRows.find((g) => g.status !== "draft")
  const gameWithResults = gameRows.find(
    (g) => (g.teams?.length || 0) > 0 || g.status === "finished"
  )
  const latestGame = gameRows[0]

  const onboardingSteps = [
    { label: "Sukurkite veiklą", done: hasGame, href: "/games/new" },
    {
      label: "Pridėkite užduočių",
      done: !!gameWithTasks,
      href: latestGame ? `/games/${latestGame.id}/builder` : "/games/new",
    },
    {
      label: "Pradėkite veiklą su QR kodu",
      done: !!startedGame,
      href: gameWithTasks ? `/games/${gameWithTasks.id}` : "/games/new",
    },
    {
      label: "Peržiūrėkite rezultatus",
      done: !!gameWithResults,
      href: startedGame ? `/games/${startedGame.id}/analytics` : "/games/new",
    },
  ]
  const showChecklist = onboardingSteps.some((s) => !s.done)

  return (
    <div>
      {/* First-success checklist (hides itself when all steps are done) */}
      {showChecklist && (
        <OnboardingChecklist
          steps={onboardingSteps}
          showSampleGameButton={!gameWithTasks}
        />
      )}

      {/* Two clear paths */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Path 1: Lesson plans */}
        <Link href="/lesson-plans/new">
          <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 to-secondary/10 hover:shadow-lg hover:shadow-secondary/10 transition-all duration-300 group cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <GraduationCap className="h-7 w-7 text-secondary-ink" />
              </div>
              <div>
                <h3 className="font-bold text-steam-dark text-base mb-1">
                  Kurti pamokos planą
                </h3>
                <p className="text-xs text-muted-foreground">
                  Struktūruotas pamokos planas pagal ugdymo programą su DI pagalba
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-secondary-ink group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>

        {/* Path 2: Student activity */}
        <Link href="/games/new">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Gamepad2 className="h-7 w-7 text-primary-ink" />
              </div>
              <div>
                <h3 className="font-bold text-steam-dark text-base mb-1">
                  Kurti veiklą dalyviams
                </h3>
                <p className="text-xs text-muted-foreground">
                  Interaktyvi veikla su užduotimis, kurią dalyviai atlieka klasėje
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-primary-ink group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Activities header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-steam-dark">
            Mano veiklos
          </h1>
          <p className="text-muted-foreground mt-1">
            Interaktyvios komandinės veiklos jūsų grupei
          </p>
        </div>
        <Link href="/games/new">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 gap-2">
            <Plus className="h-4 w-4" />
            Nauja veikla
          </Button>
        </Link>
      </div>

      {/* Games grid */}
      {gameRows.length > 0 ? (
        <GamesGrid games={gameRows} />
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-48 h-48 mb-6">
            <Image src="/illustrations/empty-state.svg" alt="Nėra veiklų" width={192} height={192} className="w-full h-full" />
          </div>
          <Gamepad2 className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold text-steam-dark mb-2">
            Dar nėra veiklų
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Sukurkite interaktyvią veiklą savo klasei arba pradėkite nuo pamokos plano
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/lesson-plans/new">
              <Button variant="outline" className="gap-2 border-secondary/30 text-secondary-ink hover:bg-secondary/5">
                <GraduationCap className="h-4 w-4" />
                Kurti pamokos planą
              </Button>
            </Link>
            <Link href="/games/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 gap-2">
                <Plus className="h-4 w-4" />
                Kurti veiklą
              </Button>
            </Link>
            <CreateSampleGameButton />
          </div>
        </div>
      )}
    </div>
  )
}
