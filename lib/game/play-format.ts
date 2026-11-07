/** Small helpers of the participant task page (app/play/[gameCode]/play). */

/** Countdown text: "MM:SS", or "H:MM:SS" from an hour up; "00:00" when over. */
export function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mmss = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  return h > 0 ? `${h}:${mmss}` : mmss
}

// Number challenges accept both decimal separators: Lithuanian mobile
// keypads type "3,14", facilitators hash "3.14". The server compares by
// value (lib/game/number-answer.ts); this only tidies what is sent.
export function normalizeNumericAnswer(value: string): string {
  return value.trim().replace(",", ".")
}

/** How many hints the team has opened (an unopened one is null). */
export function openedHintCount(challenge: { hints?: (string | null)[] } | undefined): number {
  return (challenge?.hints ?? []).filter((hint) => hint !== null).length
}

// The free-mode sheet starts clean for another task, and when the open task
// changes what an answer looks like (type or choices).
export function sheetKey(challenge: { id: string; type: string; options: string[] | null } | undefined): string {
  return challenge ? `${challenge.id}:${challenge.type}:${JSON.stringify(challenge.options)}` : "none"
}
