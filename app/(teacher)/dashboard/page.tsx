import { createClient } from "@/lib/supabase/server"
import { GameCard } from "@/components/teacher/game-card"
import { GameWithChallengeCount } from "@/types/game"
import { Button } from "@/components/ui/button"
import { Plus, Gamepad2 } from "lucide-react"
import Link from "next/link"

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

      {/* Games grid */}
      {games && games.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game, index) => (
            <GameCard key={game.id} game={game as GameWithChallengeCount} index={index} />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-48 h-48 mb-6">
            <img
              src="/illustrations/empty-state.svg"
              alt="Nėra žaidimų"
              className="w-full h-full"
            />
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
