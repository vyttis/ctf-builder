import type { PlayerSession } from "@/types/game"

const SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

export function getPlayerSession(gameCode: string): PlayerSession | null {
  const key = `ctf_session_${gameCode}`
  const stored = localStorage.getItem(key)
  if (!stored) return null

  try {
    const session: PlayerSession = JSON.parse(stored)

    // Validate session has required fields
    if (!session.session_token || !session.team_id) {
      clearPlayerSession(gameCode)
      return null
    }

    // Check expiry (sessions without created_at are treated as legacy — still valid)
    if (session.created_at && Date.now() - session.created_at > SESSION_TTL_MS) {
      clearPlayerSession(gameCode)
      return null
    }

    return session
  } catch {
    clearPlayerSession(gameCode)
    return null
  }
}

export function savePlayerSession(gameCode: string, session: PlayerSession): void {
  const key = `ctf_session_${gameCode}`
  const withTimestamp: PlayerSession = {
    ...session,
    created_at: session.created_at ?? Date.now(),
  }
  localStorage.setItem(key, JSON.stringify(withTimestamp))
}

export function clearPlayerSession(gameCode: string): void {
  localStorage.removeItem(`ctf_session_${gameCode}`)
  localStorage.removeItem(`ctf_start_${gameCode}`)
  localStorage.removeItem(`ctf_reflection_${gameCode}`)
}
