/**
 * Vercel KV (Redis-compatible) atomic counter helper for rate limiting.
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

async function getKv(): Promise<KvClient | null> {
  if (cachedClient !== undefined) return cachedClient
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    cachedClient = null
    return null
  }
  try {
    const mod = await import("@vercel/kv")
    cachedClient = mod.kv as unknown as KvClient
    return cachedClient
  } catch (err) {
    console.warn("[rate-limit] @vercel/kv import failed, falling back:", err)
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
    console.warn("[rate-limit] KV INCR failed, falling back:", err)
    return null
  }
}
