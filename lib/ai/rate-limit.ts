// Rate limiter for AI and high-traffic endpoints.
//
// Backed by Vercel KV when KV_REST_API_URL is configured (recommended for
// production serverless), falls back to an in-memory Map otherwise. The
// in-memory path is per-instance — fine for single-node dev, not safe at
// classroom scale (30 students hitting different Vercel instances can each
// burn the full budget).

import { jsonrepair } from "jsonrepair"
import { incrAtomic } from "./kv-rate-limit"

type Entry = { count: number; resetAt: number }
const map = new Map<string, Entry>()

// Synchronous wrapper kept for backwards compatibility with existing call
// sites. Uses the in-memory map only; new call sites prefer
// `checkAiRateLimitAsync` which goes through KV.
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
 * Cross-instance rate limiter. Tries Vercel KV first (atomic INCR + EXPIRE),
 * falls back to the per-instance Map if KV is unavailable.
 *
 * Returns `true` if the request is allowed, `false` if the limit is exceeded.
 */
export async function checkAiRateLimitAsync(
  endpoint: string,
  userId: string,
  limit = 10,
  windowMs = 60_000,
): Promise<boolean> {
  const key = `rl:${endpoint}:${userId}`
  const kvResult = await incrAtomic(key, windowMs)
  if (kvResult !== null) {
    return kvResult <= limit
  }
  return checkAiRateLimit(endpoint, userId, limit, windowMs)
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
  } catch (strictErr) {
    // The model sometimes closes the JSON and keeps writing (a closing
    // fence and a Markdown explanation). Take the first complete block.
    const block = firstJsonBlock(jsonText)
    if (block && block !== jsonText) {
      try {
        return JSON.parse(block) as T
      } catch {
        // fall through to the repair pass
      }
    }
    // Repair pass — handles trailing commas, missing quotes, unclosed strings,
    // smart quotes, comments, etc. that LLMs occasionally emit.
    try {
      const repaired = jsonrepair(jsonText)
      return JSON.parse(repaired) as T
    } catch (repairErr) {
      // Surface both errors so we can debug what the model emitted.
      console.error("[parseAiJson] strict parse failed:", strictErr instanceof Error ? strictErr.message : strictErr)
      console.error("[parseAiJson] repair failed:", repairErr instanceof Error ? repairErr.message : repairErr)
      console.error("[parseAiJson] raw input (truncated to 500 chars):", jsonText.slice(0, 500))
      throw new Error(
        `JSON parse failed: ${strictErr instanceof Error ? strictErr.message : String(strictErr)}`,
      )
    }
  }
}

/**
 * The first complete JSON object or array in the text, found by matching
 * brackets outside strings. Null when there is none.
 */
export function firstJsonBlock(text: string): string | null {
  const start = text.search(/[[{]/)
  if (start === -1) return null
  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < text.length; i++) {
    const ch = text[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === "\\") escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === "{" || ch === "[") depth++
    else if (ch === "}" || ch === "]") {
      depth--
      if (depth === 0) return text.slice(start, i + 1)
    }
  }
  return null
}
