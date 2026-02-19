// Sprint 1: simple normalized comparison
// Sprint 2: upgrade to bcrypt hashing

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLowerCase()
}

export function hashAnswer(answer: string): string {
  // Sprint 1: store normalized plaintext
  // Sprint 2: bcrypt.hashSync(normalizeAnswer(answer), 10)
  return normalizeAnswer(answer)
}

export function verifyAnswer(submitted: string, stored: string): boolean {
  return normalizeAnswer(submitted) === stored
}
