import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import Anthropic from "@anthropic-ai/sdk"
import { buildSystemPrompt, buildUserMessage } from "@/lib/ai/prompt"
import {
  buildVerificationSystemPrompt,
  buildVerificationUserMessage,
} from "@/lib/ai/verify-prompt"
import { validateDeterministic } from "@/lib/ai/deterministic-validator"
import {
  aiSuggestResponseSchema,
  verificationResultSchema,
} from "@/lib/ai/schemas"
import type {
  AiSuggestion,
  VerificationResult,
} from "@/lib/ai/types"
import { getAnthropicClient, MODELS, cachedSystem, createWithFallback } from "@/lib/ai/client"
import { checkAiRateLimit, parseAiJson } from "@/lib/ai/rate-limit"

const generateSchema = z.object({
  game_id: z.string().uuid(),
  game_title: z.string().min(1).max(200),
  game_description: z.string().nullable().default(null),
  existing_challenges: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().nullable(),
        type: z.enum(["text", "number", "multiple_choice"]),
        points: z.number(),
      })
    )
    .default([]),
  teacher_prompt: z.string().max(500).optional(),
  count: z.number().min(1).max(5).default(3),
  scenario: z.enum(["quick_check", "investigation", "escape_room", "discussion"]).optional(),
})

async function verifySuggestion(
  anthropic: Anthropic,
  suggestion: AiSuggestion
): Promise<VerificationResult> {
  // Step 1: Try deterministic validation first
  const deterministicResult = validateDeterministic(suggestion)
  if (deterministicResult !== null) {
    return deterministicResult
  }

  // Step 2: Fall back to LLM verification (cheap haiku model)
  try {
    const message = await anthropic.messages.create({
      model: MODELS.verify,
      max_tokens: 1024,
      system: cachedSystem(buildVerificationSystemPrompt()),
      messages: [
        {
          role: "user",
          content: buildVerificationUserMessage(suggestion),
        },
      ],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      return {
        verdict: "uncertain",
        issues: ["Patikros atsakymas negautas"],
        confidence: 0,
      }
    }

    const rawParsed = parseAiJson(textBlock.text)
    const validated = verificationResultSchema.safeParse(rawParsed)
    if (!validated.success) {
      return {
        verdict: "uncertain" as const,
        issues: ["Netikėtas patikros formatas"],
        confidence: 0,
      }
    }

    return validated.data
  } catch {
    return {
      verdict: "uncertain",
      issues: ["Patikra nepavyko"],
      confidence: 0,
    }
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  if (!checkAiRateLimit("di-generate", user.id, 10)) {
    return NextResponse.json(
      { error: "Per daug užklausų. Palaukite minutę." },
      { status: 429 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Netinkamas užklausos formatas" },
      { status: 400 }
    )
  }

  const parsed = generateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Neteisingi duomenys" },
      { status: 400 }
    )
  }

  // Verify game ownership
  const { data: game } = await supabase
    .from("games")
    .select("id")
    .eq("id", parsed.data.game_id)
    .eq("teacher_id", user.id)
    .single()

  if (!game) {
    return NextResponse.json({ error: "Žaidimas nerastas" }, { status: 404 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "DI paslauga nepasiekiama. Susisiekite su administratoriumi." },
      { status: 503 }
    )
  }

  try {
    const anthropic = getAnthropicClient()

    // Step 1: Generate suggestions
    const message = await createWithFallback({
      model: MODELS.generate,
      max_tokens: 4096,
      system: cachedSystem(buildSystemPrompt()),
      messages: [{ role: "user", content: buildUserMessage(parsed.data, parsed.data.scenario) }],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from DI")
    }

    const rawGenerated = parseAiJson(textBlock.text)
    const validatedResponse = aiSuggestResponseSchema.safeParse(rawGenerated)
    if (!validatedResponse.success) {
      throw new Error("Invalid DI response structure: " + validatedResponse.error.message)
    }
    const generatedResponse = validatedResponse.data

    // Step 2: Verify each suggestion in parallel
    const enrichedSuggestions = await Promise.all(
      generatedResponse.suggestions.map(async (suggestion) => {
        const verification = await verifySuggestion(anthropic, suggestion)
        return { ...suggestion, verification }
      })
    )

    return NextResponse.json({ suggestions: enrichedSuggestions })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error("DI generate error:", errMsg, error)

    // Surface the underlying Anthropic / model error so it's debuggable in the UI.
    // (Internal API key isn't in the error message, so this is safe to return.)
    const friendly = errMsg.includes("model")
      ? `DI modelis neprieinamas: ${errMsg}`
      : errMsg.includes("rate") || errMsg.includes("429")
        ? "DI paslauga šiuo metu perkrauta. Bandykite po minutės."
        : errMsg.includes("overloaded") || errMsg.includes("529")
          ? "DI paslauga laikinai perkrauta. Bandykite po minutės."
          : `DI užduočių generavimas nepavyko: ${errMsg}`

    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}

// Allow up to 60s for generation + parallel verification
export const maxDuration = 60
