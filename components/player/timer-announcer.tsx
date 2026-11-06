"use client"

/** The time mark a screen reader is told about, or null above five minutes. */
export function timerMark(seconds: number): 300 | 60 | 30 | 10 | null {
  if (seconds <= 0) return null
  if (seconds <= 10) return 10
  if (seconds <= 30) return 30
  if (seconds <= 60) return 60
  if (seconds <= 300) return 300
  return null
}

const MARK_TEXT = {
  300: "Liko 5 minutės.",
  60: "Liko 1 minutė.",
  30: "Liko 30 sekundžių.",
  10: "Liko 10 sekundžių.",
} as const

/**
 * Tells screen reader users how much time is left at 5 min, 1 min, 30 s and
 * 10 s. The visible countdown changes every second, so it is not a live
 * region itself: reading it out every second would drown everything else.
 * The text here changes only when a mark is crossed.
 */
export function TimerAnnouncer({ seconds }: { seconds: number }) {
  const mark = timerMark(seconds)
  return (
    <span className="sr-only" role="status" aria-live="polite">
      {mark ? MARK_TEXT[mark] : ""}
    </span>
  )
}
