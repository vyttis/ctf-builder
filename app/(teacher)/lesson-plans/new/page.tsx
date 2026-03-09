import { LessonPlanGenerator } from "@/components/teacher/lesson-plan-generator"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewLessonPlanPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/lesson-plans" className="inline-block mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Visi pamokų planai
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-steam-dark">
          Naujas pamokos planas
        </h1>
        <p className="text-muted-foreground mt-1">
          Sukurkite struktūruotą pamokos planą pagal Lietuvos ugdymo programą su DI pagalba.
        </p>
      </div>

      <LessonPlanGenerator />
    </div>
  )
}
