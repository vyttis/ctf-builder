import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, GraduationCap, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const SUBJECT_LABELS: Record<string, string> = {
  matematika: "Matematika",
  biologija: "Biologija",
  geografija: "Geografija",
  istorija: "Istorija",
  steam: "STEAM",
}

const LESSON_TYPE_LABELS: Record<string, string> = {
  nauja_tema: "Nauja tema",
  kartojimas: "Kartojimas",
  vertinimas: "Vertinimas",
  projektine_veikla: "Projektinė veikla",
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Juodraštis", variant: "outline" },
  saved: { label: "Išsaugotas", variant: "secondary" },
  converted: { label: "Paverstas veikla", variant: "default" },
}

export default async function LessonPlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: plans } = await supabase
    .from("lesson_plans")
    .select("*")
    .eq("teacher_id", user!.id)
    .order("created_at", { ascending: false })

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-steam-dark">
            Pamokų planai
          </h1>
          <p className="text-muted-foreground mt-1">
            Kurkite ir valdykite pamokų planus pagal ugdymo programą
          </p>
        </div>
        <Link href="/lesson-plans/new">
          <Button className="bg-secondary hover:bg-secondary/90 text-white shadow-md shadow-secondary/20 gap-2">
            <Plus className="h-4 w-4" />
            Naujas planas
          </Button>
        </Link>
      </div>

      {/* Plans list */}
      {plans && plans.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const stageCount = Array.isArray(plan.stages) ? plan.stages.length : 0
            const status = STATUS_LABELS[plan.status] || STATUS_LABELS.draft

            return (
              <Link key={plan.id} href={`/lesson-plans/${plan.id}`}>
                <Card className="border-border/50 bg-white hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300 group cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4.5 w-4.5 text-secondary" />
                      </div>
                      <Badge variant={status.variant} className="text-xs shrink-0">
                        {status.label}
                      </Badge>
                    </div>

                    <h3 className="font-semibold text-steam-dark text-sm mb-1 line-clamp-2 group-hover:text-secondary transition-colors">
                      {plan.title}
                    </h3>

                    {plan.goal && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                        {plan.goal}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                      <span className="bg-muted/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {SUBJECT_LABELS[plan.subject] || plan.subject}
                      </span>
                      <span className="bg-muted/50 px-2 py-0.5 rounded-full">
                        {plan.grade} kl.
                      </span>
                      <span className="bg-muted/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {plan.duration} min.
                      </span>
                      <span className="bg-muted/50 px-2 py-0.5 rounded-full">
                        {stageCount} veikl.
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                      <span className="text-xs text-muted-foreground">
                        {LESSON_TYPE_LABELS[plan.lesson_type] || plan.lesson_type}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-48 h-48 mb-6">
            <Image src="/illustrations/empty-state.svg" alt="Nėra planų" width={192} height={192} className="w-full h-full" />
          </div>
          <GraduationCap className="h-10 w-10 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-semibold text-steam-dark mb-2">
            Dar nėra pamokų planų
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Sukurkite savo pirmąjį pamokos planą su DI pagalba ir pritaikykite jį savo klasei
          </p>
          <Link href="/lesson-plans/new">
            <Button className="bg-secondary hover:bg-secondary/90 text-white shadow-lg shadow-secondary/25 gap-2">
              <Plus className="h-4 w-4" />
              Sukurti pirmąjį planą
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
