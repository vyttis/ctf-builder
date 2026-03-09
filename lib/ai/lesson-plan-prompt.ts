/**
 * Lesson plan prompt logic — SEPARATE from student activity/game prompts.
 *
 * This generates pedagogically structured lesson plans for teachers.
 * The output is a planning document, NOT a game task list.
 */

export interface LessonPlanGenerateInput {
  subject: string
  grade: number
  topic: string
  lesson_type: string
  duration: number
  learning_goal?: string
  curriculum_context?: string
}

const LESSON_TYPE_INSTRUCTIONS: Record<string, string> = {
  nauja_tema: `PAMOKOS TIPAS: Nauja tema
- Pradėk nuo motyvacinio įvado (intro) — susidomėjimą kelianti veikla ar klausimas.
- Toliau eina pagrindinės mokymo veiklos (challenge) — nuo paprastesnių prie sudėtingesnių.
- Baik refleksija (reflection) — kas naujo išmokta.
- Taškų progresas: lengvesnės veiklos pradžioje (50-100), sunkesnės pabaigoje (150-300).`,

  kartojimas: `PAMOKOS TIPAS: Kartojimas
- Pradėk nuo apšilimo (intro) — greitas prisiminimas raktinių sąvokų.
- Pagrindinės veiklos (challenge) — įvairios veiklos, apimančios visą temą.
- Įtraukti bent vieną diskusinę veiklą (discussion).
- Baigti refleksija — ką dar reikia pakartoti.
- Taškų pasiskirstymas tolygus (100-200 kiekvienai).`,

  vertinimas: `PAMOKOS TIPAS: Vertinimas
- Trumpas pasirengimas (intro) — priminti taisykles ir motyvuoti.
- Vertinimo veiklos (challenge) — struktūruotos nuo lengvų prie sunkių.
- Naudok įvairius tipus: text, number, multiple_choice.
- Baigti trumpa refleksija — kaip sekėsi.
- Taškų progresas aiškus: easy=50-100, medium=150-200, hard=250-400.`,

  projektine_veikla: `PAMOKOS TIPAS: Projektinė veikla
- Įvadas (intro) — veiklos pristatymas, tikslai, kontekstas.
- Etapinės veiklos (challenge) — kiekviena artina prie galutinio rezultato.
- Diskusija (discussion) — komandinis aptarimas, idėjų generavimas.
- Refleksija — ką sukūrėme, ko išmokome.
- Veiklos turi būti tarpusavyje susijusios ir kūrybiškos.`,
}

export function buildLessonPlanSystemPrompt(): string {
  return `Tu esi patyręs Lietuvos mokyklos mokytojas ir pamokų planuotojas. Tu kuri struktūruotus pamokos planus, pritaikytus Lietuvos ugdymo programai.

KONTEKSTAS:
- Tu kuri PAMOKOS PLANĄ — mokytojo planavimo dokumentą.
- Tai NE žaidimo užduočių sąrašas. Tai metodiškai struktūruota pamokos eiga.
- Mokytojas naudos šį planą pamokos vedimui klasėje.

TAISYKLĖS:
- VISAS turinys PRIVALO būti lietuvių kalba su teisingomis raidėmis (ąčęėįšųūž).
- Pamoka turi būti pritaikyta nurodytai klasei ir dalykui.
- Turinys turi atitikti Lietuvos bendrojo ugdymo programą.
- Kiekviena veikla turi aiškų edukacinį tikslą.
- Veiklos turi būti įdomios ir interaktyvios.
- Sunkumas turi progresyviai didėti per pamoką.
- Kiekviena veikla turi turėti teisingą atsakymą, užuominas ir paaiškinimą.

VEIKLŲ ETAPAI:
- "intro" — motyvacinis įvadas, susidomėjimo kėlimas
- "challenge" — pagrindinė mokymo/tikrinimo veikla
- "discussion" — diskusinė, atviresnio pobūdžio veikla
- "reflection" — refleksija, apibendrinimas

VEIKLŲ TIPAI (type laukas):
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
  "stages": [
    {
      "activity_type": "intro" | "challenge" | "discussion" | "reflection",
      "title": "Veiklos pavadinimas",
      "description": "Veiklos aprašymas mokiniams",
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
  "reflection_prompt": "Refleksijos klausimas visai klasei",
  "teacher_methodical_note": "Metodinė pastaba mokytojui — patarimai, kaip vesti pamoką, į ką atkreipti dėmesį"
}`
}

export function buildLessonPlanUserMessage(input: LessonPlanGenerateInput): string {
  const parts: string[] = []

  parts.push(`Dalykas: ${input.subject}`)
  parts.push(`Klasė: ${input.grade}`)
  parts.push(`Tema: ${input.topic}`)
  parts.push(`Pamokos trukmė: ${input.duration} minučių`)

  const typeInstructions = LESSON_TYPE_INSTRUCTIONS[input.lesson_type]
  if (typeInstructions) {
    parts.push(`\n${typeInstructions}`)
  }

  if (input.learning_goal) {
    parts.push(`\nMokytojo nurodytas tikslas: ${input.learning_goal}`)
  }

  if (input.curriculum_context) {
    parts.push(`\nProgramos kontekstas:\n${input.curriculum_context}`)
  }

  const targetStages = input.duration <= 25 ? 4 : input.duration <= 35 ? 5 : 7
  parts.push(`\nSugeneruok pamokos planą su maždaug ${targetStages} veiklomis. Bendra veiklų trukmė turi tilpti į ${input.duration} minučių.`)

  return parts.join("\n")
}
