import bcrypt from "bcryptjs"
import { timingSafeEqual } from "crypto"

const BCRYPT_ROUNDS = 10

/** The challenge facts that decide how an answer is compared. */
export interface AnswerRules {
  type?: string | null
  options?: readonly string[] | null
}

/**
 * Exact form: trim + lowercase, diacritics preserved. Used for multiple-choice
 * and number answers, and for text hashes created before diacritic folding.
 */
export function normalizeAnswerLegacy(answer: string): string {
  return answer.trim().toLowerCase()
}

/**
 * Folded form for typed text answers: trim, lowercase, collapse inner
 * whitespace and drop diacritics (ą→a, č→c, ė→e, š→s, ...). Participants often
 * type on phones without a Lithuanian keyboard, so "saltini" must match
 * "šaltinį".
 */
export function normalizeAnswer(answer: string): string {
  return answer
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

/**
 * Only typed text answers fold diacritics. A multiple-choice answer is
 * selected, not typed, and its options may differ by one letter only
 * ("kasti" / "kąsti"): folding would credit the wrong option.
 */
function foldsDiacritics(type: string | null | undefined): boolean {
  return (type ?? "text") === "text"
}

function foldedOptionsAreDistinct(options: readonly string[] | null | undefined): boolean {
  if (!options || options.length === 0) return false
  const folded = options.map(normalizeAnswer)
  return new Set(folded).size === folded.length
}

/**
 * Forms tried against the stored hash, in order.
 * - text: folded (current hashes), then exact (hashes made before folding);
 * - multiple choice: exact; folded only when no two options fold to the same
 *   string, which covers a task switched from text to choice without a new
 *   answer and can never credit a different option;
 * - number and anything else: exact.
 */
function candidateForms(submitted: string, rules: AnswerRules): string[] {
  const exact = normalizeAnswerLegacy(submitted)
  const folded = normalizeAnswer(submitted)
  let forms: string[]
  if (foldsDiacritics(rules.type)) {
    forms = [folded, exact]
  } else if (rules.type === "multiple_choice" && foldedOptionsAreDistinct(rules.options)) {
    forms = [exact, folded]
  } else {
    forms = [exact]
  }
  return [...new Set(forms)]
}

export async function hashAnswer(answer: string, type: string | null | undefined): Promise<string> {
  const form = foldsDiacritics(type) ? normalizeAnswer(answer) : normalizeAnswerLegacy(answer)
  return bcrypt.hash(form, BCRYPT_ROUNDS)
}

function plaintextEquals(candidate: string, stored: string): boolean {
  const a = Buffer.from(candidate, "utf-8")
  const b = Buffer.from(stored, "utf-8")
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

export async function verifyAnswer(
  submitted: string,
  storedHash: string,
  rules: AnswerRules
): Promise<boolean> {
  const forms = candidateForms(submitted, rules)

  // Support legacy plaintext hashes (migration path)
  // Use constant-time comparison to prevent timing attacks
  if (!storedHash.startsWith("$2")) {
    const storedForms = foldsDiacritics(rules.type)
      ? [storedHash, normalizeAnswer(storedHash)]
      : [storedHash]
    return forms.some((form) => storedForms.some((stored) => plaintextEquals(form, stored)))
  }

  for (const form of forms) {
    if (await bcrypt.compare(form, storedHash)) return true
  }
  return false
}
