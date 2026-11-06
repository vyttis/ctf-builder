import type Anthropic from "@anthropic-ai/sdk"
import { buildVerificationSystemPrompt, buildVerificationUserMessage } from "@/lib/ai/verify-prompt"
import { validateDeterministic } from "@/lib/ai/deterministic-validator"
import { verificationResultSchema } from "@/lib/ai/schemas"
import type { AiSuggestion, VerificationResult } from "@/lib/ai/types"
import { MODELS, cachedSystem } from "@/lib/ai/client"
import { parseAiJson } from "@/lib/ai/rate-limit"

/**
 * Asks the verification model whether a task's answer, wording and hints
 * hold up. Never throws: a failed or unreadable check is "uncertain", so the
 * task is flagged for the facilitator instead of passing silently.
 */
export async function verifyWithModel(anthropic: Anthropic, suggestion: AiSuggestion): Promise<VerificationResult> {
  try {
    const message = await anthropic.messages.create({
      model: MODELS.verify,
      max_tokens: 1024,
      system: cachedSystem(buildVerificationSystemPrompt()),
      messages: [{ role: "user", content: buildVerificationUserMessage(suggestion) }],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      return { verdict: "uncertain", issues: ["Patikros atsakymas negautas"], confidence: 0 }
    }

    const validated = verificationResultSchema.safeParse(parseAiJson(textBlock.text))
    if (!validated.success) {
      return { verdict: "uncertain", issues: ["Netikėtas patikros formatas"], confidence: 0 }
    }
    return validated.data
  } catch {
    return { verdict: "uncertain", issues: ["Patikra nepavyko"], confidence: 0 }
  }
}

/** Rule-based checks first (free and exact where they apply), then the model. */
export async function verifySuggestion(anthropic: Anthropic, suggestion: AiSuggestion): Promise<VerificationResult> {
  const deterministicResult = validateDeterministic(suggestion)
  if (deterministicResult !== null) return deterministicResult
  return verifyWithModel(anthropic, suggestion)
}
