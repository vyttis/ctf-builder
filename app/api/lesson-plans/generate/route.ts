import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { buildLessonPlanSystemPrompt, buildLessonPlanUserMessage } from "@/lib/ai/lesson-plan-prompt"
import { getGradesForSubject, getGradesIntersection } from "@/lib/curriculum/subjects"
import { z } from "zod"

// Rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 5
const RATE_WINDOW = 60_000

function checkRateLimit(userId: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW })
    return { allowed: true, retryAfterSec: 0 }
  }
  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) }
  }
  entry.count++
  return { allowed: true, retryAfterSec: 0 }
}

const requestSchema = z.object({
  subject: z.string().min(1),
  secondary_subject: z.string().min(1).nullable().optional(),
  grade: z.number().min(1).max(12),
  topic: z.string().min(1).max(500),
  lesson_type: z.enum(["nauja_tema", "kartojimas", "vertinimas", "projektine_veikla"]),
  duration: z.number().min(25).max(90),
  learning_goal: z.string().max(500).optional(),
  curriculum_context: z.string().max(2000).optional(),
}).refine(
  (d) => !d.secondary_subject || d.secondary_subject !== d.subject,
  { message: "Antrasis dalykas turi skirtis nuo pirmojo", path: ["secondary_subject"] }
)

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

    const rate = checkRateLimit(user.id)
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Pasiektas DI užklausų limitas (${RATE_LIMIT}/min). Palaukite ${rate.retryAfterSec} s ir bandykite vėl.` },
        { status: 429, headers: { "Retry-After": rate.retryAfterSec.toString() } }
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

    const validGrades = parsed.data.secondary_subject
      ? getGradesIntersection(parsed.data.subject, parsed.data.secondary_subject)
      : getGradesForSubject(parsed.data.subject)
    if (validGrades.length === 0) {
      return NextResponse.json(
        { error: "Šie dalykai neturi bendrų klasių. Pasirinkite kitą derinį." },
        { status: 400 }
      )
    }
    if (!validGrades.includes(parsed.data.grade)) {
      return NextResponse.json(
        { error: `Klasė ${parsed.data.grade} netinka šiam dalykų deriniui.` },
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
      messages: [{ role: "user", content: buildLessonPlanUserMessage({
        ...parsed.data,
        secondary_subject: parsed.data.secondary_subject ?? null,
      }) }],
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
