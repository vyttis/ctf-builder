import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { buildSystemPrompt, buildUserMessage } from "@/lib/ai/prompt"
import { aiSuggestResponseSchema } from "@/lib/ai/schemas"
import { MODELS, cachedSystem, createWithFallback } from "@/lib/ai/client"
import { checkAiRateLimit, parseAiJson } from "@/lib/ai/rate-limit"

const suggestSchema = z.object({
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

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  if (!checkAiRateLimit("suggest", user.id, 10)) {
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

  const parsed = suggestSchema.safeParse(body)
  if (!parsed.success) {
    const firstError =
      parsed.error.issues[0]?.message || "Neteisingi duomenys"
    return NextResponse.json({ error: firstError }, { status: 400 })
  }

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
    const message = await createWithFallback({
      model: MODELS.generate,
      max_tokens: 4096,
      system: cachedSystem(buildSystemPrompt()),
      messages: [{ role: "user", content: buildUserMessage(parsed.data) }],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from AI")
    }

    const rawParsed = parseAiJson(textBlock.text)
    const validated = aiSuggestResponseSchema.safeParse(rawParsed)
    if (!validated.success) {
      throw new Error("Invalid AI response structure: " + validated.error.message)
    }

    return NextResponse.json(validated.data)
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error("AI suggest error:", errMsg, error)
    const friendly = errMsg.includes("model")
      ? `DI modelis neprieinamas: ${errMsg}`
      : errMsg.includes("rate") || errMsg.includes("429")
        ? "DI paslauga šiuo metu perkrauta. Bandykite po minutės."
        : errMsg.includes("overloaded") || errMsg.includes("529")
          ? "DI paslauga laikinai perkrauta. Bandykite po minutės."
          : `DI pasiūlymo generavimas nepavyko: ${errMsg}`
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}

export const maxDuration = 30
