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

/** FNV-1a: a small, stable string hash. */
function fnv1a(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * "Maišyti užduočių tvarką": each team gets its own order, the same on every
 * reload and device. Each task's place comes from a hash of the team and the
 * task, so a task added later slots in without moving the others.
 */
export function orderForTeam<T extends { id: string }>(challenges: T[], teamId: string): T[] {
  return challenges
    .map((c) => ({ c, key: fnv1a(`${teamId}:${c.id}`) }))
    .sort((a, b) => a.key - b.key || (a.c.id < b.c.id ? -1 : a.c.id > b.c.id ? 1 : 0))
    .map(({ c }) => c)
}

// Tasks go only to a team of this activity, and of their hints only the ones
// the team opened: a visitor with the code (or an open browser console)
// cannot read the tasks before joining, nor hints without the penalty.
export function forParticipant(state: unknown, reveals: HintReveal[], tasksVersion: string | null) {
  if (!state || typeof state !== "object") return state
  const s = state as { team?: { id?: unknown } | null; challenges?: unknown; game?: { settings?: unknown } | null }
  const challenges = Array.isArray(s.challenges) ? (s.challenges as { id: string; hints?: unknown }[]) : []
  const teamId = s.team && typeof s.team.id === "string" ? s.team.id : null
  const settings = (s.game?.settings ?? null) as { shuffle_challenges?: unknown } | null
  const ordered = teamId && settings?.shuffle_challenges === true ? orderForTeam(challenges, teamId) : challenges
  return {
    ...s,
    challenges: s.team ? hideUnopenedHints(ordered, reveals) : [],
    tasks_version: tasksVersion,
  }
}
