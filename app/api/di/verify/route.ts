import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import Anthropic from "@anthropic-ai/sdk"
import {
  buildVerificationSystemPrompt,
  buildVerificationUserMessage,
} from "@/lib/ai/verify-prompt"
import { validateDeterministic } from "@/lib/ai/deterministic-validator"
import type { AiSuggestion, VerificationResult } from "@/lib/ai/types"

const verifySchema = z.object({
  suggestion: z.object({
    title: z.string(),
    description: z.string(),
    type: z.enum(["text", "number", "multiple_choice"]),
    points: z.number(),
    correct_answer: z.string(),
    hints: z.array(z.string()),
    options: z.array(z.string()).nullable(),
  }),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
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

  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Neteisingi duomenys" },
      { status: 400 }
    )
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "DI paslauga nepasiekiama." },
      { status: 503 }
    )
  }

  const suggestion = parsed.data.suggestion as AiSuggestion

  // Try deterministic first
  const deterministicResult = validateDeterministic(suggestion)
  if (deterministicResult !== null) {
    return NextResponse.json(deterministicResult)
  }

  // LLM verification
  try {
    const anthropic = new Anthropic({ apiKey })
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
      throw new Error("No verification response")
    }

    let jsonText = textBlock.text.trim()
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
    }

    const result: VerificationResult = JSON.parse(jsonText)
    return NextResponse.json({
      verdict: result.verdict,
      issues: Array.isArray(result.issues) ? result.issues : [],
      confidence:
        typeof result.confidence === "number" ? result.confidence : 0.5,
    })
  } catch (error) {
    console.error("DI verify error:", error)
    return NextResponse.json(
      { verdict: "uncertain", issues: ["Patikra nepavyko"], confidence: 0 },
      { status: 200 }
    )
  }
}
