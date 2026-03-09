import { createClient } from "@/lib/supabase/server"
import { GamesGrid } from "@/components/teacher/games-grid"
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

  const { data: games } = await supabase
    .from("games")
    .select("*, challenges(count)")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false })

  return (
    <div>
      {/* Two clear paths */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {/* Path 1: Lesson plans */}
        <Link href="/lesson-plans/new">
          <Card className="border-secondary/30 bg-gradient-to-br from-secondary/5 to-secondary/10 hover:shadow-lg hover:shadow-secondary/10 transition-all duration-300 group cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                <GraduationCap className="h-7 w-7 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-steam-dark text-base mb-1">
                  Kurti pamokos planą
                </h3>
                <p className="text-xs text-muted-foreground">
                  Struktūruotas pamokos planas pagal ugdymo programą su DI pagalba
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-secondary group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>

        {/* Path 2: Student activity */}
        <Link href="/games/new">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group cursor-pointer h-full">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Gamepad2 className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-steam-dark text-base mb-1">
                  Kurti veiklą mokiniams
                </h3>
                <p className="text-xs text-muted-foreground">
                  Interaktyvi veikla su užduotimis, kurią mokiniai atlieka klasėje
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Activities header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-steam-dark">
            Veiklos mokiniams
          </h1>
          <p className="text-muted-foreground mt-1">
            Interaktyvios veiklos ir žaidimai jūsų klasei
          </p>
        </div>
        <Link href="/games/new">
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 gap-2">
            <Plus className="h-4 w-4" />
            Nauja veikla
          </Button>
        </Link>
      </div>

      {/* Games grid */}
      {games && games.length > 0 ? (
        <GamesGrid games={games as GameWithChallengeCount[]} />
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-48 h-48 mb-6">
            <Image src="/illustrations/empty-state.svg" alt="Nėra veiklų" width={192} height={192} className="w-full h-full" />
          </div>
          <Gamepad2 className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold text-steam-dark mb-2">
            Dar nėra veiklų mokiniams
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Sukurkite interaktyvią veiklą savo klasei arba pradėkite nuo pamokos plano
          </p>
          <div className="flex gap-3">
            <Link href="/lesson-plans/new">
              <Button variant="outline" className="gap-2 border-secondary/30 text-secondary hover:bg-secondary/5">
                <GraduationCap className="h-4 w-4" />
                Kurti pamokos planą
              </Button>
            </Link>
            <Link href="/games/new">
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 gap-2">
                <Plus className="h-4 w-4" />
                Kurti veiklą
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
