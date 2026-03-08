import { ChallengeType } from "@/types/game"

export interface LessonGenerateRequest {
  game_id: string
  subject: string
  grade: number
  topic: string
  lesson_type: string
  duration: number
  learning_goal?: string
  curriculum_context?: string
  existing_challenges: {
    title: string
    type: string
    points: number
  }[]
}

export interface LessonActivity {
  activity_type: "intro" | "challenge" | "discussion" | "reflection"
  title: string
  description: string
  type: ChallengeType
  correct_answer: string
  options: string[] | null
  hints: string[]
  explanation: string
  points: number
  duration_minutes: number
  difficulty: "easy" | "medium" | "hard"
}

export interface GeneratedLesson {
  title: string
  goal: string
  curriculum_link: string
  activities: LessonActivity[]
  reflection_question: string
  teacher_note: string
}

export interface LessonGenerateResponse {
  lesson: GeneratedLesson
}
