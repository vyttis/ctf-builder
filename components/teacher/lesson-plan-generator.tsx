"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { SUBJECTS, LESSON_TYPES, DURATIONS, getGradesForSubject } from "@/lib/curriculum/subjects"
import { getTopicsForSubjectAndGrade, getCurriculumContext } from "@/lib/curriculum/topics"
import type { LessonStage } from "@/types/lesson-plan"
import { LessonActivityCard } from "./lesson-activity-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Loader2,
  BookOpen,
  Save,
  RefreshCw,
  GraduationCap,
  Clock,
  Target,
  MessageSquare,
  PlayCircle,
} from "lucide-react"

type Phase = "input" | "preview" | "saving"

export function LessonPlanGenerator() {
  const router = useRouter()
  const { toast } = useToast()

  // Form state
  const [subject, setSubject] = useState("")
  const [grade, setGrade] = useState<number | null>(null)
  const [topicId, setTopicId] = useState("")
  const [customTopic, setCustomTopic] = useState("")
  const [lessonType, setLessonType] = useState("")
  const [duration, setDuration] = useState<number>(45)
  const [learningGoal, setLearningGoal] = useState("")

  // Generation state
  const [phase, setPhase] = useState<Phase>("input")
  const [loading, setLoading] = useState(false)
  const [converting, setConverting] = useState(false)

  // Editable lesson plan state
  const [editTitle, setEditTitle] = useState("")
  const [editGoal, setEditGoal] = useState("")
  const [editTeacherNote, setEditTeacherNote] = useState("")
  const [editReflection, setEditReflection] = useState("")
  const [editCurriculumLink, setEditCurriculumLink] = useState("")
  const [stages, setStages] = useState<LessonStage[]>([])

  // Derived
  const availableGrades = useMemo(() => getGradesForSubject(subject), [subject])
  const curriculumTopics = useMemo(
    () => (subject && grade ? getTopicsForSubjectAndGrade(subject, grade) : []),
    [subject, grade]
  )
  const curriculumContext = useMemo(
    () => subject && grade ? getCurriculumContext(subject, grade, topicId || undefined) : "",
    [subject, grade, topicId]
  )

  const effectiveTopic = topicId
    ? curriculumTopics.find((t) => t.id === topicId)?.label ?? customTopic
    : customTopic

  const canGenerate = subject && grade && effectiveTopic.trim() && lessonType && duration && !loading

  async function handleGenerate() {
    if (!canGenerate) return

    setLoading(true)
    try {
      const res = await fetch("/api/lesson-plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          grade,
          topic: effectiveTopic,
          lesson_type: lessonType,
          duration,
          learning_goal: learningGoal || undefined,
          curriculum_context: curriculumContext || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Generavimas nepavyko")
      }

      const data = await res.json()
      const plan = data.lesson_plan

      setEditTitle(plan.title)
      setEditGoal(plan.goal)
      setEditCurriculumLink(plan.curriculum_link)
      setEditTeacherNote(plan.teacher_methodical_note)
      setEditReflection(plan.reflection_prompt)
      setStages(plan.stages.map((s: LessonStage) => ({ ...s })))
      setPhase("preview")
    } catch (err) {
      toast({
        title: "Generavimas nepavyko",
        description: err instanceof Error ? err.message : "Nežinoma klaida",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleRemoveStage(index: number) {
    setStages((prev) => prev.filter((_, i) => i !== index))
  }

  function handleMoveStage(index: number, direction: "up" | "down") {
    setStages((prev) => {
      const next = [...prev]
      const targetIndex = direction === "up" ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= next.length) return prev
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next
    })
  }

  function handleUpdateStage(index: number, updated: LessonStage) {
    setStages((prev) => prev.map((a, i) => (i === index ? updated : a)))
  }

  async function handleSave() {
    if (stages.length === 0) return

    setPhase("saving")
    try {
      const res = await fetch("/api/lesson-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          subject,
          grade,
          topic: effectiveTopic,
          lesson_type: lessonType,
          duration,
          goal: editGoal,
          curriculum_link: editCurriculumLink,
          stages,
          reflection_prompt: editReflection,
          teacher_methodical_note: editTeacherNote,
        }),
      })

      if (!res.ok) throw new Error("Nepavyko išsaugoti")

      const data = await res.json()
      toast({
        title: "Pamokos planas išsaugotas!",
        description: "Galite jį rasti pamokų planų sąraše.",
      })
      router.push(`/lesson-plans/${data.lesson_plan.id}`)
      router.refresh()
    } catch (err) {
      toast({
        title: "Klaida",
        description: err instanceof Error ? err.message : "Nepavyko išsaugoti",
        variant: "destructive",
      })
      setPhase("preview")
    }
  }

  async function handleConvertToActivity() {
    if (stages.length === 0) return

    setConverting(true)
    try {
      // First save
      const saveRes = await fetch("/api/lesson-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          subject,
          grade,
          topic: effectiveTopic,
          lesson_type: lessonType,
          duration,
          goal: editGoal,
          curriculum_link: editCurriculumLink,
          stages,
          reflection_prompt: editReflection,
          teacher_methodical_note: editTeacherNote,
        }),
      })

      if (!saveRes.ok) throw new Error("Nepavyko išsaugoti")

      const saveData = await saveRes.json()
      const planId = saveData.lesson_plan.id

      // Then convert
      const convertRes = await fetch(`/api/lesson-plans/${planId}/convert`, {
        method: "POST",
      })

      if (!convertRes.ok) throw new Error("Nepavyko konvertuoti")

      const convertData = await convertRes.json()
      toast({
        title: "Veikla mokiniams sukurta!",
        description: `${convertData.challenges_created} užduočių sukurta. Kodas: ${convertData.game_code}`,
      })
      router.push(`/games/${convertData.game_id}`)
      router.refresh()
    } catch (err) {
      toast({
        title: "Klaida",
        description: err instanceof Error ? err.message : "Nepavyko",
        variant: "destructive",
      })
    } finally {
      setConverting(false)
    }
  }

  function handleRegenerate() {
    setPhase("input")
    setStages([])
  }

  // --- Input phase ---
  if (phase === "input") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <Card className="border-border/50 bg-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-secondary" />
              Pamokos parametrai
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Subject */}
            <div className="space-y-2">
              <Label>Dalykas</Label>
              <Select
                value={subject}
                onValueChange={(v) => {
                  setSubject(v)
                  setGrade(null)
                  setTopicId("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pasirinkite dalyką" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grade */}
            {subject && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <Label>Klasė</Label>
                <Select
                  value={grade?.toString() ?? ""}
                  onValueChange={(v) => {
                    setGrade(parseInt(v, 10))
                    setTopicId("")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pasirinkite klasę" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGrades.map((g) => (
                      <SelectItem key={g} value={g.toString()}>
                        {g} klasė
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            {/* Topic */}
            {subject && grade && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2"
              >
                <Label>Tema</Label>
                {curriculumTopics.length > 0 && (
                  <Select
                    value={topicId}
                    onValueChange={(v) => {
                      setTopicId(v)
                      if (v) {
                        const topic = curriculumTopics.find((t) => t.id === v)
                        if (topic) setCustomTopic(topic.label)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pasirinkite iš programos arba rašykite žemiau" />
                    </SelectTrigger>
                    <SelectContent>
                      {curriculumTopics.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Input
                  placeholder="Arba įveskite savo temą..."
                  value={customTopic}
                  onChange={(e) => {
                    setCustomTopic(e.target.value)
                    if (e.target.value !== curriculumTopics.find((t) => t.id === topicId)?.label) {
                      setTopicId("")
                    }
                  }}
                />
              </motion.div>
            )}

            {/* Lesson type */}
            <div className="space-y-2">
              <Label>Pamokos tipas</Label>
              <Select value={lessonType} onValueChange={setLessonType}>
                <SelectTrigger>
                  <SelectValue placeholder="Pasirinkite tipą" />
                </SelectTrigger>
                <SelectContent>
                  {LESSON_TYPES.map((lt) => (
                    <SelectItem key={lt.id} value={lt.id}>
                      {lt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label>Trukmė</Label>
              <Select
                value={duration.toString()}
                onValueChange={(v) => setDuration(parseInt(v, 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value.toString()}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Learning goal */}
            <div className="space-y-2">
              <Label>
                Mokymosi tikslas{" "}
                <span className="text-muted-foreground font-normal">(neprivaloma)</span>
              </Label>
              <Textarea
                placeholder="Pvz.: Mokiniai gebės apskaičiuoti trikampio plotą..."
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                rows={2}
              />
            </div>

            {/* Curriculum context preview */}
            {curriculumContext && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg bg-secondary/5 border border-secondary/20 p-3"
              >
                <p className="text-xs font-medium text-secondary mb-1 flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Programos kontekstas
                </p>
                <p className="text-xs text-muted-foreground whitespace-pre-line">
                  {curriculumContext}
                </p>
              </motion.div>
            )}

            {/* Generate button */}
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full bg-secondary hover:bg-secondary/90 text-white gap-2"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generuojamas pamokos planas...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Sugeneruoti pamokos planą
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Loading skeleton */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg bg-muted/50 animate-pulse border border-border/30"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // --- Preview & Edit phase ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Lesson plan header */}
      <Card className="border-secondary/30 bg-white">
        <CardHeader className="pb-3">
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Pamokos pavadinimas</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-lg font-bold border-dashed"
              />
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                {SUBJECTS.find((s) => s.id === subject)?.label}
              </span>
              <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                {grade} klasė
              </span>
              <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                {LESSON_TYPES.find((lt) => lt.id === lessonType)?.label}
              </span>
              <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
                {duration} min.
              </span>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Pamokos tikslas</Label>
              <Textarea
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
                rows={2}
                className="border-dashed"
              />
            </div>
          </div>
        </CardHeader>
        {editCurriculumLink && (
          <CardContent className="pt-0">
            <div className="rounded-lg bg-secondary/5 border border-secondary/20 p-3">
              <p className="text-xs font-medium text-secondary mb-1 flex items-center gap-1">
                <Target className="h-3 w-3" />
                Ryšys su ugdymo programa
              </p>
              <Textarea
                value={editCurriculumLink}
                onChange={(e) => setEditCurriculumLink(e.target.value)}
                rows={2}
                className="border-dashed border-secondary/30 bg-transparent text-sm"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Stages */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-steam-dark flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-secondary" />
          Pamokos eiga ({stages.length} veiklos)
        </h3>

        <AnimatePresence>
          {stages.map((stage, index) => (
            <motion.div
              key={`${stage.title}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10, height: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <LessonActivityCard
                activity={stage}
                index={index}
                total={stages.length}
                onUpdate={(updated) => handleUpdateStage(index, updated as LessonStage)}
                onRemove={() => handleRemoveStage(index)}
                onMoveUp={() => handleMoveStage(index, "up")}
                onMoveDown={() => handleMoveStage(index, "down")}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {stages.length === 0 && (
          <Card className="border-dashed border-2 border-border/50">
            <CardContent className="p-8 text-center text-muted-foreground">
              Visos veiklos pašalintos. Generuokite iš naujo.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reflection */}
      <Card className="border-border/50 bg-white">
        <CardContent className="p-4 space-y-2">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Refleksijos klausimas klasei
          </Label>
          <Textarea
            value={editReflection}
            onChange={(e) => setEditReflection(e.target.value)}
            rows={2}
            className="border-dashed"
          />
        </CardContent>
      </Card>

      {/* Teacher note */}
      <Card className="border-highlight/30 bg-highlight/5">
        <CardContent className="p-4 space-y-2">
          <Label className="text-xs text-highlight flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            Metodinė pastaba mokytojui
          </Label>
          <Textarea
            value={editTeacherNote}
            onChange={(e) => setEditTeacherNote(e.target.value)}
            rows={3}
            className="border-dashed border-highlight/30"
          />
        </CardContent>
      </Card>

      {/* Actions — lesson plan specific */}
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleSave}
            disabled={stages.length === 0 || phase === "saving"}
            className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2"
            size="lg"
          >
            {phase === "saving" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Išsaugoma...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Išsaugoti pamokos planą
              </>
            )}
          </Button>
          <Button
            onClick={handleRegenerate}
            variant="outline"
            size="lg"
            className="gap-2"
            disabled={phase === "saving"}
          >
            <RefreshCw className="h-4 w-4" />
            Generuoti iš naujo
          </Button>
        </div>

        {/* Convert to student activity */}
        <Button
          onClick={handleConvertToActivity}
          disabled={stages.length === 0 || converting || phase === "saving"}
          variant="outline"
          size="lg"
          className="gap-2 border-accent/30 text-accent hover:bg-accent/5"
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
      </div>
    </motion.div>
  )
}
