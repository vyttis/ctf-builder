import { createClient } from "@/lib/supabase/server"
import { GamesGrid } from "@/components/teacher/games-grid"
import { GameWithChallengeCount } from "@/types/game"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Gamepad2, BookOpen, ArrowRight } from "lucide-react"
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

  const latestGameId = games?.[0]?.id

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-steam-dark">
            Mano žaidimai
          </h1>
          <p className="text-muted-foreground mt-1">
            Kurkite ir valdykite CTF žaidimus savo klasei
          </p>
        </div>
        <Link href="/games/new">
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 gap-2">
            <Plus className="h-4 w-4" />
            Naujas žaidimas
          </Button>
        </Link>
      </div>

      {/* Lesson generator CTA */}
      {latestGameId && (
        <Link href={`/games/${latestGameId}/lesson`}>
          <Card className="mb-6 border-secondary/30 bg-gradient-to-r from-secondary/5 to-secondary/10 hover:shadow-lg hover:shadow-secondary/10 transition-all duration-300 group cursor-pointer">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 group-hover:bg-secondary/20 transition-colors">
                <BookOpen className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-steam-dark text-sm">
                  Pamokos generatorius
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sukurkite struktūruotą pamoką pagal Lietuvos ugdymo programą su DI pagalba
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-secondary shrink-0 group-hover:translate-x-1 transition-transform" />
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Games grid */}
      {games && games.length > 0 ? (
        <GamesGrid games={games as GameWithChallengeCount[]} />
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-48 h-48 mb-6">
            <Image src="/illustrations/empty-state.svg" alt="Nėra žaidimų" width={192} height={192} className="w-full h-full" />
          </div>
          <Gamepad2 className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold text-steam-dark mb-2">
            Dar nėra žaidimų
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Sukurkite savo pirmąjį CTF žaidimą ir leiskite mokiniams tyrinėti bei mokytis žaidžiant
          </p>
          <Link href="/games/new">
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 gap-2">
              <Plus className="h-4 w-4" />
              Sukurti pirmąjį žaidimą
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
