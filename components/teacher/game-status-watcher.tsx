"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import type { GameStatus } from "@/types/game"

/**
 * Keeps the activity page in step with other devices: when the class screen
 * (or another tab) starts, pauses, resumes, extends or finishes the
 * activity, this page reloads its data instead of showing the old state.
 */
export function GameStatusWatcher({
  gameCode,
  status,
  timeLimit,
}: {
  gameCode: string
  status: GameStatus
  timeLimit: number | null
}) {
  const router = useRouter()

  useEffect(() => {
    if (status === "finished") return
    let disposed = false
    const check = async () => {
      try {
        const res = await fetch(`/api/play/status?game_code=${encodeURIComponent(gameCode)}`, { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as { status: GameStatus | null; time_limit_minutes?: number | null }
        if (disposed || !data.status) return
        const limitChanged = data.time_limit_minutes !== undefined && (data.time_limit_minutes ?? null) !== timeLimit
        if (data.status !== status || limitChanged) router.refresh()
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
  }, [gameCode, status, timeLimit, router])

  return null
}
