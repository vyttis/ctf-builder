import { describe, it, expect } from "vitest"
import {
  generateGameCode,
  generateSessionToken,
} from "@/lib/game/code-generator"

describe("generateGameCode", () => {
  it("produces 6-character codes from the unambiguous alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateGameCode()
      expect(code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/)
    }
  })

  it("never contains ambiguous characters (O, 0, I, 1, L)", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateGameCode()).not.toMatch(/[O0I1L]/)
    }
  })

  it("matches the DB game_code_format constraint from migration 00018", () => {
    for (let i = 0; i < 50; i++) {
      expect(generateGameCode()).toMatch(/^[A-Za-z0-9_-]{6,12}$/)
    }
  })

  it("codes are effectively unique", () => {
    const codes = new Set(Array.from({ length: 1000 }, generateGameCode))
    expect(codes.size).toBe(1000)
  })
})

describe("generateSessionToken", () => {
  it("produces 32-character lowercase alphanumeric tokens", () => {
    for (let i = 0; i < 100; i++) {
      expect(generateSessionToken()).toMatch(/^[a-z0-9]{32}$/)
    }
  })

  it("tokens are unique", () => {
    const tokens = new Set(Array.from({ length: 1000 }, generateSessionToken))
    expect(tokens.size).toBe(1000)
  })
})
