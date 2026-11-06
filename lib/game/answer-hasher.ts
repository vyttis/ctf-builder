import bcrypt from "bcryptjs"
import { timingSafeEqual } from "crypto"

const BCRYPT_ROUNDS = 10

/**
 * Legacy normalization: trim + lowercase, diacritics preserved.
 * Hashes created before diacritic folding still use this form, so
 * verifyAnswer keeps checking it as a fallback.
 */
export function normalizeAnswerLegacy(answer: string): string {
  return answer.trim().toLowerCase()
}

/**
 * Current normalization: trim, lowercase, collapse inner whitespace and fold
 * diacritics (ą→a, č→c, ė→e, š→s, ...). Participants often type on phones
 * without a Lithuanian keyboard, so "saltini" must match "šaltinį".
 */
export function normalizeAnswer(answer: string): string {
  return answer
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

export async function hashAnswer(answer: string): Promise<string> {
  return bcrypt.hash(normalizeAnswer(answer), BCRYPT_ROUNDS)
}

function legacyPlaintextEquals(candidate: string, stored: string): boolean {
  const a = Buffer.from(candidate, "utf-8")
  const b = Buffer.from(stored, "utf-8")
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function verifyAnswer(
  submitted: string,
  storedHash: string
): Promise<boolean> {
  const folded = normalizeAnswer(submitted)
  const legacy = normalizeAnswerLegacy(submitted)

  // Support legacy plaintext hashes (migration path)
  // Use constant-time comparison to prevent timing attacks
  if (!storedHash.startsWith("$2")) {
    return (
      legacyPlaintextEquals(legacy, storedHash) ||
      legacyPlaintextEquals(folded, normalizeAnswer(storedHash))
    )
  }

  if (await bcrypt.compare(folded, storedHash)) return true
  // Hashes created before diacritic folding: only an exact (accented) match works
  if (legacy !== folded) return bcrypt.compare(legacy, storedHash)
  return false
}
