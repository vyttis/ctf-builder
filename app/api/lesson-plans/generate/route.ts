import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { buildLessonPlanSystemPrompt, buildLessonPlanUserMessage } from "@/lib/ai/lesson-plan-prompt"
import { z } from "zod"

// Rate limiter
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

const requestSchema = z.object({
  subject: z.string().min(1),
  grade: z.number().min(1).max(12),
  topic: z.string().min(1).max(500),
  lesson_type: z.enum(["nauja_tema", "kartojimas", "vertinimas", "projektine_veikla"]),
  duration: z.number().min(25).max(90),
  learning_goal: z.string().max(500).optional(),
  curriculum_context: z.string().max(2000).optional(),
})

const stageSchema = z.object({
  activity_type: z.enum(["intro", "challenge", "discussion", "reflection"]),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["text", "number", "multiple_choice"]),
  correct_answer: z.coerce.string().min(1),
  options: z.array(z.string()).nullable().default(null),
  hints: z.array(z.string()).default([]),
  explanation: z.string().default(""),
  points: z.number().min(10).max(500).default(100),
  duration_minutes: z.number().min(1).max(45).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
})

const lessonPlanResponseSchema = z.object({
  title: z.string().min(1),
  goal: z.string().min(1),
  curriculum_link: z.string().default(""),
  stages: z.array(stageSchema).min(1),
  reflection_prompt: z.string().default(""),
  teacher_methodical_note: z.string().default(""),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
      return NextResponse.json({ error: "Netinkamas formatas" }, { status: 400 })
    }

    const parsed = requestSchema.safeParse(body)
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

    const anthropic = new Anthropic({ apiKey })

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: buildLessonPlanSystemPrompt(),
      messages: [{ role: "user", content: buildLessonPlanUserMessage(parsed.data) }],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from AI")
    }

    let jsonText = textBlock.text.trim()
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    }

    const rawLesson = JSON.parse(jsonText)
    const validated = lessonPlanResponseSchema.safeParse(rawLesson)
    if (!validated.success) {
      console.error("Lesson plan validation error:", validated.error.message)
      throw new Error("Invalid lesson plan structure from AI")
    }

    return NextResponse.json({ lesson_plan: validated.data })
  } catch (error) {
    console.error("Lesson plan generate error:", error)
    return NextResponse.json(
      { error: "Pamokos plano generavimas nepavyko. Bandykite dar kartą." },
      { status: 500 }
    )
  }
}
