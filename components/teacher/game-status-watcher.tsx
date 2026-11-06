"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type { GameStatus } from "@/types/game"

/**
 * Keeps the activity page in step with other devices: when the class screen
 * (or another tab) starts, pauses, resumes or finishes the activity, this
 * page reloads its data instead of offering buttons for the old state.
 */
export function GameStatusWatcher({ gameCode, status }: { gameCode: string; status: GameStatus }) {
  const router = useRouter()

  useEffect(() => {
    if (status === "finished") return
    let disposed = false
    const check = async () => {
      try {
        const res = await fetch(`/api/play/status?game_code=${encodeURIComponent(gameCode)}`, { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as { status: GameStatus | null }
        if (!disposed && data.status && data.status !== status) router.refresh()
      } catch {
        // The next round retries.
      }
    }
    const interval = setInterval(check, 10_000)
    const onVisible = () => {
      if (document.visibilityState === "visible") void check()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      disposed = true
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [gameCode, status, router])

  return null
}
