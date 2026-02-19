import { customAlphabet } from "nanoid"

// 6 chars, uppercase + digits, excluding ambiguous O/0/I/1/L
const generateCode = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 6)

export function generateGameCode(): string {
  return generateCode()
}

// 32 chars for session tokens
const generateToken = customAlphabet(
  "abcdefghijklmnopqrstuvwxyz0123456789",
  32
)

export function generateSessionToken(): string {
  return generateToken()
}
