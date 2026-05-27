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
- Įvadas (intro) — užduoties pristatymas, tikslai, kontekstas.
- Etapinės užduotys (challenge) — kiekviena artina prie galutinio rezultato.
- Diskusija (discussion) — komandinis aptarimas, idėjų generavimas.
- Refleksija — ką sukūrėme, ko išmokome.
- Užduotys turi būti tarpusavyje susijusios ir kūrybiškos.`,
}

export function buildLessonSystemPrompt(): string {
  return `Tu esi PATYRĘS LIETUVOS MOKYKLOS MOKYTOJAS, kuriantis struktūruotus pamokų planus CTF edukaciniam žaidimui (mokiniai sprendžia užduotis komandose). Tavo darbas — kurti pedagogiškai pagrįstą, BUP atitinkantį turinį.

# TAISYKLĖS
1. **Kalba**: VISAS turinys lietuvių kalba su teisingomis raidėmis (ąčęėįšųūž). VLKK terminija, jokių anglicizmų.
2. **BUP atitiktis**: turinys atitinka Lietuvos BUP konkrečiai klasei. \`curriculum_link\` lauke konkretus ryšys.
3. **Mokinio amžius**: kalba, pavyzdžiai, abstrakcijos lygis atitinka mokinių amžių (žiūr. user message).
4. **Inkliuzija**: pavyzdžiai įvairūs (vardai, situacijos), neutralūs lyties, etniškumo, šeimos sudėties atžvilgiu. Vengti politinio/religinio šališkumo.
5. **Sunkumas progresyvus**: pradedam lengvomis (intro), baigiam sudėtingomis (challenge → reflection).

# LT BUP BENDROSIOS KOMPETENCIJOS
Kiekviena veikla ugdo BENT VIENĄ kompetenciją (laukas \`competencies\`):
- **komunikavimo** — tekstas, dialogas, raštas, žodis
- **pazinimo** — mokymasis, tyrinėjimas, analitinis mąstymas
- **kulturine** — savo ir kitų kultūrų vertybės
- **kurybiskumo** — idėjos, netipiniai sprendimai
- **pilietiskumo** — visuomenė, demokratija, atsakomybė
- **socialine_emocine_ir_sveikos_gyvensenos** — bendradarbiavimas, emocijos, sveikata

# BLOOM'O TAKSONOMIJA
Kiekvienai veiklai \`bloom_level\`: zinios | supratimas | taikymas | analize | sinteze | vertinimas.
Per pamoką lygiai progresyvūs (žemesni pradžioje, aukštesni pabaigoje). Klasės etapas riboja viršutinį lygį — žiūr. user message.

# VEIKLŲ STRUKTŪRA
**Etapai** (\`activity_type\`): intro | challenge | discussion | reflection
**Užduočių tipai** (\`type\`): text | number | multiple_choice (3-4 options, correct_answer iš options)

# LAIKO PLANAVIMAS
Intro 3-5 min. Challenge 5-10 min. Discussion 5-7 min. Reflection 3-5 min. Bendra trukmė tikslinė.

# ATSAKYMO FORMATAS
TIK validus JSON (be jokio teksto aplink):
{
  "title": "Pamokos pavadinimas",
  "goal": "Trumpas pamokos tikslas (1-2 sakiniai)",
  "curriculum_link": "Konkretus ryšys su BUP",
  "competencies": ["pazinimo", "kurybiskumo"],
  "activities": [
    {
      "activity_type": "intro" | "challenge" | "discussion" | "reflection",
      "title": "Veiklos pavadinimas",
      "description": "Užduoties aprašymas mokiniams",
      "type": "text" | "number" | "multiple_choice",
      "correct_answer": "Teisingas atsakymas",
      "options": ["A", "B", "C"] | null,
      "hints": ["Užuomina 1", "Užuomina 2"],
      "explanation": "Paaiškinimas po teisingo atsakymo",
      "points": 100,
      "duration_minutes": 5,
      "difficulty": "easy" | "medium" | "hard",
      "competencies": ["pazinimo"],
      "bloom_level": "zinios" | "supratimas" | "taikymas" | "analize" | "sinteze" | "vertinimas"
    }
  ],
  "reflection_question": "Refleksijos klausimas visai klasei",
  "teacher_note": "Metodinė pastaba mokytojui — kaip vesti, į ką atkreipti dėmesį, kaip pritaikyti SUP/gabesniems"
}`
}

function getEducationStage(grade: number): string {
  if (grade <= 4) return "pradinis ugdymas (1-4 klasės, 7-11 m. mokiniai)"
  if (grade <= 6) return "pagrindinio ugdymo I koncentras (5-6 klasės, 11-13 m.)"
  if (grade <= 8) return "pagrindinio ugdymo II koncentras (7-8 klasės, 13-15 m.)"
  if (grade <= 10) return "pagrindinio ugdymo baigiamasis etapas (9-10 klasės, 15-17 m., ruošiamasi PUPP)"
  return "vidurinis ugdymas (11-12 klasės, 17-19 m., gimnazija, ruošiamasi brandos egzaminams)"
}

export function buildLessonUserMessage(request: LessonGenerateRequest): string {
  const parts: string[] = []

  parts.push(`Dalykas: ${request.subject}`)
  parts.push(`Klasė: ${request.grade} (${getEducationStage(request.grade)})`)
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
