import bcrypt from "bcryptjs"
import { timingSafeEqual } from "crypto"

const BCRYPT_ROUNDS = 10

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase()
}

export async function hashAnswer(answer: string): Promise<string> {
  const normalized = normalizeAnswer(answer)
  return bcrypt.hash(normalized, BCRYPT_ROUNDS)
}

export async function verifyAnswer(
  submitted: string,
  storedHash: string
): Promise<boolean> {
  const normalized = normalizeAnswer(submitted)

  // Support legacy plaintext hashes (migration path)
  // Use constant-time comparison to prevent timing attacks
  if (!storedHash.startsWith("$2")) {
    const a = Buffer.from(normalized, "utf-8")
    const b = Buffer.from(storedHash, "utf-8")
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  }

  return bcrypt.compare(normalized, storedHash)
}
