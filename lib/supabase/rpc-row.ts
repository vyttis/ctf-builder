/**
 * The single row of an RPC that returns a table type. PostgREST may send
 * it as an object or as a one-element array, depending on the function and
 * the request; callers read it the same way either way.
 */
export function rpcRow<T>(data: unknown): T | null {
  if (Array.isArray(data)) return (data[0] as T | undefined) ?? null
  return (data as T | null) ?? null
}
