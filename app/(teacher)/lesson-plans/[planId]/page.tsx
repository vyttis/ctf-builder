import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { LessonPlanDetail } from "@/components/teacher/lesson-plan-detail"

export default async function LessonPlanDetailPage({
  params,
}: {
  params: { planId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: plan } = await supabase
    .from("lesson_plans")
    .select("*")
    .eq("id", params.planId)
    .eq("teacher_id", user!.id)
    .single()

  if (!plan) {
    notFound()
  }

  return <LessonPlanDetail plan={plan} />
}
