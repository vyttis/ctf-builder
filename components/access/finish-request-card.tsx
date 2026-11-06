"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AccessRequestForm } from "@/components/access/access-request-form"
import { GraduationCap } from "lucide-react"

interface FinishRequestCardProps {
  gameCode: string
  sessionToken: string
}

/**
 * On the participant finish screen of an activity run for teachers: a
 * teacher can ask for a facilitator account right there. The team's session
 * proves they took part.
 */
export function FinishRequestCard({ gameCode, sessionToken }: FinishRequestCardProps) {
  const [open, setOpen] = useState(false)
  return (
    <section
      aria-labelledby="finish-request-title"
      className="mt-6 rounded-2xl border border-secondary/30 bg-secondary/5 p-5 text-left"
    >
      <div className="flex items-start gap-3">
        <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-secondary-ink" aria-hidden="true" />
        <div className="space-y-1">
          <h2 id="finish-request-title" className="font-semibold text-steam-dark">
            Norite vesti tokias veiklas savo mokiniams?
          </h2>
          <p className="text-sm text-muted-foreground">
            Pateikite prašymą gauti vedėjo paskyrą. Ją patvirtins KU STEAM centras.
          </p>
        </div>
      </div>
      {open ? (
        <div className="mt-4">
          <AccessRequestForm compact door={{ game_code: gameCode, session_token: sessionToken }} />
        </div>
      ) : (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 w-full bg-secondary-ink text-white hover:bg-secondary-ink/90"
        >
          Pateikti prašymą
        </Button>
      )}
    </section>
  )
}
