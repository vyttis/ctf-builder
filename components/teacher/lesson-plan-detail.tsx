"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  GraduationCap,
  Clock,
  Target,
  MessageSquare,
  BookOpen,
  PlayCircle,
  Loader2,
  FileText,
} from "lucide-react"
import Link from "next/link"

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

const ACTIVITY_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  intro: { label: "Įvadas", color: "bg-blue-100 text-blue-700" },
  challenge: { label: "Veikla", color: "bg-green-100 text-green-700" },
  discussion: { label: "Diskusija", color: "bg-purple-100 text-purple-700" },
  reflection: { label: "Refleksija", color: "bg-amber-100 text-amber-700" },
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  draft: { label: "Juodraštis", variant: "outline" },
  saved: { label: "Išsaugotas", variant: "secondary" },
  converted: { label: "Paverstas veikla", variant: "default" },
}

interface LessonPlanDetailProps {
  plan: {
    id: string
    title: string
    subject: string
    grade: number
    topic: string
    lesson_type: string
    duration: number
    goal: string
    curriculum_link: string
    stages: Array<{
      activity_type: string
      title: string
      description: string
      type: string
      duration_minutes: number
      difficulty: string
      points: number
      hints: string[]
      explanation: string
    }>
    reflection_prompt: string
    teacher_methodical_note: string
    status: string
    source_game_id: string | null
    created_at: string
  }
}

export function LessonPlanDetail({ plan }: LessonPlanDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [converting, setConverting] = useState(false)

  const status = STATUS_LABELS[plan.status] || STATUS_LABELS.draft
  const stages = plan.stages || []

  async function handleConvert() {
    setConverting(true)
    try {
      const res = await fetch(`/api/lesson-plans/${plan.id}/convert`, {
        method: "POST",
      })

      if (!res.ok) throw new Error("Nepavyko konvertuoti")

      const data = await res.json()
      toast({
        title: "Veikla mokiniams sukurta!",
        description: `${data.challenges_created} užduočių sukurta. Kodas: ${data.game_code}`,
      })
      router.push(`/games/${data.game_id}`)
      router.refresh()
    } catch (err) {
      toast({
        title: "Klaida",
        description: err instanceof Error ? err.message : "Nepavyko konvertuoti",
        variant: "destructive",
      })
    } finally {
      setConverting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/lesson-plans" className="inline-block mb-6">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Visi pamokų planai
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(plan.created_at).toLocaleDateString("lt-LT")}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-steam-dark">{plan.title}</h1>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Badge variant="outline" className="gap-1">
          <GraduationCap className="h-3 w-3" />
          {SUBJECT_LABELS[plan.subject] || plan.subject}
        </Badge>
        <Badge variant="outline">{plan.grade} klasė</Badge>
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          {plan.duration} min.
        </Badge>
        <Badge variant="outline">
          {LESSON_TYPE_LABELS[plan.lesson_type] || plan.lesson_type}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <FileText className="h-3 w-3" />
          {stages.length} veikl.
        </Badge>
      </div>

      {/* Goal */}
      {plan.goal && (
        <Card className="border-border/50 bg-white mb-4">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-secondary mb-1 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Pamokos tikslas
            </p>
            <p className="text-sm text-steam-dark">{plan.goal}</p>
          </CardContent>
        </Card>
      )}

      {/* Curriculum link */}
      {plan.curriculum_link && (
        <Card className="border-secondary/20 bg-secondary/5 mb-6">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-secondary mb-1 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Ryšys su ugdymo programa
            </p>
            <p className="text-sm text-muted-foreground">{plan.curriculum_link}</p>
          </CardContent>
        </Card>
      )}

      {/* Stages / lesson flow */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-steam-dark flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-secondary" />
          Pamokos eiga
        </h2>

        <div className="space-y-3">
          {stages.map((stage, index) => {
            const typeInfo = ACTIVITY_TYPE_LABELS[stage.activity_type] || ACTIVITY_TYPE_LABELS.challenge
            return (
              <Card key={index} className="border-border/50 bg-white">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-sm font-bold text-secondary shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {stage.duration_minutes} min.
                        </span>
                        {stage.difficulty && (
                          <span className="text-xs text-muted-foreground">
                            · {stage.difficulty === "easy" ? "Lengva" : stage.difficulty === "medium" ? "Vidutinė" : "Sunki"}
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium text-steam-dark text-sm">{stage.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>
                      {stage.explanation && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          Paaiškinimas: {stage.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Reflection */}
      {plan.reflection_prompt && (
        <Card className="border-border/50 bg-white mb-4">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Refleksijos klausimas klasei
            </p>
            <p className="text-sm text-steam-dark">{plan.reflection_prompt}</p>
          </CardContent>
        </Card>
      )}

      {/* Teacher note */}
      {plan.teacher_methodical_note && (
        <Card className="border-highlight/30 bg-highlight/5 mb-6">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-highlight mb-1 flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              Metodinė pastaba mokytojui
            </p>
            <p className="text-sm text-muted-foreground">{plan.teacher_methodical_note}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-8">
        {plan.status !== "converted" ? (
          <Button
            onClick={handleConvert}
            disabled={converting}
            className="flex-1 gap-2 border-accent/30 text-accent hover:bg-accent/5"
            variant="outline"
            size="lg"
          >
            {converting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Kuriama veikla mokiniams...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                Sukurti veiklą mokiniams
              </>
            )}
          </Button>
        ) : plan.source_game_id ? (
          <Link href={`/games/${plan.source_game_id}`} className="flex-1">
            <Button
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-white"
              size="lg"
            >
              <PlayCircle className="h-4 w-4" />
              Peržiūrėti veiklą mokiniams
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  )
}
