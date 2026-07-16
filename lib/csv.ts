// Client-side CSV export shared by teacher tables (reflections, results, stats).
// UTF-8 BOM keeps Lithuanian characters intact when opened in Excel.

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
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
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
