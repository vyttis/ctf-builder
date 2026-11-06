// A short marker that changes whenever a task of an activity is added,
// removed or saved (challenges.updated_at is set by a trigger on every
// update). Participants compare it with the one they loaded and reload the
// tasks when it differs, so an edit made during the activity reaches them
// within one status poll. Every task's id and time go into it, not only the
// latest time: the trigger stamps the transaction's start, so a save that
// commits after a later-started one can carry an older time.

type TaskStamp = { id: string; updated_at: string | null }

export function tasksVersion(tasks: TaskStamp[] | null | undefined): string {
  const list = tasks ?? []
  const parts = list.map((t) => `${t.id}@${t.updated_at ?? ""}`).sort()
  return `${list.length}:${hash53(parts.join("|"))}`
}

// cyrb53: a fast 53-bit string hash; collisions only matter as a missed
// reload, which the next edit or page load corrects.
function hash53(text: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)
}

// After a reload, the position of the task that was on screen, found by its
// id; null when that task is no longer in the list (or nothing was open).
export function remapTaskIndex(
  prev: { id: string }[],
  next: { id: string }[],
  index: number | null
): number | null {
  if (index === null) return null
  const id = prev[index]?.id
  if (!id) return null
  const found = next.findIndex((task) => task.id === id)
  return found >= 0 ? found : null
}
