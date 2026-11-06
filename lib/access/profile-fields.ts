import { z } from "zod"

/** Subjects a facilitator teaches, for statistics. Shown as chips. */
export const SUBJECTS = [
  "Pradinis ugdymas",
  "Lietuvių kalba ir literatūra",
  "Matematika",
  "Informatika",
  "Fizika",
  "Chemija",
  "Biologija",
  "Gamtos mokslai",
  "Geografija",
  "Istorija",
  "Pilietiškumas",
  "Ekonomika ir verslumas",
  "Užsienio kalba",
  "Technologijos",
  "Dailė",
  "Muzika",
  "Fizinis ugdymas",
  "Etika ar tikyba",
  "Ugdymas karjerai",
  "Neformalusis ugdymas",
  "Ikimokyklinis ugdymas",
  "Kita",
] as const

/** Class bands rather than single grades: easier to pick on a phone. */
export const GRADE_BANDS = ["1-4 kl.", "5-6 kl.", "7-8 kl.", "9-10 kl.", "11-12 kl.", "Kita"] as const

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `Įveskite ${label}`)
    .max(80, `${label[0].toUpperCase()}${label.slice(1)} per ilgas`)

export const schoolChoiceSchema = z.object({
  school_code: z.string().regex(/^\d{5,12}$/).nullable().optional(),
  school_name: z.string().trim().min(2, "Pasirinkite arba įrašykite mokyklą").max(200),
  municipality: z.string().trim().max(80).nullable().optional(),
})

/** What a teacher sends with an access request. */
export const accessRequestSchema = z
  .object({
    first_name: name("vardą"),
    last_name: name("pavardę"),
    email: z.string().trim().toLowerCase().email("Neteisingas el. pašto adresas").max(200),
    consent: z.literal(true, { message: "Reikia sutikimo tvarkyti duomenis" }),
    // Exactly one way in: the team's session (finish screen), the activity
    // QR token, or a request link token.
    game_code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{6}$/).optional(),
    session_token: z.string().min(10).max(100).optional(),
    activity_token: z.string().min(10).max(100).optional(),
    link_token: z.string().min(10).max(100).optional(),
  })
  .merge(schoolChoiceSchema)

/** What a facilitator fills in on first sign-in. */
export const onboardingSchema = z
  .object({
    first_name: name("vardą"),
    last_name: name("pavardę"),
    subjects: z.array(z.enum(SUBJECTS)).min(1, "Pasirinkite bent vieną dalyką").max(SUBJECTS.length),
    grades: z.array(z.enum(GRADE_BANDS)).min(1, "Pasirinkite bent vieną klasių grupę").max(GRADE_BANDS.length),
    consent: z.literal(true, { message: "Reikia sutikimo tvarkyti duomenis" }),
  })
  .merge(schoolChoiceSchema)

export const CONSENT_TEXT =
  "Sutinku, kad KU STEAM centras tvarkytų mano vardą, pavardę, el. paštą, mokyklą, dalykus ir klases veiklų organizavimo ir statistikos tikslais."
