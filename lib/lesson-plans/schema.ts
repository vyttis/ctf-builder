import { z } from "zod"
import { COMPETENCIES, BLOOM_LEVELS } from "@/lib/ai/schemas"
import { MAX_ANSWER_LENGTH } from "@/lib/game/answer-hasher"

const clamp = (min: number, max: number, fallback: number) => (n: number) =>
  Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback

/**
 * One stage of a saved lesson plan, as the facilitator edits it. Points and
 * minutes are brought into range instead of refused, so a stray value in a
 * number field never loses the whole plan on save.
 */
export const lessonStageSchema = z.object({
  activity_type: z.enum(["intro", "challenge", "discussion", "reflection"]),
  title: z.string().trim().min(1, "Kiekvienas etapas turi turėti pavadinimą").max(200),
  description: z.string().trim().min(1, "Kiekvienas etapas turi turėti aprašymą").max(5000),
  type: z.enum(["text", "number", "multiple_choice"]),
  correct_answer: z
    .string()
    .trim()
    .min(1, "Kiekvienas etapas turi turėti atsakymą")
    .max(MAX_ANSWER_LENGTH, `Atsakymas gali būti iki ${MAX_ANSWER_LENGTH} ženklų`),
  options: z
    .array(z.string().max(500))
    .nullable()
    .default(null)
    .transform((o) => (o ? o.slice(0, 10) : null)),
  hints: z
    .array(z.string().max(1000))
    .default([])
    .transform((h) => h.slice(0, 10)),
  explanation: z.string().max(5000).default(""),
  points: z.number().default(100).transform(clamp(1, 1000, 100)),
  duration_minutes: z.number().default(5).transform(clamp(1, 90, 5)),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  competencies: z.array(z.enum(COMPETENCIES)).default([]),
  bloom_level: z.enum(BLOOM_LEVELS).optional(),
})

/** The fields of a saved plan the facilitator may change. */
export const lessonPlanContentSchema = z.object({
  title: z.string().trim().min(1, "Įrašykite pamokos pavadinimą").max(200),
  goal: z.string().max(2000).default(""),
  curriculum_link: z.string().max(2000).default(""),
  competencies: z.array(z.enum(COMPETENCIES)).default([]),
  stages: z.array(lessonStageSchema).min(1, "Plane turi likti bent vienas etapas").max(30),
  reflection_prompt: z.string().max(2000).default(""),
  teacher_methodical_note: z.string().max(10000).default(""),
})
