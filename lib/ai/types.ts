import { ChallengeType } from "@/types/game"

export interface AiSuggestion {
  title: string
  description: string
  type: ChallengeType
  points: number
  correct_answer: string
  hints: string[]
  options: string[] | null
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
