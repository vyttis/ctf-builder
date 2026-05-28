import { z } from "zod"

// LT BUP — 6 bendrosios kompetencijos. Canonical IDs (ASCII, no diacritics).
export const COMPETENCIES = [
  "komunikavimo",
  "pazinimo",
  "kulturine",
  "kurybiskumo",
  "pilietiskumo",
  "socialine_emocine_ir_sveikos_gyvensenos",
] as const

export const BLOOM_LEVELS = [
  "zinios",
  "supratimas",
  "taikymas",
  "analize",
  "sinteze",
  "vertinimas",
] as const

// Normalize whatever the model emits ("Pažinimo", "pazinimo kompetencija",
// "Pažinimo kompetencija", etc.) into one of the canonical IDs.
// If we can't recognize it, drop it silently rather than failing the whole
// lesson plan generation.
function normalizeCompetency(raw: unknown): typeof COMPETENCIES[number] | null {
  if (typeof raw !== "string") return null
  const stripped = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+kompetencija\s*$/, "")
    .replace(/\s+/g, "_")
    .trim()
  if ((COMPETENCIES as readonly string[]).includes(stripped)) {
    return stripped as typeof COMPETENCIES[number]
  }
  // Common alternate spellings the model may emit
  const aliases: Record<string, typeof COMPETENCIES[number]> = {
    pazinimas: "pazinimo",
    pazintine: "pazinimo",
    komunikavimas: "komunikavimo",
    komunikacijos: "komunikavimo",
    kulturos: "kulturine",
    kulturinis: "kulturine",
    kurybiskumas: "kurybiskumo",
    kurybine: "kurybiskumo",
    pilietine: "pilietiskumo",
    pilietiskumas: "pilietiskumo",
    socialine_emocine: "socialine_emocine_ir_sveikos_gyvensenos",
    socialine: "socialine_emocine_ir_sveikos_gyvensenos",
    socialiniu_emociniu_kompetencija: "socialine_emocine_ir_sveikos_gyvensenos",
    sveikos_gyvensenos: "socialine_emocine_ir_sveikos_gyvensenos",
  }
  return aliases[stripped] ?? null
}

function normalizeBloom(raw: unknown): typeof BLOOM_LEVELS[number] | undefined {
  if (typeof raw !== "string") return undefined
  const stripped = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
  if ((BLOOM_LEVELS as readonly string[]).includes(stripped)) {
    return stripped as typeof BLOOM_LEVELS[number]
  }
  // English / alternate Lithuanian forms
  const aliases: Record<string, typeof BLOOM_LEVELS[number]> = {
    knowledge: "zinios",
    remembering: "zinios",
    comprehension: "supratimas",
    understanding: "supratimas",
    application: "taikymas",
    applying: "taikymas",
    analysis: "analize",
    analyzing: "analize",
    synthesis: "sinteze",
    creating: "sinteze",
    evaluation: "vertinimas",
    evaluating: "vertinimas",
    zinojimas: "zinios",
  }
  return aliases[stripped]
}

// Lenient zod transforms — accept any string-ish input, normalize, drop unknowns.
export const competenciesSchema = z
  .preprocess(
    (val) => {
      if (!Array.isArray(val)) return []
      return val.map(normalizeCompetency).filter(Boolean)
    },
    z.array(z.enum(COMPETENCIES)),
  )
  .default([])

export const bloomLevelSchema = z.preprocess(
  (val) => normalizeBloom(val),
  z.enum(BLOOM_LEVELS).optional(),
)

export const aiSuggestionSchema = z.object({
  title: z.string(),
  description: z.string(),
  type: z.enum(["text", "number", "multiple_choice"]),
  points: z.number(),
  correct_answer: z.union([z.string(), z.number()]).transform(String),
  hints: z.array(z.string()),
  options: z.array(z.string()).nullable().default(null),
  explanation: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  competencies: competenciesSchema,
  bloom_level: bloomLevelSchema,
})

export const aiSuggestResponseSchema = z.object({
  suggestions: z.array(aiSuggestionSchema),
})

export const aiGameIdeaSchema = z.object({
  title: z.string(),
  description: z.string(),
  theme: z.string(),
})

export const aiGameSuggestResponseSchema = z.object({
  ideas: z.array(aiGameIdeaSchema),
})

export const verificationResultSchema = z.object({
  verdict: z.enum(["pass", "fail", "uncertain"]),
  issues: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.5),
})
