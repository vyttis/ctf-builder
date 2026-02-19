export type GameStatus = "draft" | "active" | "paused" | "finished"

export type ChallengeType = "text" | "number" | "multiple_choice"

export interface GameSettings {
  max_teams: number
  time_limit_minutes: number | null
  show_leaderboard: boolean
  shuffle_challenges: boolean
}

export interface GameWithChallengeCount {
  id: string
  teacher_id: string
  title: string
  description: string | null
  game_code: string
  status: GameStatus
  settings: GameSettings
  starts_at: string | null
  ends_at: string | null
  created_at: string
  updated_at: string
  challenges: { count: number }[]
}

export interface Challenge {
  id: string
  game_id: string
  title: string
  description: string | null
  type: ChallengeType
  points: number
  answer_hash: string
  hints: string[]
  options: string[] | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface ChallengeFormData {
  title: string
  description: string
  type: ChallengeType
  points: number
  correct_answer: string
  hints: string[]
  options: string[] | null
  order_index: number
}

export interface PlayerSession {
  team_id: string
  session_token: string
  game_code: string
  team_name: string
}

export interface LeaderboardEntry {
  id: string
  name: string
  total_points: number
  current_challenge_index: number
  joined_at: string
  updated_at: string
}

export interface SubmissionResult {
  is_correct: boolean
  points_awarded: number
  message: string
  total_points?: number
}
