import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { LessonPlanDetail } from "@/components/teacher/lesson-plan-detail"

export const metadata: Metadata = { title: "Pamokos planas" }

export default async function LessonPlanDetailPage(
  props: {
    params: Promise<{ planId: string }>
    searchParams: Promise<{ convert?: string }>
  }
) {
  const params = await props.params;
  const { convert } = await props.searchParams
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

  // "?convert=1" comes from the generator's "Sukurti veiklą dalyviams":
  // the plan is saved, and the facilitator picks the stages here.
  return <LessonPlanDetail plan={plan} openConvert={convert === "1"} />
}
