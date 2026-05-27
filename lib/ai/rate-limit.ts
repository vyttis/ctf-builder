// Simple in-memory rate limiter for AI endpoints.
// NOTE: Resets on every server restart and is per-instance — for production
// serverless deployments, migrate to Upstash/Vercel KV or a Postgres-backed counter.
// Keyed by `${endpoint}:${userId}` to keep limits independent per endpoint.

type Entry = { count: number; resetAt: number }
const map = new Map<string, Entry>()

export function checkAiRateLimit(
  endpoint: string,
  userId: string,
  limit = 10,
  windowMs = 60_000,
): boolean {
  const key = `${endpoint}:${userId}`
  const now = Date.now()
  const entry = map.get(key)
  if (!entry || now > entry.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

// Strip ```json fences and parse safely.
export function parseAiJson<T = unknown>(text: string): T {
  let jsonText = text.trim()
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
  }
  // Be lenient: if the model wraps the JSON in prose, extract the first {...} or [...] block.
  if (!jsonText.startsWith("{") && !jsonText.startsWith("[")) {
    const objStart = jsonText.indexOf("{")
    const arrStart = jsonText.indexOf("[")
    const start =
      objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart)
    if (start > -1) {
      jsonText = jsonText.slice(start)
      // Try to trim trailing prose after final } or ]
      const lastObj = jsonText.lastIndexOf("}")
      const lastArr = jsonText.lastIndexOf("]")
      const end = Math.max(lastObj, lastArr)
      if (end > -1) jsonText = jsonText.slice(0, end + 1)
    }
  }
  return JSON.parse(jsonText) as T
}
