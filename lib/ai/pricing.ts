/**
 * Claude API prices in USD per million tokens (platform.claude.com pricing,
 * checked 2026-11-06). Used to record what each DI call cost, so the monthly
 * budget can stop spending before the invoice does.
 */
interface Price {
  input: number
  output: number
  cacheWrite: number
  cacheRead: number
}

const OPUS: Price = { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 }
const SONNET: Price = { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 }
const HAIKU: Price = { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 }

/** Unknown models are priced as Opus: a budget should overestimate. */
export function priceFor(model: string): Price {
  if (model.startsWith("claude-haiku-")) return HAIKU
  if (model.startsWith("claude-sonnet-")) return SONNET
  return OPUS
}

export interface TokenUsage {
  input_tokens?: number | null
  output_tokens?: number | null
  cache_creation_input_tokens?: number | null
  cache_read_input_tokens?: number | null
}

export function costUsd(model: string, usage: TokenUsage): number {
  const p = priceFor(model)
  const cost =
    (usage.input_tokens ?? 0) * p.input +
    (usage.output_tokens ?? 0) * p.output +
    (usage.cache_creation_input_tokens ?? 0) * p.cacheWrite +
    (usage.cache_read_input_tokens ?? 0) * p.cacheRead
  return Math.round(cost / 10) / 100000 // USD with 5 decimals (cost is in µUSD here)
}
