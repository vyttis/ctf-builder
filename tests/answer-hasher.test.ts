import { describe, it, expect } from "vitest"
import {
  normalizeAnswer,
  normalizeAnswerLegacy,
  hashAnswer,
  verifyAnswer,
} from "@/lib/game/answer-hasher"

describe("normalizeAnswer", () => {
  it("trims whitespace and lowercases", () => {
    expect(normalizeAnswer("  Nemunas  ")).toBe("nemunas")
  })

  it("folds Lithuanian diacritics and collapses inner whitespace", () => {
    expect(normalizeAnswer("Ąžuolas")).toBe("azuolas")
    expect(normalizeAnswer("  Šaltinį  ")).toBe("saltini")
    expect(normalizeAnswer("Kuršių   marios")).toBe("kursiu marios")
  })

  it("keeps the legacy form for old hashes", () => {
    expect(normalizeAnswerLegacy(" Ąžuolas ")).toBe("ąžuolas")
  })
})

describe("hashAnswer + verifyAnswer (bcrypt path)", () => {
  it("verifies the exact answer", async () => {
    const hash = await hashAnswer("Nemunas")
    expect(hash.startsWith("$2")).toBe(true)
    await expect(verifyAnswer("Nemunas", hash)).resolves.toBe(true)
  })

  it("is case- and whitespace-insensitive", async () => {
    const hash = await hashAnswer("Nemunas")
    await expect(verifyAnswer("  nemunas ", hash)).resolves.toBe(true)
    await expect(verifyAnswer("NEMUNAS", hash)).resolves.toBe(true)
  })

  it("rejects a wrong answer", async () => {
    const hash = await hashAnswer("Nemunas")
    await expect(verifyAnswer("Neris", hash)).resolves.toBe(false)
  })

  it("rejects the empty string against a real hash", async () => {
    const hash = await hashAnswer("42")
    await expect(verifyAnswer("", hash)).resolves.toBe(false)
  })

  it("accepts answers typed without Lithuanian letters", async () => {
    const hash = await hashAnswer("Šaltinį")
    await expect(verifyAnswer("saltini", hash)).resolves.toBe(true)
    await expect(verifyAnswer("ŠALTINĮ", hash)).resolves.toBe(true)
    await expect(verifyAnswer("šaltinis", hash)).resolves.toBe(false)
  })

  it("still verifies hashes created with the legacy accented form", async () => {
    const bcrypt = (await import("bcryptjs")).default
    const oldHash = await bcrypt.hash("šaltinį", 4)
    await expect(verifyAnswer("Šaltinį", oldHash)).resolves.toBe(true)
    await expect(verifyAnswer("tiltas", oldHash)).resolves.toBe(false)
  })

  it("handles Lithuanian characters end to end", async () => {
    const hash = await hashAnswer("Šiauliai")
    await expect(verifyAnswer("šiauliai", hash)).resolves.toBe(true)
  })

  it("random UUID hashes (needs_answer flow) are not solvable by known magic strings", async () => {
    const hash = await hashAnswer(crypto.randomUUID())
    await expect(verifyAnswer("placeholder", hash)).resolves.toBe(false)
    await expect(verifyAnswer("__placeholder__", hash)).resolves.toBe(false)
  })
})

describe("verifyAnswer (legacy plaintext path)", () => {
  it("matches legacy plaintext stored values", async () => {
    await expect(verifyAnswer("Nemunas", "nemunas")).resolves.toBe(true)
  })

  it("rejects non-matching legacy values, including length mismatches", async () => {
    await expect(verifyAnswer("Neris", "nemunas")).resolves.toBe(false)
    await expect(verifyAnswer("ne", "nemunas")).resolves.toBe(false)
  })
})
