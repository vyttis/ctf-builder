import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { buildLessonSystemPrompt, buildLessonUserMessage } from "@/lib/ai/lesson-prompt"
import { lessonGenerateRequestSchema, generatedLessonSchema } from "@/lib/ai/lesson-schema"
import { validateDeterministic } from "@/lib/ai/deterministic-validator"
import type { AiSuggestion } from "@/lib/ai/types"
import type { ChallengeType } from "@/types/game"
import { MODELS, cachedSystem } from "@/lib/ai/client"
import { createWithSchemaRetry } from "@/lib/ai/retry"
import { checkAiRateLimitAsync } from "@/lib/ai/rate-limit"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
    }

    if (!(await checkAiRateLimitAsync("lessons-generate", user.id, 5))) {
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

    const lesson = await createWithSchemaRetry(
      {
        model: MODELS.generate,
        max_tokens: 8192,
        system: cachedSystem(buildLessonSystemPrompt()),
        messages: [{ role: "user", content: buildLessonUserMessage(parsed.data) }],
      },
      generatedLessonSchema,
      { logPrefix: "lessons-generate", maxRetries: 1 },
    )
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
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error("Lesson generate error:", errMsg, error)
    const friendly = errMsg.includes("model")
      ? `DI modelis neprieinamas: ${errMsg}`
      : errMsg.includes("rate") || errMsg.includes("429")
        ? "DI paslauga šiuo metu perkrauta. Bandykite po minutės."
        : errMsg.includes("overloaded") || errMsg.includes("529")
          ? "DI paslauga laikinai perkrauta. Bandykite po minutės."
          : `Pamokos generavimas nepavyko: ${errMsg}`
    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}

export const maxDuration = 60
