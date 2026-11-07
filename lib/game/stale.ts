/**
 * When an activity counts as left running after a lesson (owner decision
 * 2026-11-07: such activities are finished automatically).
 *
 * A lesson is at most a few hours, so an activity that started more than
 * six hours ago and has had no answers, no new teams and no facilitator
 * action (pause, resume, extension) for two hours is not being used. A
 * day-long workshop that is still answering keeps running.
 */
export const STALE_MIN_AGE_MS = 6 * 60 * 60 * 1000
export const STALE_QUIET_MS = 2 * 60 * 60 * 1000

export type StaleCheck = {
  /** First start (games.starts_at), or creation when it was never set. */
  startedAt: string
  /** Latest of: answer, team join, change to the activity row. */
  lastActivityAt: string
}

function time(iso: string): number {
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : Number.NaN
}

export function isStaleActivity({ startedAt, lastActivityAt }: StaleCheck, now = Date.now()): boolean {
  const started = time(startedAt)
  const last = time(lastActivityAt)
  // Unreadable times: leave the activity alone.
  if (Number.isNaN(started) || Number.isNaN(last)) return false
  return now - started >= STALE_MIN_AGE_MS && now - last >= STALE_QUIET_MS
}

/** The latest of several ISO times (nulls ignored). */
export function latest(...times: Array<string | null | undefined>): string | null {
  let best: string | null = null
  let bestT = -Infinity
  for (const iso of times) {
    if (!iso) continue
    const t = time(iso)
    if (!Number.isNaN(t) && t > bestT) {
      best = iso
      bestT = t
    }
  }
  return best
}
