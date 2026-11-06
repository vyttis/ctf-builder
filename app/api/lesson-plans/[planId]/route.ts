import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { lessonPlanContentSchema } from "@/lib/lesson-plans/schema"

type Params = { params: Promise<{ planId: string }> }

const PLAN_COLUMNS =
  "id, teacher_id, title, subject, secondary_subject, grade, topic, lesson_type, duration, goal, curriculum_link, competencies, stages, reflection_prompt, teacher_methodical_note, status, source_game_id, created_at, updated_at"

/**
 * PATCH: save the facilitator's edits of a plan's content. Subject, grade,
 * topic and length stay as generated (they shaped the content); an activity
 * already made from the plan keeps its own copy of the tasks.
 */
export async function PATCH(request: Request, props: Params) {
  const { planId } = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = lessonPlanContentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Neteisingi duomenys" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("lesson_plans")
    .update(parsed.data)
    .eq("id", planId)
    .eq("teacher_id", user.id)
    .select(PLAN_COLUMNS)
    .maybeSingle()
  if (error) {
    console.error("Lesson plan update failed", { code: error.code })
    return NextResponse.json({ error: "Nepavyko išsaugoti plano" }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: "Pamokos planas nerastas" }, { status: 404 })
  return NextResponse.json({ lesson_plan: data })
}

/** DELETE: remove a plan. An activity made from it stays. */
export async function DELETE(_request: Request, props: Params) {
  const { planId } = await props.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })

  const { data, error } = await supabase
    .from("lesson_plans")
    .delete()
    .eq("id", planId)
    .eq("teacher_id", user.id)
    .select("id")
  if (error) {
    console.error("Lesson plan delete failed", { code: error.code })
    return NextResponse.json({ error: "Nepavyko ištrinti plano" }, { status: 500 })
  }
  if (!data || data.length === 0) return NextResponse.json({ error: "Pamokos planas nerastas" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
