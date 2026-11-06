/**
 * Number answers compare by value, not by the characters typed: "2,5",
 * "2.50", " 2.5 " and "+2.5" are the same answer, "1 000" is 1000 and "07"
 * is 7. Lithuanian writing uses a decimal comma and spaces between
 * thousands; phones may send a non-breaking space or a Unicode minus.
 *
 * The value is read from the digits themselves, never through a float, so
 * long integers and tiny decimals keep every digit.
 */

// Optional sign; an integer part written either plainly or in groups of
// three separated by single spaces ("1 000 000"); an optional fraction after
// a dot or a comma. A space anywhere else ("1 2", "10 00") is not a number.
const NUMBER_PATTERN = /^([+-]?)(\d{1,3}(?: \d{3})+|\d+)?(?:[.,](\d+))?$/

/** The canonical text of a typed number ("2.5", "-3", "1000"), or null if it is not a number. */
export function canonicalNumber(input: string): string | null {
  const s = input
    .trim()
    .replace(/\s/g, " ")
    .replace(/^[−–]/, "-")
  const match = NUMBER_PATTERN.exec(s)
  if (!match) return null
  const [, sign, intPart, fracPart] = match
  if (intPart === undefined && fracPart === undefined) return null

  const integer = (intPart ?? "").replace(/ /g, "").replace(/^0+/, "") || "0"
  const fraction = (fracPart ?? "").replace(/0+$/, "")
  const digits = fraction ? `${integer}.${fraction}` : integer
  if (digits === "0") return "0"
  return sign === "-" ? `-${digits}` : digits
}

/** True when the text can be read as a number. */
export function isNumberAnswer(input: string): boolean {
  return canonicalNumber(input) !== null
}

/**
 * Other spellings of a canonical number that a facilitator may have typed
 * before answers were stored by value: thousands in groups ("1 000") and
 * trailing zeros ("2.50", "3.0", "3.00"), each with a dot or a comma.
 * Only tried against hashes made before that change.
 */
export function legacyNumberSpellings(canonical: string): string[] {
  const negative = canonical.startsWith("-")
  const unsigned = negative ? canonical.slice(1) : canonical
  const [integer, fraction = ""] = unsigned.split(".")
  const sign = negative ? "-" : ""

  const spellings: string[] = []
  const withSeparators = (int: string, frac: string) => {
    if (!frac) {
      spellings.push(sign + int)
      return
    }
    spellings.push(`${sign}${int}.${frac}`, `${sign}${int},${frac}`)
  }

  if (integer.length > 3) {
    withSeparators(integer.replace(/\B(?=(\d{3})+(?!\d))/g, " "), fraction)
  }
  if (fraction.length === 1) {
    withSeparators(integer, `${fraction}0`)
  } else if (fraction.length === 0) {
    withSeparators(integer, "0")
    withSeparators(integer, "00")
  }
  return spellings
}
