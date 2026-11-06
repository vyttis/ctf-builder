import { describe, it, expect } from "vitest"
import {
  normalizeAnswer,
  normalizeAnswerLegacy,
  hashAnswer,
  verifyAnswer,
} from "@/lib/game/answer-hasher"

const TEXT = { type: "text" }
const NUMBER = { type: "number" }

describe("normalizeAnswer", () => {
  it("trims whitespace and lowercases", () => {
    expect(normalizeAnswer("  Nemunas  ")).toBe("nemunas")
  })

  it("folds Lithuanian diacritics and collapses inner whitespace", () => {
    expect(normalizeAnswer("Ąžuolas")).toBe("azuolas")
    expect(normalizeAnswer("  Šaltinį  ")).toBe("saltini")
    expect(normalizeAnswer("Kuršių   marios")).toBe("kursiu marios")
    expect(normalizeAnswer("ąčęėįšųūž")).toBe("aceeisuuz")
  })

  it("keeps the exact form for choices, numbers and old hashes", () => {
    expect(normalizeAnswerLegacy(" Ąžuolas ")).toBe("ąžuolas")
  })
})

describe("text answers (bcrypt path)", () => {
  it("verifies the exact answer", async () => {
    const hash = await hashAnswer("Nemunas", "text")
    expect(hash.startsWith("$2")).toBe(true)
    await expect(verifyAnswer("Nemunas", hash, TEXT)).resolves.toBe(true)
  })

  it("is case- and whitespace-insensitive", async () => {
    const hash = await hashAnswer("Nemunas", "text")
    await expect(verifyAnswer("  nemunas ", hash, TEXT)).resolves.toBe(true)
    await expect(verifyAnswer("NEMUNAS", hash, TEXT)).resolves.toBe(true)
  })

  it("rejects a wrong answer", async () => {
    const hash = await hashAnswer("Nemunas", "text")
    await expect(verifyAnswer("Neris", hash, TEXT)).resolves.toBe(false)
  })

  it("rejects the empty string against a real hash", async () => {
    const hash = await hashAnswer("42", "number")
    await expect(verifyAnswer("", hash, NUMBER)).resolves.toBe(false)
  })

  it("accepts answers typed without Lithuanian letters", async () => {
    const hash = await hashAnswer("Šaltinį", "text")
    await expect(verifyAnswer("saltini", hash, TEXT)).resolves.toBe(true)
    await expect(verifyAnswer("ŠALTINĮ", hash, TEXT)).resolves.toBe(true)
    await expect(verifyAnswer("šaltinis", hash, TEXT)).resolves.toBe(false)
  })

  it("still verifies text hashes created with the old accented form", async () => {
    const bcrypt = (await import("bcryptjs")).default
    const oldHash = await bcrypt.hash("šaltinį", 4)
    await expect(verifyAnswer("Šaltinį", oldHash, TEXT)).resolves.toBe(true)
    await expect(verifyAnswer("tiltas", oldHash, TEXT)).resolves.toBe(false)
  })

  it("treats a missing type as text", async () => {
    const hash = await hashAnswer("Šiauliai", null)
    await expect(verifyAnswer("siauliai", hash, {})).resolves.toBe(true)
  })

  it("random UUID hashes (needs_answer flow) are not solvable by known magic strings", async () => {
    const hash = await hashAnswer(crypto.randomUUID(), "text")
    await expect(verifyAnswer("placeholder", hash, TEXT)).resolves.toBe(false)
    await expect(verifyAnswer("__placeholder__", hash, TEXT)).resolves.toBe(false)
  })
})

describe("multiple-choice answers keep Lithuanian letters", () => {
  const options = ["kasti", "kąsti", "kosti"]
  const rules = { type: "multiple_choice", options }

  it("credits only the option that was marked correct", async () => {
    const hash = await hashAnswer("kąsti", "multiple_choice")
    await expect(verifyAnswer("kąsti", hash, rules)).resolves.toBe(true)
    await expect(verifyAnswer("kasti", hash, rules)).resolves.toBe(false)
  })

  it("does not credit the accented option when the plain one is correct", async () => {
    const hash = await hashAnswer("kasti", "multiple_choice")
    await expect(verifyAnswer("kasti", hash, rules)).resolves.toBe(true)
    await expect(verifyAnswer("kąsti", hash, rules)).resolves.toBe(false)
  })

  it("accepts a folded hash left from a text task only when options cannot collide", async () => {
    const textHash = await hashAnswer("Šaltinis", "text")
    const distinct = { type: "multiple_choice", options: ["Šaltinis", "Upė", "Ežeras"] }
    await expect(verifyAnswer("Šaltinis", textHash, distinct)).resolves.toBe(true)
    await expect(verifyAnswer("Upė", textHash, distinct)).resolves.toBe(false)
  })
})

describe("number answers", () => {
  it("compare the exact form", async () => {
    const hash = await hashAnswer("3.5", "number")
    await expect(verifyAnswer(" 3.5 ", hash, NUMBER)).resolves.toBe(true)
    await expect(verifyAnswer("35", hash, NUMBER)).resolves.toBe(false)
  })
})

describe("verifyAnswer (legacy plaintext path)", () => {
  it("matches legacy plaintext stored values", async () => {
    await expect(verifyAnswer("Nemunas", "nemunas", TEXT)).resolves.toBe(true)
  })

  it("rejects non-matching legacy values, including length mismatches", async () => {
    await expect(verifyAnswer("Neris", "nemunas", TEXT)).resolves.toBe(false)
    await expect(verifyAnswer("ne", "nemunas", TEXT)).resolves.toBe(false)
  })

  it("keeps choices exact on the plaintext path too", async () => {
    const rules = { type: "multiple_choice", options: ["kasti", "kąsti"] }
    await expect(verifyAnswer("kasti", "kąsti", rules)).resolves.toBe(false)
    await expect(verifyAnswer("kąsti", "kąsti", rules)).resolves.toBe(true)
  })
})
