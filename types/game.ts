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

// ============================================
// Sprint 2: RBAC, Library, Analytics
// ============================================

export type UserRole = "teacher" | "admin" | "super_admin"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  school: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type LibraryItemStatus = "pending_review" | "approved" | "rejected"

export interface LibraryItem {
  id: string
  source_game_id: string | null
  title: string
  description: string | null
  subject: string | null
  grade_level: string | null
  tags: string[]
  challenge_data: ChallengeSnapshot[]
  settings: GameSettings | null
  status: LibraryItemStatus
  published_by: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_notes: string | null
  clone_count: number
  created_at: string
  updated_at: string
  // joined fields
  publisher_name?: string
  publisher_email?: string
  challenge_count?: number
}

export interface ChallengeSnapshot {
  title: string
  description: string
  type: ChallengeType
  points: number
  hints: string[]
  options: string[] | null
  order_index: number
}

export interface PlatformStats {
  total_games: number
  active_games: number
  total_teachers: number
  total_admins: number
  total_users: number
  total_teams: number
  total_submissions: number
  correct_submissions: number
  library_items_approved: number
  library_items_pending: number
}

export interface GameStats {
  total_teams: number
  total_submissions: number
  correct_submissions: number
  avg_completion_time_seconds: number | null
  challenge_stats: ChallengeStatItem[]
}

export interface ChallengeStatItem {
  challenge_id: string
  title: string
  order_index: number
  points: number
  attempts: number
  solves: number
  avg_attempts_to_solve: number
}
