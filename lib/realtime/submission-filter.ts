/**
 * Realtime filter for one activity's answers (FAC-10).
 *
 * `submissions` has no game_id, and active activities' answers are readable
 * by every signed-in user, so an unfiltered subscription delivers every
 * answer on the platform to every facilitator screen, and each one costs
 * the browser a lookup. Realtime can filter by `challenge_id=in.(…)`; the
 * activity's task ids are known, so the server sends only this activity's
 * answers. Realtime caps an `in` list at 100 values; past that (or with no
 * ids) the caller subscribes unfiltered and keeps its own membership check.
 */

export const MAX_IN_FILTER_VALUES = 100

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** `challenge_id=in.(…)` for these task ids, or null when it cannot be used. */
export function submissionFilter(challengeIds: readonly string[]): string | null {
  const ids = [...new Set(challengeIds)].sort()
  if (ids.length === 0 || ids.length > MAX_IN_FILTER_VALUES) return null
  // Ids go into the filter text: anything but a plain uuid disables it.
  if (!ids.every((id) => UUID.test(id))) return null
  return `challenge_id=in.(${ids.join(",")})`
}
