// A short marker that changes whenever a task of an activity is added,
// removed or saved (challenges.updated_at is set by a trigger on every
// update). Participants compare it with the one they loaded and reload the
// tasks when it differs, so an edit made during the activity reaches them
// within one status poll.

type TaskStamp = { updated_at: string | null }

export function tasksVersion(tasks: TaskStamp[] | null | undefined): string {
  const list = tasks ?? []
  let latest = ""
  for (const task of list) {
    // ISO timestamps from PostgREST share one format, so text order is time order.
    if (task.updated_at && task.updated_at > latest) latest = task.updated_at
  }
  return `${list.length}:${latest}`
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
