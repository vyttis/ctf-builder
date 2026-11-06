import registry from "@/lib/data/schools.json"

/**
 * The general-education school registry (ŠVIS via data.gov.lt), refreshed
 * by the "Schools registry" workflow. Server-side only: the browser asks
 * /api/schools for a few matches instead of loading 900 schools.
 */
export interface School {
  code: string
  name: string
  municipality: string
  municipalityCode: number | null
  type: string
  subtype: string
  ownership: string
}

/** The registry writes "Ąžuolyno"; Lithuanian text uses „Ąžuolyno“. */
export function lithuanianQuotes(name: string): string {
  return name.replace(/"([^"]+)"/g, "„$1“")
}

const schools = (registry as { schools: School[] }).schools.map((s) => ({ ...s, name: lithuanianQuotes(s.name) }))

export const schoolsUpdatedAt = (registry as { updatedAt: string }).updatedAt

/** Lowercase without Lithuanian letters or quotes, for forgiving search. */
export function foldForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/["„“”'«»]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

const indexed = schools.map((s) => ({
  school: s,
  haystack: foldForSearch(`${s.name} ${s.municipality}`),
}))

export function findSchoolByCode(code: string): School | null {
  return schools.find((s) => s.code === code) ?? null
}

/**
 * Every word of the query must appear; names that start with the first
 * word rank first, then shorter names.
 */
export function searchSchools(query: string, limit = 15): School[] {
  const words = foldForSearch(query).split(" ").filter((w) => w.length > 0)
  if (words.length === 0) return []
  return indexed
    .filter((x) => words.every((w) => x.haystack.includes(w)))
    .sort((a, b) => {
      const aStarts = a.haystack.startsWith(words[0]) ? 0 : 1
      const bStarts = b.haystack.startsWith(words[0]) ? 0 : 1
      return aStarts - bStarts || a.school.name.length - b.school.name.length
    })
    .slice(0, limit)
    .map((x) => x.school)
}

export const MUNICIPALITIES: string[] = Array.from(new Set(schools.map((s) => s.municipality))).sort(
  (a, b) => a.localeCompare(b, "lt"),
)
