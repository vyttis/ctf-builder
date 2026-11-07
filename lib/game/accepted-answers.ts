import { z } from "zod"
import {
  acceptedAnswerKey,
  hashAcceptedAnswer,
  MAX_ACCEPTED_ANSWERS,
  MAX_ANSWER_LENGTH,
  sameAsMainAnswer,
} from "@/lib/game/answer-hasher"

/** Extra accepted answers as the task routes receive them (plain text). */
export const acceptedAnswersSchema = z
  .array(z.string().max(MAX_ANSWER_LENGTH, `Atsakymas gali būti iki ${MAX_ANSWER_LENGTH} ženklų`))
  .max(MAX_ACCEPTED_ANSWERS, `Kitų priimamų atsakymų gali būti iki ${MAX_ACCEPTED_ANSWERS}`)

export type PreparedAcceptedAnswers = { ok: true; hashes: string[] } | { ok: false; error: string }

/**
 * Hashes for a task's extra accepted answers. Empty entries, repeats and an
 * entry the main answer already accepts as stored (when it is sent along)
 * are dropped; a choice task has none, since its answer is one of the
 * options.
 */
export async function prepareAcceptedAnswers(
  answers: readonly string[],
  type: string | null | undefined,
  mainAnswer?: string | null,
): Promise<PreparedAcceptedAnswers> {
  if (type === "multiple_choice") return { ok: true, hashes: [] }
  const main = mainAnswer?.trim() || null
  const seen = new Set<string>()
  const kept: string[] = []
  for (const raw of answers) {
    const answer = raw.trim()
    if (!answer) continue
    const key = acceptedAnswerKey(answer, type)
    if (key === null) return { ok: false, error: "Kiti priimami atsakymai turi būti skaičiai." }
    if ((main && sameAsMainAnswer(answer, main, type)) || seen.has(key)) continue
    seen.add(key)
    kept.push(answer)
  }
  return { ok: true, hashes: await Promise.all(kept.map((a) => hashAcceptedAnswer(a, type))) }
}
