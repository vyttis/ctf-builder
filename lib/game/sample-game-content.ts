// Ready-made demo game seeded via POST /api/games/sample so a brand-new
// teacher can experience the full loop (start -> QR -> solve -> results)
// in a couple of minutes. Answers are real (unlike library clones).

export const SAMPLE_GAME = {
  title: "Pavyzdinė veikla: išbandykite!",
  description:
    "Trumpa demonstracinė veikla su trimis skirtingų tipų užduotimis. Pradėkite veiklą, nuskaitykite QR kodą telefonu ir išbandykite, ką mato dalyvis.",
  settings: {
    max_teams: 50,
    time_limit_minutes: null,
    show_leaderboard: true,
    shuffle_challenges: false,
  },
}

export interface SampleChallenge {
  title: string
  description: string
  type: "text" | "number" | "multiple_choice"
  points: number
  correct_answer: string
  hints: string[]
  options: string[] | null
  explanation: string
  difficulty: "easy" | "medium" | "hard"
  order_index: number
}

export const SAMPLE_CHALLENGES: SampleChallenge[] = [
  {
    title: "Lietuvos geografija",
    description: "Kokia yra ilgiausia Lietuvos upė?",
    type: "text",
    points: 100,
    correct_answer: "Nemunas",
    hints: [
      "Ji teka pro Kauną.",
      "Ji įteka į Kuršių marias.",
    ],
    options: null,
    explanation:
      "Nemunas yra ilgiausia Lietuvos upė (937 km, iš jų 359 km Lietuvoje). Jis įteka į Kuršių marias.",
    difficulty: "easy",
    order_index: 0,
  },
  {
    title: "Matematikos iššūkis",
    description:
      "Kiek kojų iš viso turi trys vorai ir dvi skruzdėlės? (Voras turi 8 kojas, skruzdėlė 6.)",
    type: "number",
    points: 150,
    correct_answer: "36",
    hints: ["Suskaičiuokite vorų ir skruzdėlių kojas atskirai, tada sudėkite."],
    options: null,
    explanation: "3 vorai × 8 kojos = 24, 2 skruzdėlės × 6 kojos = 12. Iš viso 24 + 12 = 36.",
    difficulty: "medium",
    order_index: 1,
  },
  {
    title: "Fotosintezė",
    description: "Kokias dujas augalai išskiria fotosintezės metu?",
    type: "multiple_choice",
    points: 100,
    correct_answer: "Deguonį",
    hints: ["Šios dujos būtinos žmonėms kvėpuoti."],
    options: ["Deguonį", "Anglies dioksidą", "Azotą", "Vandenilį"],
    explanation:
      "Fotosintezės metu augalai naudoja anglies dioksidą ir vandenį, o išskiria deguonį. Juo mes kvėpuojame.",
    difficulty: "easy",
    order_index: 2,
  },
]
