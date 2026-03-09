"use client"

import { useState } from "react"
import { GameForm } from "@/components/teacher/game-form"
import { AiGameAssistant } from "@/components/teacher/ai-game-assistant"
import { AiGameIdea } from "@/lib/ai/types"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function NewGamePage() {
  const [prefillData, setPrefillData] = useState<AiGameIdea | undefined>(
    undefined
  )

  function handleAcceptIdea(idea: AiGameIdea) {
    setPrefillData(idea)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <Link href="/dashboard" className="inline-block mb-6">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Grįžti į veiklas
        </Button>
      </Link>

      {/* Header with illustration */}
      <div className="flex items-center gap-6 mb-8">
        <div className="hidden sm:block w-24 h-24 shrink-0">
          <Image src="/illustrations/create-game.svg" alt="" width={96} height={96} className="w-full h-full" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-steam-dark">
            Nauja veikla mokiniams
          </h1>
          <p className="text-muted-foreground mt-1">
            Sukurkite interaktyvią veiklą savo mokiniams. Vėliau galėsite pridėti užduotis.
          </p>
        </div>
      </div>

      {/* AI Assistant */}
      <div className="mb-6">
        <AiGameAssistant onAcceptIdea={handleAcceptIdea} />
      </div>

      <GameForm prefillData={prefillData} />
    </div>
  )
}
