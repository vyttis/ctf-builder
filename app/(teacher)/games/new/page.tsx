import { GameForm } from "@/components/teacher/game-form"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NewGamePage() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <Link href="/dashboard" className="inline-block mb-6">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Grįžti į žaidimus
        </Button>
      </Link>

      {/* Header with illustration */}
      <div className="flex items-center gap-6 mb-8">
        <div className="hidden sm:block w-24 h-24 shrink-0">
          <img
            src="/illustrations/create-game.svg"
            alt=""
            className="w-full h-full"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-steam-dark">
            Naujas žaidimas
          </h1>
          <p className="text-muted-foreground mt-1">
            Sukurkite CTF žaidimą savo mokiniams. Vėliau galėsite pridėti užduotis.
          </p>
        </div>
      </div>

      <GameForm />
    </div>
  )
}
