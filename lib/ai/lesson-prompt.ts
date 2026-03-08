import type { LessonGenerateRequest } from "./lesson-types"

const LESSON_TYPE_INSTRUCTIONS: Record<string, string> = {
  nauja_tema: `PAMOKOS TIPAS: Nauja tema
- Pradėk nuo motyvacinio įvado (intro) — susidomėjimą kelianti užduotis ar klausimas.
- Toliau eina pagrindinės mokymo veiklos (challenge) — nuo paprastesnių prie sudėtingesnių.
- Baikite refleksija (reflection) — kas naujo išmokta.
- Taškų progresas: lengvesnės užduotys pradžioje (50-100), sunkesnės pabaigoje (150-300).`,

  kartojimas: `PAMOKOS TIPAS: Kartojimas
- Pradėk nuo apšilimo (intro) — greitas prisiminimas raktinių sąvokų.
- Pagrindinės veiklos (challenge) — įvairios užduotys, apimančios visą temą.
- Įtraukti bent vieną diskusinę veiklą (discussion).
- Baigti refleksija — ką dar reikia pakartoti.
- Taškų pasiskirstymas tolygus (100-200 kiekvienai).`,

  vertinimas: `PAMOKOS TIPAS: Vertinimas
- Trumpas pasirengimas (intro) — priminti taisykles ir motyvuoti.
- Vertinimo užduotys (challenge) — struktūruotos nuo lengvų prie sunkių.
- Naudok įvairius tipus: text, number, multiple_choice.
- Baigti trumpa refleksija — kaip sekėsi.
- Taškų progresas aiškus: easy=50-100, medium=150-200, hard=250-400.`,

  projektine_veikla: `PAMOKOS TIPAS: Projektinė veikla
- Įvadas (intro) — užduoties pristaymas, tikslai, kontekstas.
- Etapinės užduotys (challenge) — kiekviena artina prie galutinio rezultato.
- Diskusija (discussion) — komandinis aptarimas, idėjų generavimas.
- Refleksija — ką sukūrėme, ko išmokome.
- Užduotys turi būti tarpusavyje susijusios ir kūrybiškos.`,
}

export function buildLessonSystemPrompt(): string {
  return `Tu esi patyręs Lietuvos mokyklos mokytojas ir pamokų planuotojas. Tu kuri struktūruotus pamokos planus CTF (Capture The Flag) edukaciniam žaidimui.

TAISYKLĖS:
- VISAS turinys PRIVALO būti lietuvių kalba su teisingomis raidėmis (ąčęėįšųūž).
- Pamoka turi būti pritaikyta nurodytai klasei ir dalykui.
- Turinys turi atitikti Lietuvos bendrojo ugdymo programą.
- Kiekviena veikla turi aiškų edukacinį tikslą.
- Užduotys turi būti įdomios ir interaktyvios — ne tik sausas žinių tikrinimas.
- Sunkumas turi progresyviai didėti per pamoką.
- Kiekviena veikla turi turėti teisingą atsakymą, užuominas ir paaiškinimą.

VEIKLŲ TIPAI:
- "intro" — motyvacinis įvadas, susidomėjimo kėlimas
- "challenge" — pagrindinė mokymo/tikrinimo užduotis
- "discussion" — diskusinė, atviresnio pobūdžio užduotis
- "reflection" — refleksija, apibendrinimas

UŽDUOČIŲ TIPAI (type laukas):
- "text" — laisvo teksto atsakymas
- "number" — skaitinis atsakymas
- "multiple_choice" — pasirinkimas iš variantų (pateik 3-4 options, correct_answer PRIVALO būti vienas iš jų)

LAIKO PLANAVIMAS:
- Paskirstyk minutes realstiškai tarp veiklų.
- Intro: 3-5 min. Challenge: 5-10 min kiekvienas. Discussion: 5-7 min. Reflection: 3-5 min.
- Bendra trukmė turi atitikti nurodytą pamokos trukmę.

ATSAKYK TIK validžiu JSON formatu pagal šią struktūrą:
{
  "title": "Pamokos pavadinimas",
  "goal": "Trumpas pamokos tikslas (1-2 sakiniai)",
  "curriculum_link": "Ryšys su ugdymo programa",
  "activities": [
    {
      "activity_type": "intro" | "challenge" | "discussion" | "reflection",
      "title": "Veiklos pavadinimas",
      "description": "Užduoties aprašymas mokiniams",
      "type": "text" | "number" | "multiple_choice",
      "correct_answer": "Teisingas atsakymas",
      "options": ["Variantas A", "Variantas B", "Variantas C"] | null,
      "hints": ["Užuomina 1", "Užuomina 2"],
      "explanation": "Edukacinis paaiškinimas po teisingo atsakymo",
      "points": 100,
      "duration_minutes": 5,
      "difficulty": "easy" | "medium" | "hard"
    }
  ],
  "reflection_question": "Refleksijos klausimas visai klasei",
  "teacher_note": "Metodinė pastaba mokytojui"
}`
}

export function buildLessonUserMessage(request: LessonGenerateRequest): string {
  const parts: string[] = []

  parts.push(`Dalykas: ${request.subject}`)
  parts.push(`Klasė: ${request.grade}`)
  parts.push(`Tema: ${request.topic}`)
  parts.push(`Pamokos trukmė: ${request.duration} minučių`)

  const typeInstructions = LESSON_TYPE_INSTRUCTIONS[request.lesson_type]
  if (typeInstructions) {
    parts.push(`\n${typeInstructions}`)
  }

  if (request.learning_goal) {
    parts.push(`\nMokytojo nurodytas tikslas: ${request.learning_goal}`)
  }

  if (request.curriculum_context) {
    parts.push(`\nProgramos kontekstas:\n${request.curriculum_context}`)
  }

  if (request.existing_challenges.length > 0) {
    parts.push(`\nŽaidime jau yra šios užduotys (nekartoti):`)
    request.existing_challenges.forEach((c, i) => {
      parts.push(`${i + 1}. "${c.title}" (${c.type}, ${c.points} tšk.)`)
    })
  }

  // Calculate target activity count based on duration
  const targetActivities = request.duration <= 25 ? 4 : request.duration <= 35 ? 5 : 7
  parts.push(`\nSugeneruok pamokos planą su maždaug ${targetActivities} veiklomis. Bendra veiklų trukmė turi tilpti į ${request.duration} minučių.`)

  return parts.join("\n")
}
