/**
 * Number answers compare by value, not by the characters typed: "2,5",
 * "2.50", " 2.5 " and "+2.5" are the same answer, "1 000" is 1000 and "07"
 * is 7. Lithuanian writing uses a decimal comma and spaces between
 * thousands; phones may send a non-breaking space or a Unicode minus.
 */

/** The canonical text of a typed number ("2.5", "-3", "1000"), or null if it is not a number. */
export function canonicalNumber(input: string): string | null {
  let s = input
    .trim()
    .replace(/[\s   ]/g, "")
    .replace(/^[−–]/, "-")
    .replace(/^\+/, "")
  if (/^-?[.,]\d+$/.test(s)) s = s.replace(/^(-?)[.,]/, "$10.")
  if (!/^-?\d+([.,]\d+)?$/.test(s)) return null
  const n = Number(s.replace(",", "."))
  if (!Number.isFinite(n)) return null
  return String(n)
}

/** True when the text can be read as a number. */
export function isNumberAnswer(input: string): boolean {
  return canonicalNumber(input) !== null
}
