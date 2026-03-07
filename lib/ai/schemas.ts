import { z } from "zod"

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
