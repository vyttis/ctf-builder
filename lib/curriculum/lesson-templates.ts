// Pre-configured integrated STEAM lesson templates — shown on the lesson plans
// list so teachers can explore the two-subject feature with concrete, proven
// combinations instead of facing a blank form.

export interface LessonTemplate {
  id: string
  subject: string
  secondary_subject: string
  grade: number
  topic: string
  lesson_type: "nauja_tema" | "kartojimas" | "vertinimas" | "projektine_veikla"
  duration: 25 | 35 | 45
  learning_goal: string
  title: string
  description: string
  emoji: string
}

export const LESSON_TEMPLATES: LessonTemplate[] = [
  {
    id: "steam-math-bio",
    subject: "matematika",
    secondary_subject: "biologija",
    grade: 9,
    topic: "Populiacijos augimo matematiniai modeliai",
    lesson_type: "projektine_veikla",
    duration: 45,
    learning_goal:
      "Mokiniai taikys eksponentinį augimą realių populiacijų duomenims ir įvertins biologinius ribojimus.",
    title: "Matematika × Biologija",
    description: "Kaip eksponentinės funkcijos paaiškina bakterijų dauginimąsi.",
    emoji: "🧬",
  },
  {
    id: "steam-fiz-chem",
    subject: "fizika",
    secondary_subject: "chemija",
    grade: 10,
    topic: "Medžiagų būsenos ir šiluminiai reiškiniai",
    lesson_type: "nauja_tema",
    duration: 45,
    learning_goal:
      "Susieti medžiagos agregatinių būsenų pokyčius su šiluminiu energijos perdavimu.",
    title: "Fizika × Chemija",
    description: "Fazių virsmai iš fizikinės ir cheminės perspektyvų.",
    emoji: "⚗️",
  },
  {
    id: "steam-ist-geo",
    subject: "istorija",
    secondary_subject: "geografija",
    grade: 8,
    topic: "Lietuvos Didžiosios Kunigaikštystės teritorija ir geografinė aplinka",
    lesson_type: "nauja_tema",
    duration: 45,
    learning_goal:
      "Paaiškinti, kaip geografinės sąlygos lėmė LDK plėtrą ir gyvenimo būdą.",
    title: "Istorija × Geografija",
    description: "Kodėl LDK augo būtent šia kryptimi — geografijos lemtis.",
    emoji: "🗺️",
  },
]

export function getLessonTemplate(id: string): LessonTemplate | undefined {
  return LESSON_TEMPLATES.find((t) => t.id === id)
}
