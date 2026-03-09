export interface Subject {
  id: string
  label: string
  grades: number[]
  icon: string // lucide-react icon name
}

export const SUBJECTS: Subject[] = [
  {
    id: "matematika",
    label: "Matematika",
    grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    icon: "Calculator",
  },
  {
    id: "biologija",
    label: "Biologija",
    grades: [5, 6, 7, 8, 9, 10, 11, 12],
    icon: "Leaf",
  },
  {
    id: "geografija",
    label: "Geografija",
    grades: [5, 6, 7, 8, 9, 10, 11, 12],
    icon: "Globe",
  },
  {
    id: "istorija",
    label: "Istorija",
    grades: [5, 6, 7, 8, 9, 10, 11, 12],
    icon: "Landmark",
  },
  {
    id: "steam",
    label: "Integruotos STEAM veiklos",
    grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    icon: "Beaker",
  },
]

export const LESSON_TYPES = [
  { id: "nauja_tema", label: "Nauja tema" },
  { id: "kartojimas", label: "Kartojimas" },
  { id: "vertinimas", label: "Vertinimas" },
  { id: "projektine_veikla", label: "Projektinė veikla" },
] as const

export const DURATIONS = [
  { value: 25, label: "25 min" },
  { value: 35, label: "35 min" },
  { value: 45, label: "45 min" },
] as const

export function getSubjectById(id: string): Subject | undefined {
  return SUBJECTS.find((s) => s.id === id)
}

export function getGradesForSubject(subjectId: string): number[] {
  return getSubjectById(subjectId)?.grades ?? []
}
