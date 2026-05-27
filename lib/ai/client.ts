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
// deepGenerate: highest quality, used for long pedagogical content (lesson plans)
// generate:     balanced cost/quality for routine generation (challenges, suggestions, import)
// verify:       cheap, fast verification step
export const MODELS = {
  deepGenerate: "claude-opus-4-7",
  generate: "claude-sonnet-4-6",
  verify: "claude-haiku-4-5-20251001",
} as const

// Build a system block with prompt caching enabled.
// Caches the system prompt for up to 5 minutes — subsequent calls within that
// window pay ~10% of the input token cost for the cached portion.
export function cachedSystem(text: string): Anthropic.Messages.TextBlockParam[] {
  return [
    {
      type: "text",
      text,
      cache_control: { type: "ephemeral" },
    },
  ]
}
