import { createClient } from "@/lib/supabase/server"
import { checkAiAllowance, enterAiContext } from "@/lib/ai/usage"
import { friendlyAiError } from "@/lib/ai/error-message"
import { NextResponse } from "next/server"
import { z } from "zod"
import { buildSystemPrompt, buildUserMessage } from "@/lib/ai/prompt"
import { aiSuggestResponseSchema } from "@/lib/ai/schemas"
import { getAnthropicClient, MODELS, cachedSystem } from "@/lib/ai/client"
import { createWithSchemaRetry } from "@/lib/ai/retry"
import { checkAiRateLimitAsync } from "@/lib/ai/rate-limit"
import { verifySuggestion } from "@/lib/ai/verify-suggestion"

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


export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  if (!(await checkAiRateLimitAsync("di-generate", user.id, 10))) {
    return NextResponse.json(
      { error: "Per daug užklausų. Palaukite minutę." },
      { status: 429 }
    )
  }
  // Monthly DI limits (personal and platform budget); every model call
  // from here on is recorded for this action.
  const allowance = await checkAiAllowance(user.id, "di/generate")
  if (!allowance.ok) {
    return NextResponse.json({ error: allowance.message, code: allowance.code }, { status: 429 })
  }
  enterAiContext(allowance.ctx)

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
    return NextResponse.json({ error: "Veikla nerasta" }, { status: 404 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "DI paslauga nepasiekiama. Susisiekite su administratoriumi." },
      { status: 503 }
    )
  }

  try {
    const anthropic = getAnthropicClient()

    // Step 1: Generate suggestions (with schema retry — re-prompts the model
    // if the output doesn't fit aiSuggestResponseSchema)
    const generatedResponse = await createWithSchemaRetry(
      {
        model: MODELS.generate,
        max_tokens: 4096,
        system: cachedSystem(buildSystemPrompt()),
        messages: [{ role: "user", content: buildUserMessage(parsed.data, parsed.data.scenario) }],
      },
      aiSuggestResponseSchema,
      { logPrefix: "di-generate", maxRetries: 1 },
    )

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

    // Fixed Lithuanian messages only — raw SDK errors (English) end up
    // rendered verbatim in the teacher UI. Details stay in the server log.
    const friendly = friendlyAiError(error, "DI užduočių generavimas nepavyko. Bandykite dar kartą.")

    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}

// Allow up to 60s for generation + parallel verification
export const maxDuration = 60
