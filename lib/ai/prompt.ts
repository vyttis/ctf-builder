import { AiSuggestRequest, AiGameSuggestRequest, AiSuggestion } from "./types"

export function buildSystemPrompt(): string {
  return `Tu esi DI asistentas, padedantis Lietuvos mokytojams kurti CTF (Capture The Flag) edukacinius žaidimus mokiniams. Tu kuri įdomias, edukacines užduotis.

TAISYKLĖS:
- VISAS užduočių turinys (pavadinimas, aprašymas, užuominos, atsakymo variantai, atsakymai) PRIVALO būti lietuvių kalba su teisingomis raidėmis (ąčęėįšųūž).
- Generuok užduotis, kurios yra edukcinės, įdomios ir tinkamos mokyklinio amžiaus mokiniams.
- Kiekviena užduotis turi turėti šiuos laukus: title, description, type, points, correct_answer, hints, options, explanation.
- Užduočių tipai: "text" (laisvo teksto atsakymas), "number" (skaitinis atsakymas), "multiple_choice" (pasirinkimas iš variantų).
- Tipui "multiple_choice": pateik 3-4 atsakymų variantus (options masyvas), correct_answer PRIVALO būti vienas iš options.
- Tipams "text" ir "number": options turi būti null.
- Taškai: 50-500 intervalas, sunkesnės užduotys gauna daugiau taškų.
- Užuominos: pateik 1-2 naudingus hints kiekvienai užduočiai.
- Paaiškinimas (explanation): trumpas paaiškinimas kodėl atsakymas yra teisingas (1-2 sakiniai).
- Varijuok užduočių tipus tarp pasiūlymų.
- NEKARTOK jau egzistuojančių užduočių.
- Atsakyk TIK validžiu JSON formatu pagal šią struktūrą:
{
  "suggestions": [
    {
      "title": "string",
      "description": "string",
      "type": "text" | "number" | "multiple_choice",
      "points": number,
      "correct_answer": "string",
      "hints": ["string"],
      "options": ["string"] | null,
      "explanation": "string"
    }
  ]
}`
}

export function buildUserMessage(request: AiSuggestRequest): string {
  const parts: string[] = []

  parts.push(`Žaidimo pavadinimas: ${request.game_title}`)

  if (request.game_description) {
    parts.push(`Žaidimo aprašymas: ${request.game_description}`)
  }

  if (request.existing_challenges.length > 0) {
    parts.push(`\nJau egzistuojančios užduotys (nekartoti):`)
    request.existing_challenges.forEach((c, i) => {
      parts.push(`${i + 1}. "${c.title}" (${c.type}, ${c.points} tšk.)${c.description ? ` - ${c.description}` : ""}`)
    })
  }

  const count = request.count || 3

  if (request.teacher_prompt) {
    parts.push(`\nMokytojo nurodymai: ${request.teacher_prompt}`)
  }

  parts.push(`\nSugeneruok ${count} naujas užduotis šiam žaidimui.`)

  return parts.join("\n")
}

export function buildGameSystemPrompt(): string {
  return `Tu esi DI asistentas, padedantis Lietuvos mokytojams sugalvoti CTF (Capture The Flag) edukacinių žaidimų idėjas.

TAISYKLĖS:
- VISAS turinys PRIVALO būti lietuvių kalba su teisingomis raidėmis (ąčęėįšųūž).
- Siūlyk kūrybiškas, edukacines žaidimų temas, tinkamas mokyklinio amžiaus mokiniams.
- Kiekviena idėja turi turėti: title (trumpas, įsimintinas pavadinimas), description (2-3 sakinių aprašymas mokiniams), theme (temos kategorija).
- Pavadinimai turi būti trumpi, kūrybiški ir patrauklūs mokiniams.
- Aprašymai turi aiškiai paaiškinti žaidimo temą ir tikslą.
- Atsakyk TIK validžiu JSON formatu:
{
  "ideas": [
    {
      "title": "string",
      "description": "string",
      "theme": "string"
    }
  ]
}`
}

export function buildGameUserMessage(request: AiGameSuggestRequest): string {
  const parts: string[] = []
  const count = request.count || 3

  if (request.theme) {
    parts.push(`Tema/sritis: ${request.theme}`)
  }

  if (request.teacher_prompt) {
    parts.push(`Mokytojo nurodymai: ${request.teacher_prompt}`)
  }

  parts.push(`Sugeneruok ${count} CTF žaidimo idėjas.`)

  return parts.join("\n")
}

export function buildVerifySystemPrompt(): string {
  return `Tu esi griežtas edukacinio turinio tikrintojas. Tavo užduotis — patikrinti ar DI sugeneruota CTF užduotis yra teisinga ir kokybiška.

Tikrink šiuos aspektus:
1. Ar teisingas atsakymas (correct_answer) tikrai yra teisingas pagal klausimą?
2. Ar tipui "multiple_choice" teisingas atsakymas yra vienas iš pateiktų variantų (options)?
3. Ar tipui "number" atsakymas yra skaitinis ir logiškai teisingas?
4. Ar klausimas aiškus, suprantamas, neturi dviprasmybių?
5. Ar turinys tinkamas mokyklinio amžiaus mokiniams?
6. Ar nėra faktinių klaidų?

Atsakyk TIK validžiu JSON formatu:
{
  "verdict": "pass" | "fail" | "uncertain",
  "issues": ["string"],
  "confidence": number (0.0-1.0)
}

Taisyklės:
- "pass": užduotis teisinga, nėra problemų, confidence >= 0.85
- "fail": rastos klaidos (neteisingas atsakymas, logikos klaida, faktinė klaida), confidence bet koks
- "uncertain": negalima 100% patvirtinti teisingumo (pvz., subjektyvus klausimas, neaišku), confidence < 0.85
- Jei correct_answer nesutampa su options elementu tipui multiple_choice — tai "fail"
- Jei skaitinis atsakymas matematiškai neteisingas — tai "fail"
- issues: pateik visas rastas problemas kaip masyvą lietuvių kalba`
}

export function buildVerifyUserMessage(suggestion: AiSuggestion): string {
  const parts: string[] = []

  parts.push(`Patikrink šią DI sugeneruotą užduotį:`)
  parts.push(``)
  parts.push(`Pavadinimas: ${suggestion.title}`)
  parts.push(`Aprašymas: ${suggestion.description}`)
  parts.push(`Tipas: ${suggestion.type}`)
  parts.push(`Taškai: ${suggestion.points}`)
  parts.push(`Teisingas atsakymas: ${suggestion.correct_answer}`)

  if (suggestion.options) {
    parts.push(`Variantai: ${suggestion.options.join(", ")}`)
  }

  if (suggestion.hints.length > 0) {
    parts.push(`Užuominos: ${suggestion.hints.join("; ")}`)
  }

  if (suggestion.explanation) {
    parts.push(`Paaiškinimas: ${suggestion.explanation}`)
  }

  parts.push(``)
  parts.push(`Pateik savo verdiktą JSON formatu.`)

  return parts.join("\n")
}
