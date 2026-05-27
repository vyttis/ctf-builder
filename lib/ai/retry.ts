import type Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import { createWithFallback } from "./client"
import { parseAiJson } from "./rate-limit"

/**
 * Run an Anthropic generate call and validate the JSON output against a zod
 * schema. If validation fails, retry once with a clarification message that
 * tells the model exactly what was wrong.
 *
 * This catches the most common AI failure mode: model returns slightly off
 * structure (wrong field name, missing required field, extra commentary) and
 * a generic error would otherwise be shown to the user.
 */
export async function createWithSchemaRetry<T>(
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
  schema: z.ZodType<T>,
  options: { maxRetries?: number; logPrefix?: string } = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 1
  const logPrefix = options.logPrefix ?? "AI"

  let lastValidationError: string | null = null
  let messages: Anthropic.Messages.MessageParam[] = [...(params.messages || [])]

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0 && lastValidationError) {
      // Add a clarification turn so the model can self-correct.
      messages = [
        ...messages,
        {
          role: "assistant",
          content: "(previous response had a schema error)",
        },
        {
          role: "user",
          content: `Tavo ankstesnis atsakymas turi struktūros klaidą:\n${lastValidationError}\n\nPateik tą patį atsakymą TAISYKLINGU JSON formatu. Tik JSON, jokio paaiškinimo aplink.`,
        },
      ]
    }

    const message = await createWithFallback({ ...params, messages })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      lastValidationError = "Model returned no text block"
      continue
    }

    let rawParsed: unknown
    try {
      rawParsed = parseAiJson(textBlock.text)
    } catch (e) {
      lastValidationError = `JSON.parse failed: ${e instanceof Error ? e.message : String(e)}. Output started with: ${textBlock.text.slice(0, 200)}`
      console.warn(`${logPrefix} schema retry ${attempt + 1}/${maxRetries + 1}: ${lastValidationError}`)
      continue
    }

    const validated = schema.safeParse(rawParsed)
    if (validated.success) {
      return validated.data
    }

    lastValidationError = validated.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n")
    console.warn(`${logPrefix} schema retry ${attempt + 1}/${maxRetries + 1}:\n${lastValidationError}`)
  }

  throw new Error(`AI atsakymas neatitinka schemos po ${maxRetries + 1} bandymų:\n${lastValidationError}`)
}
