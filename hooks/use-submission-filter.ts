"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { submissionFilter } from "@/lib/realtime/submission-filter"

/** How often the task list is read again: tasks can be added while live. */
const RECHECK_MS = 60_000

/**
 * The realtime filter for an activity's answers, and its task titles.
 *
 * `filter` is undefined until the task list has been read once (subscribe
 * after that, not before, so the channel is not opened twice), null when no
 * filter can be used (read failed, no tasks, too many), and a string
 * otherwise. It changes only when the task list changes, e.g. a task added
 * during the activity; the subscriber then subscribes again.
 */
export function useSubmissionFilter(gameId: string): {
  filter: string | null | undefined
  titles: Map<string, string>
} {
  const [state, setState] = useState<{
    gameId: string
    filter: string | null
    titles: Map<string, string>
  } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    const read = async () => {
      const { data, error } = await supabase.from("challenges").select("id, title").eq("game_id", gameId)
      if (cancelled) return
      if (error || !data) {
        // Keep a filter that worked; the first failure falls back to none.
        setState((prev) => (prev?.gameId === gameId ? prev : { gameId, filter: null, titles: new Map() }))
        return
      }
      const filter = submissionFilter(data.map((c) => c.id))
      const titles = new Map(data.map((c) => [c.id, c.title as string]))
      setState((prev) =>
        prev?.gameId === gameId && prev.filter === filter && sameTitles(prev.titles, titles)
          ? prev
          : { gameId, filter, titles }
      )
    }

    read()
    const interval = setInterval(read, RECHECK_MS)
    const onShow = () => {
      if (document.visibilityState === "visible") read()
    }
    document.addEventListener("visibilitychange", onShow)
    window.addEventListener("online", onShow)
    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onShow)
      window.removeEventListener("online", onShow)
    }
  }, [gameId])

  const current = state?.gameId === gameId ? state : null
  return { filter: current ? current.filter : undefined, titles: current?.titles ?? EMPTY }
}

const EMPTY = new Map<string, string>()

function sameTitles(a: Map<string, string>, b: Map<string, string>): boolean {
  if (a.size !== b.size) return false
  for (const [id, title] of a) if (b.get(id) !== title) return false
  return true
}
