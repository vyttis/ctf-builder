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

// An option that points at the others ("Visi išvardyti", "Nė vienas iš
// jų", "A ir B atsakymai teisingi") only makes sense in the order the
// facilitator wrote. Phrases, not single words: "Visi vaikai turi šią
// teisę" or "pakilo aukščiau nulio" do not refer to other options.
const REFERS_TO_OTHER_OPTIONS = [
  /\b(visi|visos|visa)\s+(išvard|aukščiau|anksčiau|pateikt|nurodyt|minėt|atsakym|variant)/iu,
  /\b(aukščiau|anksčiau)\s+(išvard|minėt|pateikt|nurodyt)/iu,
  /\b(nė|nei)\s+vien(as|a)\s+(iš|atsakym|variant|nėra)/iu,
  /\b(abu|abi)\s+(atsakym|variant|teising|aukščiau|anksčiau)/iu,
  /\b(joks|jokia)\s+(iš|atsakym|variant)/iu,
  // The whole option is one such word: "Visi", "Abu", "Nė vienas".
  /^\s*(visi|visos|abu|abi|joks|jokia|(nė|nei)\s+vien(as|a))\s*[.!]?\s*$/iu,
  // Option letters as the participant sees them: "A ir B", "A, B ir C".
  /(^|[^\p{L}])[A-F]\s*(,|ir|bei|arba)\s*[A-F](?![\p{L}])/u,
]

export function optionsReferToEachOther(options: readonly string[]): boolean {
  return options.some((o) => REFERS_TO_OTHER_OPTIONS.some((re) => re.test(o)))
}

/**
 * Choice options in an order of the team's own, the same on every reload
 * and device. A generated task often lists the right answer first, and
 * neighbouring teams cannot pass on "it's B". The answer is checked by the
 * option's text, so the order does not affect checking.
 */
export function optionsForTeam(options: readonly string[], teamId: string, challengeId: string): string[] {
  if (options.length < 2 || optionsReferToEachOther(options)) return [...options]
  return options
    .map((o, i) => ({ o, key: fnv1a(`${teamId}:${challengeId}:${i}:${o}`) }))
    .sort((a, b) => a.key - b.key)
    .map(({ o }) => o)
}

function withTeamOptionOrder<T extends { id: string; type?: unknown; options?: unknown }>(
  challenges: T[],
  teamId: string
): T[] {
  return challenges.map((c) =>
    c.type === "multiple_choice" && Array.isArray(c.options) && c.options.every((o) => typeof o === "string")
      ? { ...c, options: optionsForTeam(c.options as string[], teamId, c.id) }
      : c
  )
}

/** When the team pressed "Pradėti" (null: not yet), read on the server. */
export interface TeamStart {
  startedAt: string | null
  pauseOffsetMs: number
}

/**
 * A timed activity runs each team's clock from its "Pradėti": until then the
 * team gets how many tasks there are, not the tasks, so nobody reads ahead
 * before the clock starts.
 */
export function waitsForStart(
  state: { team?: unknown; game?: { status?: unknown; settings?: unknown } | null },
  start: TeamStart | null
): boolean {
  if (!state.team || !start || start.startedAt) return false
  const settings = (state.game?.settings ?? null) as { time_limit_minutes?: unknown } | null
  const limit = settings?.time_limit_minutes
  const status = state.game?.status
  return typeof limit === "number" && limit > 0 && (status === "active" || status === "paused")
}

// Tasks go only to a team of this activity, and of their hints only the ones
// the team opened: a visitor with the code (or an open browser console)
// cannot read the tasks before joining, nor hints without the penalty, nor
// the tasks of a timed activity before the team starts its clock.
export function forParticipant(
  state: unknown,
  reveals: HintReveal[],
  tasksVersion: string | null,
  start: TeamStart | null = null
) {
  if (!state || typeof state !== "object") return state
  const s = state as {
    team?: { id?: unknown } | null
    challenges?: unknown
    game?: { status?: unknown; settings?: unknown } | null
  }
  const challenges = Array.isArray(s.challenges)
    ? (s.challenges as { id: string; hints?: unknown; type?: unknown; options?: unknown }[])
    : []
  const teamId = s.team && typeof s.team.id === "string" ? s.team.id : null
  const settings = (s.game?.settings ?? null) as { shuffle_challenges?: unknown } | null
  const inTeamOrder = teamId && settings?.shuffle_challenges === true ? orderForTeam(challenges, teamId) : challenges
  const ordered = teamId ? withTeamOptionOrder(inTeamOrder, teamId) : inTeamOrder
  const waiting = waitsForStart(s, start)
  return {
    ...s,
    challenges: s.team && !waiting ? hideUnopenedHints(ordered, reveals) : [],
    ...(s.team
      ? {
          challenge_count: challenges.length,
          awaiting_start: waiting,
          team_started_at: start?.startedAt ?? null,
          team_pause_offset_ms: start?.pauseOffsetMs ?? 0,
        }
      : {}),
    tasks_version: tasksVersion,
  }
}
