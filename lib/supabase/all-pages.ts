/**
 * Reads every row of a query in pages of 1000. PostgREST returns at most
 * max_rows (1000) rows per request, so a single select silently drops the
 * rest: a busy session can have more than 1000 answers. The query must have
 * a stable order (add a unique column as the last sort key).
 */
export async function allPages<T>(
  build: () => { range: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }> },
  pageSize = 1000,
  maxPages = 50,
): Promise<{ data: T[]; error: unknown }> {
  const rows: T[] = []
  for (let page = 0; page < maxPages; page++) {
    const from = page * pageSize
    const { data, error } = await build().range(from, from + pageSize - 1)
    if (error) return { data: rows, error }
    const batch = (data ?? []) as T[]
    rows.push(...batch)
    if (batch.length < pageSize) break
  }
  return { data: rows, error: null }
}
