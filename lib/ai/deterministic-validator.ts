import { AiSuggestion, VerificationResult } from "./types"

/**
 * Rule-based deterministic validator for DI-generated tasks.
 * Runs BEFORE LLM verification to catch obvious errors.
 * Returns null if rules cannot determine validity (falls back to LLM).
 */
export function validateDeterministic(
  suggestion: AiSuggestion
): VerificationResult | null {
  const issues: string[] = []

  // Rule 1: multiple_choice must have correct_answer in options
  if (suggestion.type === "multiple_choice") {
    if (!suggestion.options || suggestion.options.length < 2) {
      return {
        verdict: "fail",
        issues: ["Pasirinkimo užduotis turi turėti bent 2 variantus"],
        confidence: 1.0,
      }
    }

    const normalizedAnswer = suggestion.correct_answer.trim().toLowerCase()
    const normalizedOptions = suggestion.options.map((o) =>
      o.trim().toLowerCase()
    )

    if (!normalizedOptions.includes(normalizedAnswer)) {
      return {
        verdict: "fail",
        issues: [
          `Teisingas atsakymas "${suggestion.correct_answer}" nėra tarp pateiktų variantų`,
        ],
        confidence: 1.0,
      }
    }
  }

  // Rule 2: number type should have numeric correct_answer
  if (suggestion.type === "number") {
    const numericValue = Number(suggestion.correct_answer)
    if (isNaN(numericValue)) {
      return {
        verdict: "fail",
        issues: [
          `Skaičiaus tipo užduoties atsakymas "${suggestion.correct_answer}" nėra skaičius`,
        ],
        confidence: 1.0,
      }
    }

    // Try to detect simple arithmetic in the description
    const arithmeticResult = tryEvaluateArithmetic(suggestion.description)
    if (arithmeticResult !== null) {
      if (Math.abs(arithmeticResult - numericValue) > 0.001) {
        return {
          verdict: "fail",
          issues: [
            `Aritmetinis rezultatas turėtų būti ${arithmeticResult}, bet nurodytas ${suggestion.correct_answer}`,
          ],
          confidence: 0.95,
        }
      }
      // Arithmetic matches — deterministic pass
      return {
        verdict: "pass",
        issues: [],
        confidence: 0.95,
      }
    }
  }

  // Rule 3: title and description must not be empty
  if (!suggestion.title.trim()) {
    issues.push("Pavadinimas tuščias")
  }
  if (!suggestion.description.trim()) {
    issues.push("Aprašymas tuščias")
  }

  // Rule 4: points must be in valid range
  if (suggestion.points < 1 || suggestion.points > 1000) {
    issues.push(
      `Taškų skaičius ${suggestion.points} nepatenka į 1-1000 intervalą`
    )
  }

  // Rule 5: correct_answer must not be empty
  if (!suggestion.correct_answer.trim()) {
    issues.push("Teisingas atsakymas tuščias")
  }

  if (issues.length > 0) {
    return {
      verdict: "fail",
      issues,
      confidence: 1.0,
    }
  }

  // Cannot determine — fallback to LLM
  return null
}

/**
 * Try to detect and evaluate simple arithmetic expressions in text.
 * Returns the computed result, or null if no arithmetic detected.
 */
function tryEvaluateArithmetic(text: string): number | null {
  // Match patterns like "2 + 3", "Kiek yra 15 * 4?"
  const patterns = [
    /(\d+(?:\.\d+)?)\s*([+\-*/×÷])\s*(\d+(?:\.\d+)?)/,
    /(\d+(?:\.\d+)?)\s*plius\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*minus\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*daugyba\s*iš\s*(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s*dalyba\s*iš\s*(\d+(?:\.\d+)?)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      if (match.length === 4) {
        const a = parseFloat(match[1])
        const op = match[2]
        const b = parseFloat(match[3])
        return compute(a, op, b)
      }
      if (match.length === 3) {
        const a = parseFloat(match[1])
        const b = parseFloat(match[2])
        if (pattern.source.includes("plius")) return a + b
        if (pattern.source.includes("minus")) return a - b
        if (pattern.source.includes("daugyba")) return a * b
        if (pattern.source.includes("dalyba") && b !== 0) return a / b
      }
    }
  }

  return null
}

function compute(a: number, op: string, b: number): number | null {
  switch (op) {
    case "+":
      return a + b
    case "-":
    case "−":
      return a - b
    case "*":
    case "×":
      return a * b
    case "/":
    case "÷":
      return b !== 0 ? a / b : null
    default:
      return null
  }
}
