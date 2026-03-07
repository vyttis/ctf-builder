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
})

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10
const RATE_WINDOW = 60_000

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

async function verifySuggestion(
  anthropic: Anthropic,
  suggestion: AiSuggestion
): Promise<VerificationResult> {
  // Step 1: Try deterministic validation first
  const deterministicResult = validateDeterministic(suggestion)
  if (deterministicResult !== null) {
    return deterministicResult
  }

  // Step 2: Fall back to LLM verification
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: buildVerificationSystemPrompt(),
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

    let jsonText = textBlock.text.trim()
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
    }

    const rawParsed = JSON.parse(jsonText)
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

  if (!checkRateLimit(user.id)) {
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

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "DI paslauga nepasiekiama. Susisiekite su administratoriumi." },
      { status: 503 }
    )
  }

  try {
    const anthropic = new Anthropic({ apiKey })

    // Step 1: Generate suggestions
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: buildUserMessage(parsed.data) }],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from DI")
    }

    let jsonText = textBlock.text.trim()
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
    }

    const rawGenerated = JSON.parse(jsonText)
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
    console.error("DI generate error:", error)
    return NextResponse.json(
      { error: "DI užduočių generavimas nepavyko. Bandykite dar kartą." },
      { status: 500 }
    )
  }
}
