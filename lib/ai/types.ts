import { ChallengeType } from "@/types/game"

export type VerificationVerdict = "pass" | "fail" | "uncertain"

export type AnswerType = "text" | "number" | "multiple_choice"

export interface VerificationResult {
  verdict: VerificationVerdict
  issues: string[]
  confidence: number
}

export interface AiSuggestion {
  title: string
  description: string
  type: ChallengeType
  points: number
  correct_answer: string
  hints: string[]
  options: string[] | null
  explanation?: string
  // Verification metadata (populated after verify step)
  verification?: VerificationResult
}

export interface AiSuggestRequest {
  game_id: string
  game_title: string
  game_description: string | null
  existing_challenges: {
    title: string
    description: string | null
    type: ChallengeType
    points: number
  }[]
  teacher_prompt?: string
  count?: number
}

export interface AiSuggestResponse {
  suggestions: AiSuggestion[]
}

// Game creation AI types
export interface AiGameIdea {
  title: string
  description: string
  theme: string
}

export interface AiGameSuggestRequest {
  teacher_prompt?: string
  theme?: string
  count?: number
}

export interface AiGameSuggestResponse {
  ideas: AiGameIdea[]
}

// DI verification pipeline types
export interface DiGenerateRequest {
  game_id: string
  game_title: string
  game_description: string | null
  existing_challenges: {
    title: string
    description: string | null
    type: ChallengeType
    points: number
  }[]
  teacher_prompt?: string
  count?: number
}

export interface DiGenerateResponse {
  suggestions: AiSuggestion[]
}

export interface DiVerifyRequest {
  suggestion: AiSuggestion
}

export interface DiVerifyResponse {
  verdict: VerificationVerdict
  issues: string[]
  confidence: number
}
