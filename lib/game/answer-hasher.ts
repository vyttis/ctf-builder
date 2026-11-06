import bcrypt from "bcryptjs"
import { createHash, timingSafeEqual } from "crypto"
import { canonicalNumber, legacyNumberSpellings } from "@/lib/game/number-answer"

const BCRYPT_ROUNDS = 10

/** Longest answer a facilitator can set and a participant can submit. */
export const MAX_ANSWER_LENGTH = 500

/**
 * A number answer stored by value has this suffix after its bcrypt hash
 * (":" is not in the bcrypt alphabet). It tells verification that one
 * comparison of the canonical value is enough; hashes without it come from
 * before, when the typed text was stored, and are tried with the usual older
 * spellings. The hash still starts with "$2", so tools that treat any other
 * value as unhashed plaintext (migration 00018) leave it alone, and a
 * duplicated activity copies it as it is. (The SQL check_answer() is unused
 * and does not read the suffix.)
 */
const NUMBER_VALUE_SUFFIX = ":num"

/**
 * bcrypt reads only the first 72 bytes of its input, so a value hash is made
 * from a SHA-256 digest of the canonical number: two long numbers that share
 * their first 72 digits stay different answers.
 */
function valueDigest(canonical: string): string {
  return createHash("sha256").update(canonical, "utf8").digest("hex")
}

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
 * A typed text answer may end with punctuation the participant did not mean
 * (the iOS double-space shortcut adds "."). Tried as an extra form, so a
 * stored answer that really ends with "?" still matches when typed in full.
 */
function withoutTrailingPunctuation(form: string): string {
  return form.replace(/[.,;:!?…]+$/u, "").trimEnd()
}

/**
 * Forms tried against the stored hash, in order.
 * - text: folded (current hashes), folded without trailing punctuation,
 *   then exact with and without it (hashes made before folding);
 * - multiple choice: exact; folded only when no two options fold to the same
 *   string, which covers a task switched from text to choice without a new
 *   answer and can never credit a different option;
 * - number (hashes made before values were stored): the canonical value,
 *   the exact text, the value with a decimal comma, then other spellings a
 *   facilitator may have typed ("1 000", "2.50", "3.0");
 * - anything else: exact.
 */
function candidateForms(submitted: string, rules: AnswerRules): string[] {
  const exact = normalizeAnswerLegacy(submitted)
  const folded = normalizeAnswer(submitted)
  let forms: string[]
  if (foldsDiacritics(rules.type)) {
    forms = [folded, withoutTrailingPunctuation(folded), exact, withoutTrailingPunctuation(exact)]
  } else if (rules.type === "multiple_choice" && foldedOptionsAreDistinct(rules.options)) {
    forms = [exact, folded]
  } else if (rules.type === "number") {
    const canonical = canonicalNumber(submitted)
    forms =
      canonical === null
        ? [exact]
        : [canonical, exact, canonical.replace(".", ","), ...legacyNumberSpellings(canonical)]
  } else {
    forms = [exact]
  }
  return [...new Set(forms.filter((f) => f.length > 0))]
}

/**
 * The form a new answer is stored in. Numbers are stored by value, so any
 * way of writing the same number matches; text that is not a number keeps
 * its exact form.
 */
export function storedForm(answer: string, type: string | null | undefined): string {
  if (foldsDiacritics(type)) return normalizeAnswer(answer)
  if (type === "number") return canonicalNumber(answer) ?? normalizeAnswerLegacy(answer)
  return normalizeAnswerLegacy(answer)
}

export async function hashAnswer(answer: string, type: string | null | undefined): Promise<string> {
  const canonical = type === "number" ? canonicalNumber(answer) : null
  if (canonical !== null) {
    return (await bcrypt.hash(valueDigest(canonical), BCRYPT_ROUNDS)) + NUMBER_VALUE_SUFFIX
  }
  return bcrypt.hash(storedForm(answer, type), BCRYPT_ROUNDS)
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
  if (storedHash.startsWith("$2") && storedHash.endsWith(NUMBER_VALUE_SUFFIX)) {
    const canonical = canonicalNumber(submitted)
    if (canonical === null) return false
    return bcrypt.compare(valueDigest(canonical), storedHash.slice(0, -NUMBER_VALUE_SUFFIX.length))
  }

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
