import { createClient } from "@/lib/supabase/server"
import { checkAiAllowance, enterAiContext } from "@/lib/ai/usage"
import { friendlyAiError } from "@/lib/ai/error-message"
import { NextResponse } from "next/server"
import { z } from "zod"
import { buildGameSystemPrompt, buildGameUserMessage } from "@/lib/ai/prompt"
import { aiGameSuggestResponseSchema } from "@/lib/ai/schemas"
import { MODELS, cachedSystem } from "@/lib/ai/client"
import { createWithSchemaRetry } from "@/lib/ai/retry"
import { checkAiRateLimitAsync } from "@/lib/ai/rate-limit"

const suggestGameSchema = z.object({
  teacher_prompt: z.string().max(500).optional(),
  theme: z.string().max(100).optional(),
  count: z.number().min(1).max(5).default(3),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  if (!(await checkAiRateLimitAsync("suggest-game", user.id, 10))) {
    return NextResponse.json(
      { error: "Per daug užklausų. Palaukite minutę." },
      { status: 429 }
    )
  }
  // Monthly DI limits (personal and platform budget); every model call
  // from here on is recorded for this action.
  const allowance = await checkAiAllowance(user.id, "ai/suggest-game")
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

  const parsed = suggestGameSchema.safeParse(body)
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message || "Neteisingi duomenys"
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "DI paslauga nepasiekiama. Susisiekite su administratoriumi." },
      { status: 503 }
    )
  }

  try {
    const data = await createWithSchemaRetry(
      {
        model: MODELS.generate,
        max_tokens: 2048,
        system: cachedSystem(buildGameSystemPrompt()),
        messages: [{ role: "user", content: buildGameUserMessage(parsed.data) }],
      },
      aiGameSuggestResponseSchema,
      { logPrefix: "ai-suggest-game", maxRetries: 1 },
    )

    return NextResponse.json(data)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error("AI suggest-game error:", errMsg, error)
    const friendly = friendlyAiError(error, "DI pasiūlymo generavimas nepavyko. Bandykite dar kartą.")
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}

export const maxDuration = 30
