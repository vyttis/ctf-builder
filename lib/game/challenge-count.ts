/**
 * challenges and submissions have column-level grants only (migration
 * 20261106120000 hides answer_hash and answer), and PostgREST rejects a
 * `challenges(count)` embed for such a table with "permission denied"
 * (the same happened to teams in 00022). Queries embed the granted `id`
 * column instead, and this keeps the `[{ count }]` shape the UI reads.
 */
export function withChallengeCount<T extends { challenges?: { id: string }[] | null }>(
  row: T,
): Omit<T, "challenges"> & { challenges: { count: number }[] } {
  const { challenges, ...rest } = row
  return { ...rest, challenges: [{ count: challenges?.length ?? 0 }] }
}
