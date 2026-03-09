import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Challenge } from "@/types/game"
import { LessonGenerator } from "@/components/teacher/lesson-generator"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function LessonGeneratorPage({
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
    .select("*, challenges(*)")
    .eq("id", params.gameId)
    .eq("teacher_id", user!.id)
    .single()

  if (!game) {
    notFound()
  }

  const challenges = (game.challenges || []) as Challenge[]

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/games/${game.id}`} className="inline-block mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Grįžti į žaidimą
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-steam-dark">
          Pamokos generatorius
        </h1>
        <p className="text-muted-foreground mt-1">
          Sukurkite struktūruotą pamoką pagal Lietuvos ugdymo programą.
          Sugeneruotos veiklos taps žaidimo užduotimis.
        </p>
      </div>

      <LessonGenerator
        gameId={game.id}
        gameTitle={game.title}
        gameDescription={game.description}
        existingChallenges={challenges}
      />
    </div>
  )
}
