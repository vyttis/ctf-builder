// Lesson plan — teacher-facing planning object
// Separate from student activities / games

export type LessonPlanStatus = "draft" | "saved" | "converted"

export type LessonStageType = "intro" | "challenge" | "discussion" | "reflection"

export interface LessonStage {
  activity_type: LessonStageType
  title: string
  description: string
  type: "text" | "number" | "multiple_choice"
  correct_answer: string
  options: string[] | null
  hints: string[]
  explanation: string
  points: number
  duration_minutes: number
  difficulty: "easy" | "medium" | "hard"
}

export interface LessonPlan {
  id: string
  teacher_id: string
  title: string
  subject: string
  grade: number
  topic: string
  lesson_type: string
  duration: number
  goal: string
  curriculum_link: string
  stages: LessonStage[]
  reflection_prompt: string
  teacher_methodical_note: string
  status: LessonPlanStatus
  source_game_id: string | null // if converted to a student activity
  created_at: string
  updated_at: string
}

export interface LessonPlanFormData {
  title: string
  subject: string
  grade: number
  topic: string
  lesson_type: string
  duration: number
  goal: string
  curriculum_link: string
  stages: LessonStage[]
  reflection_prompt: string
  teacher_methodical_note: string
}

export interface LessonPlanWithMeta extends LessonPlan {
  stage_count: number
}
