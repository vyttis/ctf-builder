// Simple in-memory rate limiter for AI endpoints.
// NOTE: Resets on every server restart and is per-instance — for production
// serverless deployments, migrate to Upstash/Vercel KV or a Postgres-backed counter.
// Keyed by `${endpoint}:${userId}` to keep limits independent per endpoint.

import { jsonrepair } from "jsonrepair"

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

/**
 * Parse JSON from an LLM response, tolerating common failure modes:
 * - Markdown code fences (```json ... ```)
 * - Surrounding prose ("Here is the JSON: { ... } Hope this helps!")
 * - Mid-string escape glitches, trailing commas, unquoted keys —
 *   handled by jsonrepair as a second pass when the strict parse fails.
 *
 * Throws only if both passes fail.
 */
export function parseAiJson<T = unknown>(text: string): T {
  let jsonText = text.trim()

  // Strip markdown fences
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
  }

  // Extract the first {...} or [...] block if wrapped in prose
  if (!jsonText.startsWith("{") && !jsonText.startsWith("[")) {
    const objStart = jsonText.indexOf("{")
    const arrStart = jsonText.indexOf("[")
    const start =
      objStart === -1 ? arrStart : arrStart === -1 ? objStart : Math.min(objStart, arrStart)
    if (start > -1) {
      jsonText = jsonText.slice(start)
      const lastObj = jsonText.lastIndexOf("}")
      const lastArr = jsonText.lastIndexOf("]")
      const end = Math.max(lastObj, lastArr)
      if (end > -1) jsonText = jsonText.slice(0, end + 1)
    }
  }

  // Strict parse first — fast path
  try {
    return JSON.parse(jsonText) as T
  } catch {
    // Repair pass — handles trailing commas, missing quotes, unclosed strings,
    // smart quotes, comments, etc. that LLMs occasionally emit.
    const repaired = jsonrepair(jsonText)
    return JSON.parse(repaired) as T
  }
}
