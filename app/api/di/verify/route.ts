import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import {
  buildVerificationSystemPrompt,
  buildVerificationUserMessage,
} from "@/lib/ai/verify-prompt"
import { validateDeterministic } from "@/lib/ai/deterministic-validator"
import { verificationResultSchema } from "@/lib/ai/schemas"
import type { AiSuggestion } from "@/lib/ai/types"
import { getAnthropicClient, MODELS, cachedSystem } from "@/lib/ai/client"
import { checkAiRateLimit, parseAiJson } from "@/lib/ai/rate-limit"

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

  if (!checkAiRateLimit("di-verify", user.id, 30)) {
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

  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Neteisingi duomenys" },
      { status: 400 }
    )
  }

  if (!process.env.ANTHROPIC_API_KEY) {
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

  // LLM verification (cheap haiku model)
  try {
    const anthropic = getAnthropicClient()
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
      throw new Error("No verification response")
    }

    const rawResult = parseAiJson(textBlock.text)
    const validated = verificationResultSchema.safeParse(rawResult)
    if (!validated.success) {
      return NextResponse.json(
        { verdict: "uncertain", issues: ["Netikėtas patikros formatas"], confidence: 0 },
        { status: 200 }
      )
    }
    return NextResponse.json(validated.data)
  } catch (error) {
    console.error("DI verify error:", error)
    return NextResponse.json(
      { verdict: "uncertain", issues: ["Patikra nepavyko"], confidence: 0 },
      { status: 200 }
    )
  }
}
