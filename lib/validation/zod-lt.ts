import * as z from "zod"

type Issue = Parameters<NonNullable<z.core.$ZodConfig["customError"]>>[0]

/**
 * Lithuanian messages for validation errors that have no message of their
 * own. Without this, zod's English defaults ("Too big: expected number to be
 * <=1000") reach facilitators in toasts. A message set on a schema still wins.
 */
export function lithuanianIssueMessage(issue: Issue): string | undefined {
  const origin = "origin" in issue ? String(issue.origin) : ""
  switch (issue.code) {
    case "too_big": {
      const max = String(issue.maximum)
      if (origin === "string") return `Ne daugiau kaip ${max} ženklų.`
      if (origin === "array" || origin === "set") return `Ne daugiau kaip ${max} elementų.`
      return `Didžiausia leistina reikšmė: ${max}.`
    }
    case "too_small": {
      const min = String(issue.minimum)
      if (origin === "string") return min === "1" ? "Šis laukas privalomas." : `Ne mažiau kaip ${min} ženklų.`
      if (origin === "array" || origin === "set") return `Reikia bent ${min}.`
      return `Mažiausia leistina reikšmė: ${min}.`
    }
    case "invalid_type": {
      if (issue.input === undefined || issue.input === null) return "Šis laukas privalomas."
      const expected = String(issue.expected)
      if (expected === "int") return "Įveskite sveikąjį skaičių."
      if (expected === "number") return "Įveskite skaičių."
      return "Neteisinga reikšmė."
    }
    case "invalid_format": {
      const format = String(issue.format)
      if (format === "url") return "Neteisingas adresas."
      if (format === "email") return "Neteisingas el. pašto adresas."
      if (format === "uuid" || format === "guid") return "Neteisingas identifikatorius."
      return "Neteisingas formatas."
    }
    case "invalid_value":
      return "Pasirinkite vieną iš galimų reikšmių."
    default:
      return "Neteisingi duomenys."
  }
}

let configured = false

/** Installs the Lithuanian messages once per runtime (server and browser). */
export function installLithuanianValidation(): void {
  if (configured) return
  configured = true
  z.config({ customError: lithuanianIssueMessage })
}
