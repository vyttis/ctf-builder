import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { buildLessonSystemPrompt, buildLessonUserMessage } from "@/lib/ai/lesson-prompt"
import { lessonGenerateRequestSchema, generatedLessonSchema } from "@/lib/ai/lesson-schema"
import { validateDeterministic } from "@/lib/ai/deterministic-validator"
import type { AiSuggestion } from "@/lib/ai/types"
import type { ChallengeType } from "@/types/game"

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
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

export async function POST(request: Request) {
  try {
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

    const parsed = lessonGenerateRequestSchema.safeParse(body)
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

    const anthropic = new Anthropic({ apiKey })

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: buildLessonSystemPrompt(),
      messages: [{ role: "user", content: buildLessonUserMessage(parsed.data) }],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from AI")
    }

    let jsonText = textBlock.text.trim()
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
    }

    const rawLesson = JSON.parse(jsonText)
    const validated = generatedLessonSchema.safeParse(rawLesson)
    if (!validated.success) {
      console.error("Lesson validation error:", validated.error.message)
      throw new Error("Invalid lesson structure from AI")
    }

    // Run deterministic validation on activities where possible
    const lesson = validated.data
    const activitiesWithVerification = lesson.activities.map((activity) => {
      const suggestion: AiSuggestion = {
        title: activity.title,
        description: activity.description,
        type: activity.type as ChallengeType,
        points: activity.points,
        correct_answer: activity.correct_answer,
        hints: activity.hints,
        options: activity.options,
        explanation: activity.explanation,
        difficulty: activity.difficulty,
      }
      const verification = validateDeterministic(suggestion)
      return {
        ...activity,
        verification: verification ?? undefined,
      }
    })

    return NextResponse.json({
      lesson: {
        ...lesson,
        activities: activitiesWithVerification,
      },
    })
  } catch (error) {
    console.error("Lesson generate error:", error)
    return NextResponse.json(
      { error: "Pamokos generavimas nepavyko. Bandykite dar kartą." },
      { status: 500 }
    )
  }
}
