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
// Scientific notation as a number field may give it ("1e3", "2,5E-2").
const EXPONENT_PATTERN = /^([+-]?)(\d+)?(?:[.,](\d+))?[eE]([+-]?\d{1,3})$/

/**
 * The canonical text of a number given as its digits and the position of the
 * decimal point (how many digits stand before it; may be negative or past
 * the end): no leading or trailing zeros, "-" only for a value below zero.
 */
function fromDigits(sign: string, digits: string, point: number): string {
  let integer: string
  let fraction: string
  if (point <= 0) {
    integer = "0"
    fraction = "0".repeat(-point) + digits
  } else if (point >= digits.length) {
    integer = digits + "0".repeat(point - digits.length)
    fraction = ""
  } else {
    integer = digits.slice(0, point)
    fraction = digits.slice(point)
  }
  integer = integer.replace(/^0+/, "") || "0"
  fraction = fraction.replace(/0+$/, "")
  const text = fraction ? `${integer}.${fraction}` : integer
  if (text === "0") return "0"
  return sign === "-" ? `-${text}` : text
}

/** The canonical text of a typed number ("2.5", "-3", "1000"), or null if it is not a number. */
export function canonicalNumber(input: string): string | null {
  const s = input
    .trim()
    .replace(/\s/g, " ")
    .replace(/^[−–]/, "-")

  const exp = EXPONENT_PATTERN.exec(s)
  if (exp) {
    const [, sign, intPart = "", fracPart = "", exponent] = exp
    if (!intPart && !fracPart) return null
    return fromDigits(sign, intPart + fracPart, intPart.length + Number(exponent))
  }

  const match = NUMBER_PATTERN.exec(s)
  if (!match) return null
  const [, sign, intPart, fracPart] = match
  if (intPart === undefined && fracPart === undefined) return null
  const integer = (intPart ?? "").replace(/ /g, "")
  return fromDigits(sign, integer + (fracPart ?? ""), integer.length)
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
