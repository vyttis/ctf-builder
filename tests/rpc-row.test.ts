import { describe, expect, it } from "vitest"
import { rpcRow } from "@/lib/supabase/rpc-row"

describe("rpcRow", () => {
  it("reads a table-type RPC result as an object or a one-element array", () => {
    expect(rpcRow<{ id: number }>({ id: 1 })).toEqual({ id: 1 })
    expect(rpcRow<{ id: number }>([{ id: 2 }])).toEqual({ id: 2 })
    expect(rpcRow([])).toBeNull()
    expect(rpcRow(null)).toBeNull()
  })
})
