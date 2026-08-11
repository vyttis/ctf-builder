import { describe, expect, it } from "vitest"
import { pluralizeLt } from "@/lib/utils"

const taskas = (n: number) => pluralizeLt(n, "taškas", "taškai", "taškų")
const komanda = (n: number) => pluralizeLt(n, "komanda", "komandos", "komandų")

describe("pluralizeLt", () => {
  it("uses singular for 1, 21, 31, 101", () => {
    for (const n of [1, 21, 31, 101]) {
      expect(taskas(n)).toBe("taškas")
      expect(komanda(n)).toBe("komanda")
    }
  })

  it("uses plural (few) for 2-9, 22-29", () => {
    for (const n of [2, 5, 9, 22, 29, 102]) {
      expect(taskas(n)).toBe("taškai")
      expect(komanda(n)).toBe("komandos")
    }
  })

  it("uses genitive plural (many) for 0, 10-20, 111-119", () => {
    for (const n of [0, 10, 11, 15, 19, 20, 30, 100, 111, 119]) {
      expect(taskas(n)).toBe("taškų")
      expect(komanda(n)).toBe("komandų")
    }
  })
})
