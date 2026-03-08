import { z } from "zod"

export const lessonActivitySchema = z.object({
  activity_type: z.enum(["intro", "challenge", "discussion", "reflection"]),
  title: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(["text", "number", "multiple_choice"]),
  correct_answer: z.coerce.string().min(1),
  options: z.array(z.string()).nullable().default(null),
  hints: z.array(z.string()).default([]),
  explanation: z.string().default(""),
  points: z.number().min(10).max(500).default(100),
  duration_minutes: z.number().min(1).max(45).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
})

export const generatedLessonSchema = z.object({
  title: z.string().min(1),
  goal: z.string().min(1),
  curriculum_link: z.string().default(""),
  activities: z.array(lessonActivitySchema).min(1),
  reflection_question: z.string().default(""),
  teacher_note: z.string().default(""),
})

export const lessonGenerateRequestSchema = z.object({
  game_id: z.string().uuid(),
  subject: z.string().min(1),
  grade: z.number().min(1).max(12),
  topic: z.string().min(1).max(500),
  lesson_type: z.enum(["nauja_tema", "kartojimas", "vertinimas", "projektine_veikla"]),
  duration: z.number().min(25).max(45),
  learning_goal: z.string().max(500).optional(),
  curriculum_context: z.string().max(2000).optional(),
  existing_challenges: z
    .array(
      z.object({
        title: z.string(),
        type: z.string(),
        points: z.number(),
      })
    )
    .default([]),
})
