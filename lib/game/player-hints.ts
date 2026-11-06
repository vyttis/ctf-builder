// Participants get the text of a hint only after the team opened it
// (POST /api/play/hint records the reveal and the penalty). Every other hint
// is sent as null, so its count is known but not its text.

export type HintReveal = { challenge_id: string; hint_index: number }

export function hideUnopenedHints<T extends { id: string; hints?: unknown }>(
  challenges: T[],
  reveals: HintReveal[]
): (T & { hints: (string | null)[] })[] {
  const opened = new Set(reveals.map((r) => `${r.challenge_id}:${r.hint_index}`))
  return challenges.map((challenge) => {
    const hints = Array.isArray(challenge.hints) ? challenge.hints : []
    return {
      ...challenge,
      hints: hints.map((hint, i) =>
        typeof hint === "string" && opened.has(`${challenge.id}:${i}`) ? hint : null
      ),
    }
  })
}

// Tasks go only to a team of this activity, and of their hints only the ones
// the team opened: a visitor with the code (or an open browser console)
// cannot read the tasks before joining, nor hints without the penalty.
export function forParticipant(state: unknown, reveals: HintReveal[], tasksVersion: string | null) {
  if (!state || typeof state !== "object") return state
  const s = state as { team?: unknown; challenges?: unknown }
  const challenges = Array.isArray(s.challenges) ? (s.challenges as { id: string; hints?: unknown }[]) : []
  return {
    ...s,
    challenges: s.team ? hideUnopenedHints(challenges, reveals) : [],
    tasks_version: tasksVersion,
  }
}
