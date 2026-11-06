"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"

/**
 * "Išeiti" with a second step: leaving drops the team's session on this
 * device, and coming back needs the facilitator's "Grąžinti į komandą" QR,
 * so a stray tap must not do it.
 */
export function LeaveTeamButton({ onLeave }: { onLeave: () => void }) {
  const [asking, setAsking] = useState(false)

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className="text-xs text-muted-foreground/70 hover:text-accent-ink transition-colors inline-flex items-center gap-1"
      >
        <LogOut className="h-3 w-3" aria-hidden="true" />
        Išeiti
      </button>
    )
  }

  return (
    <span role="group" aria-label="Išeiti iš komandos?" className="inline-flex flex-wrap items-center justify-center gap-2 text-xs">
      <span className="text-steam-dark">Išeiti iš komandos? Grąžinti galės tik vedėjas.</span>
      <button
        type="button"
        onClick={onLeave}
        className="rounded px-2 py-1 font-medium text-accent-ink hover:bg-accent/10"
      >
        Taip, išeiti
      </button>
      <button
        type="button"
        autoFocus
        onClick={() => setAsking(false)}
        className="rounded px-2 py-1 font-medium text-steam-dark hover:bg-muted"
      >
        Likti
      </button>
    </span>
  )
}
