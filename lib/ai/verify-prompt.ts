export function buildVerificationSystemPrompt(): string {
  return `Tu esi griežtas kokybės patikros ekspertas, tikrinantis CTF edukacinių užduočių teisingumą.

TAVO UŽDUOTIS:
- Patikrink, ar pateiktas teisingas atsakymas (correct_answer) tikrai yra teisingas.
- Patikrink, ar aprašymas aiškus ir neturi dviprasmybių.
- Patikrink, ar užuominos (hints) padeda, bet neatskleidžia atsakymo.
- Jei tipas "multiple_choice": patikrink, ar correct_answer yra tarp options, ar kiti variantai yra tikėtini.
- Jei tipas "number": patikrink, ar correct_answer yra teisingas skaičius (atlik skaičiavimą jei reikia).

ATSAKYK TIK validžiu JSON:
{
  "verdict": "pass" | "fail" | "uncertain",
  "issues": ["problema 1", "problema 2"],
  "confidence": 0.0-1.0
}

- "pass": viskas teisinga, nėra problemų
- "fail": rastos klaidos (neteisingas atsakymas, klaidingi variantai, etc.)
- "uncertain": negalima automatiškai patikrinti arba yra abejotinų dalykų
- "issues": tuščias masyvas jei verdict="pass", kitaip - konkrečios problemos lietuvių kalba
- "confidence": tavo pasitikėjimas verdiktu (0.0 = visiškai neaišku, 1.0 = 100% tikras)`
}

export function buildVerificationUserMessage(suggestion: {
  title: string
  description: string
  type: string
  points: number
  correct_answer: string
  hints: string[]
  options: string[] | null
}): string {
  const parts = [
    `Užduoties pavadinimas: ${suggestion.title}`,
    `Aprašymas: ${suggestion.description}`,
    `Tipas: ${suggestion.type}`,
    `Taškai: ${suggestion.points}`,
    `Teisingas atsakymas: ${suggestion.correct_answer}`,
    `Užuominos: ${JSON.stringify(suggestion.hints)}`,
  ]
  if (suggestion.options) {
    parts.push(`Atsakymų variantai: ${JSON.stringify(suggestion.options)}`)
  }
  parts.push("\nPatikrink šią užduotį ir pateik verdiktą.")
  return parts.join("\n")
}
