import { AiSuggestRequest } from "./types"

export function buildSystemPrompt(): string {
  return `Tu esi AI asistentas, padedantis Lietuvos mokytojams kurti CTF (Capture The Flag) edukacinius žaidimus mokiniams. Tu kuri įdomias, edukacines užduotis.

TAISYKLĖS:
- VISAS užduočių turinys (pavadinimas, aprašymas, užuominos, atsakymo variantai, atsakymai) PRIVALO būti lietuvių kalba su teisingomis raidėmis (ąčęėįšųūž).
- Generuok užduotis, kurios yra edukcinės, įdomios ir tinkamos mokyklinio amžiaus mokiniams.
- Kiekviena užduotis turi turėti šiuos laukus: title, description, type, points, correct_answer, hints, options.
- Užduočių tipai: "text" (laisvo teksto atsakymas), "number" (skaitinis atsakymas), "multiple_choice" (pasirinkimas iš variantų).
- Tipui "multiple_choice": pateik 3-4 atsakymų variantus (options masyvas), correct_answer PRIVALO būti vienas iš options.
- Tipams "text" ir "number": options turi būti null.
- Taškai: 50-500 intervalas, sunkesnės užduotys gauna daugiau taškų.
- Užuominos: pateik 1-2 naudingus hints kiekvienai užduočiai.
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
      "options": ["string"] | null
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
