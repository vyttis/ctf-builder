import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { generateGameCode } from "@/lib/game/code-generator"
import { hashAnswer } from "@/lib/game/answer-hasher"
import { checkAiAllowance, enterAiContext } from "@/lib/ai/usage"
import { checkAiRateLimitAsync } from "@/lib/ai/rate-limit"
import { getAnthropicClient } from "@/lib/ai/client"
import { verifyWithModel } from "@/lib/ai/verify-suggestion"
import type { VerificationResult } from "@/lib/ai/types"
import { defaultTaskStageIndexes, reviewTask, stageToTask, type PlanStage } from "@/lib/lesson-plans/convert"

const convertSchema = z.object({
  // Which plan stages become tasks; by default the "challenge" stages.
  stage_indexes: z.array(z.number().int().min(0).max(99)).max(100).optional(),
})

/**
 * POST: a draft activity from a saved lesson plan. Only the chosen stages
 * become scored tasks (by default the task stages, not the introduction,
 * discussion or reflection), the activity has no time limit, and every
 * answer the DI wrote is checked first: a task the check doubts or faults is
 * marked for review; an answer no participant could match is left out for
 * the facilitator to set, which keeps the activity from starting until then.
 */
export async function POST(request: Request, props: { params: Promise<{ planId: string }> }) {
  const { planId } = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })

  if (!(await checkAiRateLimitAsync("lesson-plans-convert", user.id, 10))) {
    return NextResponse.json({ error: "Per daug užklausų. Palaukite minutę." }, { status: 429 })
  }

  // An empty body means "the default stages"; anything else must be a valid
  // selection, so a cut-off request never creates tasks nobody chose.
  const raw = await request.text()
  let body: unknown = {}
  if (raw.trim()) {
    try {
      body = JSON.parse(raw)
    } catch {
      body = null
    }
  }
  const parsed = convertSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Neteisingi duomenys" }, { status: 400 })

  const { data: plan } = await supabase
    .from("lesson_plans")
    .select("id, title, topic, stages")
    .eq("id", planId)
    .eq("teacher_id", user.id)
    .maybeSingle()
  if (!plan) return NextResponse.json({ error: "Pamokos planas nerastas" }, { status: 404 })

  const stages = (Array.isArray(plan.stages) ? plan.stages : []) as PlanStage[]
  const chosen = parsed.data.stage_indexes
    ? [...new Set(parsed.data.stage_indexes)].sort((a, b) => a - b)
    : defaultTaskStageIndexes(stages)
  if (chosen.some((i) => i >= stages.length)) {
    return NextResponse.json({ error: "Plane tokio etapo nėra. Atnaujinkite puslapį." }, { status: 400 })
  }
  if (chosen.length === 0) {
    return NextResponse.json(
      {
        error: "Pažymėkite bent vieną etapą, kuris taps užduotimi.",
        code: "no_tasks",
      },
      { status: 400 }
    )
  }

  const tasks = chosen.map((i) => stageToTask(stages[i]))

  // One DI check per task that has a usable answer, in parallel, counted as
  // one DI action. Without DI (no key, limit reached) the tasks are still
  // created and marked for review.
  const checkable = tasks.filter((t) => t.answer !== null)
  let verifications: (VerificationResult | null)[] = tasks.map(() => null)
  if (checkable.length > 0 && process.env.ANTHROPIC_API_KEY) {
    const allowance = await checkAiAllowance(user.id, "lesson-plans/convert")
    if (allowance.ok) {
      enterAiContext(allowance.ctx)
      const anthropic = getAnthropicClient()
      verifications = await Promise.all(
        tasks.map((t) =>
          t.answer === null
            ? Promise.resolve(null)
            : verifyWithModel(anthropic, {
                title: t.title,
                description: t.description,
                type: t.type,
                points: t.points,
                correct_answer: t.answer,
                hints: t.hints,
                options: t.options,
                explanation: t.explanation ?? undefined,
              })
        )
      )
    }
  }

  const gameCode = generateGameCode()
  const { data: game, error: gameError } = await supabase
    .from("games")
    .insert({
      teacher_id: user.id,
      title: (plan.title as string).slice(0, 200),
      description: `Pagal pamokos planą. Tema: ${plan.topic}`.slice(0, 1000),
      game_code: gameCode,
      status: "draft",
      settings: {
        max_teams: 50,
        // The plan's lesson length includes the facilitator's own parts;
        // a limit, if any, is set in the activity settings.
        time_limit_minutes: null,
        show_leaderboard: true,
        shuffle_challenges: false,
      },
    })
    .select("id")
    .single()
  if (gameError || !game) {
    console.error("Lesson plan convert: game insert failed", { code: gameError?.code })
    return NextResponse.json({ error: "Nepavyko sukurti veiklos" }, { status: 500 })
  }

  const rows = await Promise.all(
    tasks.map(async (task, i) => {
      const review = reviewTask(task, verifications[i])
      const answer = review.keepAnswer && task.answer !== null ? task.answer : null
      return {
        row: {
          game_id: game.id,
          title: task.title,
          description: task.description,
          type: task.type,
          points: task.points,
          // A task without an answer gets an unguessable one until the
          // facilitator sets it (as for copies from the library).
          answer_hash: await hashAnswer(answer ?? crypto.randomUUID(), task.type),
          hints: task.hints,
          options: task.options,
          explanation: task.explanation,
          difficulty: task.difficulty,
          order_index: i,
          generated_by_di: true,
          needs_answer: answer === null,
          verification_verdict: review.verdict,
          verification_issues: review.issues,
          verification_confidence: review.confidence,
        },
        needsAnswer: answer === null,
        needsReview: answer !== null && review.verdict !== "pass",
      }
    })
  )

  // All tasks in one insert: either the activity has every chosen task or
  // it is removed again, never a half-converted plan.
  const { error: tasksError } = await supabase.from("challenges").insert(rows.map((r) => r.row))
  if (tasksError) {
    console.error("Lesson plan convert: task insert failed", { code: tasksError.code })
    await supabase.from("games").delete().eq("id", game.id).eq("teacher_id", user.id)
    return NextResponse.json({ error: "Nepavyko sukurti užduočių. Bandykite dar kartą." }, { status: 500 })
  }

  const { error: planError } = await supabase
    .from("lesson_plans")
    .update({ status: "converted", source_game_id: game.id })
    .eq("id", plan.id)
    .eq("teacher_id", user.id)
  if (planError) console.error("Lesson plan convert: plan update failed", { code: planError.code })

  return NextResponse.json({
    game_id: game.id,
    game_code: gameCode,
    challenges_created: rows.length,
    needs_answers: rows.filter((r) => r.needsAnswer).length,
    needs_review: rows.filter((r) => r.needsReview).length,
    skipped_stages: stages.length - rows.length,
  })
}

// Up to 30 DI checks run in parallel; give them room.
export const maxDuration = 60
