/**
 * While an activity runs (or is paused), participants see its tasks as they
 * are. Removing a task takes its answers away while team points stay,
 * reordering moves teams in linear mode, and a task without an answer cannot
 * be solved. Those changes wait until the activity has ended.
 */
export function isLiveStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "paused"
}

export const LIVE_EDIT_BLOCKED = {
  delete: "Vykstančios veiklos užduočių negalima ištrinti. Tai galėsite padaryti, kai veikla baigsis.",
  reorder: "Vykstančios veiklos užduočių tvarkos keisti negalima.",
  needsAnswer: "Vykstančiai veiklai negalima pridėti užduoties be atsakymo. Įrašykite teisingą atsakymą.",
  prerequisites: "Vykstančios veiklos užduočių atrakinimo sąlygų keisti negalima.",
  finishedWithAnswers:
    "Šios užduoties atsakymai yra baigtos veiklos ataskaitoje, todėl jos ištrinti negalima. Norėdami keisti užduotis, nukopijuokite veiklą.",
} as const

/** Two prerequisite lists name the same tasks (order does not matter). */
export function samePrerequisites(a: readonly string[] | null | undefined, b: readonly string[] | null | undefined): boolean {
  const left = new Set(a ?? [])
  const right = new Set(b ?? [])
  if (left.size !== right.size) return false
  for (const id of left) if (!right.has(id)) return false
  return true
}
