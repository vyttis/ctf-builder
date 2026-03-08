import bcrypt from "bcryptjs"

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
  if (!storedHash.startsWith("$2")) {
    return normalized === storedHash
  }

  return bcrypt.compare(normalized, storedHash)
}
