import Anthropic from "@anthropic-ai/sdk"

let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (_client) return _client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY missing")
  _client = new Anthropic({ apiKey, maxRetries: 2 })
  return _client
}

// Model selection — see Anthropic docs for latest IDs.
// deepGenerate: highest quality, used for inspectable pedagogical content
//               (lesson plans the Ministry will review). Opus 4.7 — quality > cost.
// generate:     balanced for routine generation (challenges, suggestions, import).
// verify:       cheap, fast verification step.
// fallback:     previous-gen stable Sonnet used if the primary model rejects
//               (model_not_found, tier issues, transient errors).
export const MODELS = {
  deepGenerate: "claude-opus-4-7",
  generate: "claude-sonnet-4-6",
  verify: "claude-haiku-4-5-20251001",
  fallback: "claude-sonnet-4-5-20250929",
} as const

// Build a system block with prompt caching enabled.
// Caches the system prompt for up to 5 minutes — subsequent calls within that
// window pay ~10% of the input token cost for the cached portion.
// NOTE: Opus 4.7 requires 4096+ tokens for caching; Sonnet 4.6 needs 1024+.
//       Smaller prompts simply don't get cached (no error).
export function cachedSystem(text: string): Anthropic.Messages.TextBlockParam[] {
  return [
    {
      type: "text",
      text,
      cache_control: { type: "ephemeral" },
    },
  ]
}

// Run an Anthropic call with automatic fallback to a previous-gen model if the
// primary model errors with model_not_found / tier / overload. Other errors
// (rate limit, schema, etc.) propagate so the caller sees them.
export async function createWithFallback(
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
): Promise<Anthropic.Messages.Message> {
  const anthropic = getAnthropicClient()
  try {
    return await anthropic.messages.create(params)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Only fall back if the primary model itself is the problem; other errors
    // (rate limit, auth, validation) should surface unchanged.
    if (
      params.model !== MODELS.fallback &&
      (msg.includes("model_not_found") ||
        msg.includes("not_found_error") ||
        msg.includes("404") ||
        msg.includes("model:"))
    ) {
      console.warn(`Model ${params.model} unavailable, falling back to ${MODELS.fallback}`)
      return await anthropic.messages.create({ ...params, model: MODELS.fallback })
    }
    throw err
  }
}
