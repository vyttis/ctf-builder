import { describe, it, expect } from "vitest"
import { allRowsById } from "@/lib/supabase/all-pages"

type Row = { id: string }

/** A table read like PostgREST: order by id, ids after a cursor, a page limit. */
function table(rows: Row[], opts: { failOnPage?: number; onPage?: (page: number) => void } = {}) {
  let page = 0
  return () => {
    let selected = [...rows]
    const q = {
      order: () => {
        selected.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
        return q
      },
      gt: (_: string, value: string) => {
        selected = selected.filter((r) => r.id > value)
        return q
      },
      limit: (n: number) => {
        const current = page++
        opts.onPage?.(current)
        if (current === opts.failOnPage) return Promise.resolve({ data: null, error: { message: "unavailable" } })
        return Promise.resolve({ data: selected.slice(0, n), error: null })
      },
    }
    return q
  }
}

const ids = (n: number, prefix = "b") => Array.from({ length: n }, (_, i) => ({ id: `${prefix}${String(i).padStart(5, "0")}` }))

describe("allRowsById", () => {
  it("reads every row past the page size", async () => {
    const { data } = await allRowsById<Row>(table(ids(2500)), 1000)
    expect(data).toHaveLength(2500)
    expect(new Set(data!.map((r) => r.id)).size).toBe(2500)
  })

  it("neither repeats nor skips a row when rows arrive between pages", async () => {
    const rows = ids(2500)
    const { data } = await allRowsById<Row>(
      table(rows, {
        // A new answer lands before the second page is read.
        onPage: (page) => {
          if (page === 1) rows.push({ id: "a-new" }, { id: "z-new" })
        },
      }),
      1000,
    )
    const read = data!.map((r) => r.id)
    expect(new Set(read).size).toBe(read.length)
    for (const r of ids(2500)) expect(read).toContain(r.id)
  })

  it("returns no rows when a later page fails", async () => {
    const result = await allRowsById<Row>(table(ids(2500), { failOnPage: 1 }), 1000)
    expect(result.data).toBeNull()
    expect(result.error).toBeTruthy()
  })
})
