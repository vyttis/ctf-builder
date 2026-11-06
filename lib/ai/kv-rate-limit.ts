/**
 * Upstash Redis atomic counter helper for rate limiting (the store that
 * replaced Vercel KV; it keeps the KV_REST_API_* variable names).
 *
 * Returns the new counter value after this request, or `null` if KV is not
 * configured (env vars missing or import fails). Callers should fall back to
 * an in-memory limiter when this returns `null`.
 *
 * On the first request inside a window we set EX (TTL) so the counter
 * resets cleanly. Subsequent requests just INCR — atomic across Vercel
 * function instances, which is the whole reason this exists.
 */

type KvClient = {
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<unknown>
}

let cachedClient: KvClient | null | undefined
// After a failed call the store is skipped for a while, so an unreachable
// store costs one quick failure per instance, not one per request.
const SKIP_AFTER_FAILURE_MS = 5 * 60_000
let skipUntil = 0

async function getKv(): Promise<KvClient | null> {
  if (Date.now() < skipUntil) return null
  if (cachedClient !== undefined) return cachedClient
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    cachedClient = null
    return null
  }
  try {
    const { Redis } = await import("@upstash/redis")
    cachedClient = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
      // A rate limit must never slow the request it guards. The default
      // retries back off for ~4.5 s when the store is unreachable, which made
      // every team join take ~5 s. One attempt, cut off after 1.5 s.
      retry: false,
      signal: () => AbortSignal.timeout(1500),
    }) as unknown as KvClient
    return cachedClient
  } catch (err) {
    console.warn("[rate-limit] Redis client init failed, falling back:", err)
    cachedClient = null
    return null
  }
}

export async function incrAtomic(
  key: string,
  windowMs: number,
): Promise<number | null> {
  const kv = await getKv()
  if (!kv) return null

  try {
    const next = await kv.incr(key)
    if (next === 1) {
      // First request in this window — set the expiry. Round up to the
      // nearest second so we don't over-truncate.
      const ttlSec = Math.max(1, Math.ceil(windowMs / 1000))
      await kv.expire(key, ttlSec)
    }
    return next
  } catch (err) {
    skipUntil = Date.now() + SKIP_AFTER_FAILURE_MS
    console.warn("[rate-limit] KV INCR failed, using in-memory limits for 5 min:", err)
    return null
  }
}
