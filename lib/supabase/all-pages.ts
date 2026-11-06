/** The part of a PostgREST query builder that keyset paging needs. */
interface KeysetQuery {
  order(column: string, options: { ascending: boolean }): KeysetQuery
  gt(column: string, value: string): KeysetQuery
  limit(count: number): PromiseLike<{ data: unknown; error: unknown }>
}

/** More rows than any session should have: stop and say so instead of reading on. */
export const MAX_ROWS = 200_000

/**
 * Reads every row of a query, a page at a time, in id order (keyset paging):
 * each page asks for the ids after the last one seen. PostgREST returns at
 * most max_rows (1000) rows per request, so a single select silently drops
 * the rest, and offset paging repeats or skips rows when answers arrive
 * while it reads. A row added during the read is either included or comes
 * later through realtime; no row is read twice or skipped.
 *
 * The query must not set its own order: callers sort in memory. A failed
 * page fails the whole read (no partial rows), and so does a result larger
 * than MAX_ROWS.
 */
export async function allRowsById<T extends { id: string }>(
  build: () => unknown,
  pageSize = 1000,
): Promise<{ data: T[]; error: null } | { data: null; error: unknown }> {
  const rows: T[] = []
  let after: string | null = null
  for (;;) {
    let query = (build() as KeysetQuery).order("id", { ascending: true })
    if (after !== null) query = query.gt("id", after)
    const { data, error } = await query.limit(pageSize)
    if (error) return { data: null, error }
    const batch = (data ?? []) as T[]
    rows.push(...batch)
    if (rows.length > MAX_ROWS) {
      return { data: null, error: new Error(`more than ${MAX_ROWS} rows`) }
    }
    if (batch.length < pageSize) return { data: rows, error: null }
    after = batch[batch.length - 1].id
  }
}
