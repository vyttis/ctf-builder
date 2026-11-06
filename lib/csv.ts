// Client-side CSV export shared by teacher tables (reflections, results, stats).
// UTF-8 BOM keeps Lithuanian characters intact when opened in Excel, and the
// separator is ";" because Excel with Lithuanian regional settings uses the
// comma as the decimal mark and opens a comma-separated file as one column.

export const CSV_SEPARATOR = ";"

/** A file name part from free text: letters, digits and dashes only. */
export function csvFileSlug(text: string, max = 40): string {
  return (
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, max)
      .replace(/-+$/g, "") || "veikla"
  )
}

export function exportCsv(
  filename: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const BOM = "\uFEFF"
  const csvContent =
    BOM +
    [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${neutralizeFormula(String(cell)).replace(/"/g, '""')}"`).join(CSV_SEPARATOR)
      )
      .join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * A cell that starts with = + - @ (or a tab/carriage return) is run as a
 * formula by Excel. Names and school titles come from forms, so they are
 * prefixed with an apostrophe. Plain negative numbers stay numbers.
 */
export function neutralizeFormula(value: string): string {
  if (/^-?\d+([.,]\d+)?$/.test(value)) return value
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
}
