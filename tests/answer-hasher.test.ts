import { describe, it, expect } from "vitest"
import bcrypt from "bcryptjs"
import { canonicalNumber, legacyNumberSpellings } from "@/lib/game/number-answer"
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

describe("number answers by value", () => {
  it("reads the ways people write numbers", () => {
    expect(canonicalNumber("2,5")).toBe("2.5")
    expect(canonicalNumber(" 2.50 ")).toBe("2.5")
    expect(canonicalNumber("+5")).toBe("5")
    expect(canonicalNumber("07")).toBe("7")
    expect(canonicalNumber("1 000")).toBe("1000")
    expect(canonicalNumber("1\u00a0000")).toBe("1000")
    expect(canonicalNumber("12 345 678")).toBe("12345678")
    expect(canonicalNumber("1 000,25")).toBe("1000.25")
    expect(canonicalNumber("−3")).toBe("-3")
    expect(canonicalNumber(",5")).toBe("0.5")
    expect(canonicalNumber("-0")).toBe("0")
    expect(canonicalNumber("-0,00")).toBe("0")
    expect(canonicalNumber("100")).toBe("100")
    expect(canonicalNumber("3 m")).toBeNull()
    expect(canonicalNumber("1.2.3")).toBeNull()
    expect(canonicalNumber("")).toBeNull()
    expect(canonicalNumber("-")).toBeNull()
  })

  it("accepts spaces only between groups of three digits", () => {
    expect(canonicalNumber("1 2")).toBeNull()
    expect(canonicalNumber("10 00")).toBeNull()
    expect(canonicalNumber("1000 000")).toBeNull()
    expect(canonicalNumber("1  000")).toBeNull()
    expect(canonicalNumber("1 000 00")).toBeNull()
    expect(canonicalNumber("0,123 4")).toBeNull()
  })

  it("reads scientific notation by value", () => {
    expect(canonicalNumber("1e3")).toBe("1000")
    expect(canonicalNumber("1E3")).toBe("1000")
    expect(canonicalNumber("2,5e-2")).toBe("0.025")
    expect(canonicalNumber("1.5e-2")).toBe("0.015")
    expect(canonicalNumber("-12.5e1")).toBe("-125")
    expect(canonicalNumber(".5e1")).toBe("5")
    expect(canonicalNumber("0e5")).toBe("0")
    expect(canonicalNumber("1e100")).toBe("1" + "0".repeat(100))
    expect(canonicalNumber("e3")).toBeNull()
    expect(canonicalNumber("1e")).toBeNull()
    expect(canonicalNumber("1 000e3")).toBeNull()
  })

  it("keeps every digit of long and tiny numbers", () => {
    expect(canonicalNumber("9007199254740993")).toBe("9007199254740993")
    expect(canonicalNumber("9007199254740992")).toBe("9007199254740992")
    expect(canonicalNumber("1000000000000000000000")).toBe("1000000000000000000000")
    expect(canonicalNumber("0,000000000000000000000001")).toBe("0.000000000000000000000001")
    expect(canonicalNumber("0,1000")).toBe("0.1")
  })

  it("matches any form of the same number for new answers", async () => {
    const hash = await hashAnswer("2,50", "number")
    expect(hash.startsWith("$2")).toBe(true)
    expect(hash.endsWith(":num")).toBe(true)
    for (const typed of ["2.5", "2,5", "2.50", "+2.5", " 2.5 "]) {
      expect(await verifyAnswer(typed, hash, NUMBER)).toBe(true)
    }
    expect(await verifyAnswer("25", hash, NUMBER)).toBe(false)
    expect(await verifyAnswer("-2.5", hash, NUMBER)).toBe(false)
    expect(await verifyAnswer("2.5 m", hash, NUMBER)).toBe(false)
  })

  it("does not credit badly grouped digits", async () => {
    const twelve = await hashAnswer("12", "number")
    expect(await verifyAnswer("1 2", twelve, NUMBER)).toBe(false)
    const thousand = await hashAnswer("1000", "number")
    expect(await verifyAnswer("10 00", thousand, NUMBER)).toBe(false)
    expect(await verifyAnswer("1 000", thousand, NUMBER)).toBe(true)
  })

  it("does not credit a neighbouring large integer", async () => {
    const hash = await hashAnswer("9007199254740992", "number")
    expect(await verifyAnswer("9007199254740993", hash, NUMBER)).toBe(false)
  })

  it("tells apart long numbers that share their first 72 digits", async () => {
    const prefix = "1".repeat(72)
    const hash = await hashAnswer(prefix + "3", "number")
    expect(await verifyAnswer(prefix + "3", hash, NUMBER)).toBe(true)
    expect(await verifyAnswer(prefix + "4", hash, NUMBER)).toBe(false)
  })

  it("matches an answer stored in scientific notation", async () => {
    const hash = await hashAnswer("1e3", "number")
    expect(await verifyAnswer("1000", hash, NUMBER)).toBe(true)
    expect(await verifyAnswer("1 000", hash, NUMBER)).toBe(true)
  })

  it("lists the spellings a facilitator may have typed before", () => {
    expect(legacyNumberSpellings("2.5")).toEqual(["2.50", "2,50"])
    expect(legacyNumberSpellings("3")).toEqual(["3.0", "3,0", "3.00", "3,00"])
    expect(legacyNumberSpellings("-1000")).toEqual([
      "-1 000",
      "-1000.0",
      "-1000,0",
      "-1000.00",
      "-1000,00",
    ])
    expect(legacyNumberSpellings("12345.25")).toEqual(["12 345.25", "12 345,25"])
  })

  it("still matches older hashes made from the typed text", async () => {
    const old = (text: string) => bcrypt.hash(text, 4)
    expect(await verifyAnswer("2.5", await old("2,5"), NUMBER)).toBe(true)
    expect(await verifyAnswer("1 000", await old("1000"), NUMBER)).toBe(true)
    expect(await verifyAnswer("2.5", await old("2.50"), NUMBER)).toBe(true)
    expect(await verifyAnswer("2,5", await old("2,50"), NUMBER)).toBe(true)
    expect(await verifyAnswer("3", await old("3.0"), NUMBER)).toBe(true)
    expect(await verifyAnswer("3", await old("3,00"), NUMBER)).toBe(true)
    expect(await verifyAnswer("1000", await old("1 000"), NUMBER)).toBe(true)
    expect(await verifyAnswer("2,6", await old("2,50"), NUMBER)).toBe(false)
  })

  it("reads a legacy plaintext answer ending in :num as plaintext", async () => {
    expect(await verifyAnswer("column:num", "column:num", TEXT)).toBe(true)
  })

  it("keeps answers that are not numbers as typed", async () => {
    const hash = await hashAnswer("3 m", "number")
    expect(hash.endsWith(":num")).toBe(false)
    expect(await verifyAnswer("3 m", hash, NUMBER)).toBe(true)
  })

  it("reads a value hash the same way after the task changes type", async () => {
    const hash = await hashAnswer("5", "number")
    expect(await verifyAnswer("5", hash, TEXT)).toBe(true)
    expect(await verifyAnswer("penki", hash, TEXT)).toBe(false)
  })
})

describe("text answers with a stray full stop", () => {
  it("also forgives it against hashes made before diacritic folding", async () => {
    const old = await bcrypt.hash("šaltinis", 4)
    expect(await verifyAnswer("Šaltinis.", old, TEXT)).toBe(true)
    expect(await verifyAnswer("Šaltinis", old, TEXT)).toBe(true)
  })


  it("ignores punctuation added at the end", async () => {
    const hash = await hashAnswer("Šaltinis", "text")
    expect(await verifyAnswer("saltinis.", hash, { type: "text" })).toBe(true)
    expect(await verifyAnswer("Šaltinis!", hash, { type: "text" })).toBe(true)
  })

  it("still matches an answer that really ends with punctuation", async () => {
    const hash = await hashAnswer("Kodėl?", "text")
    expect(await verifyAnswer("kodel?", hash, { type: "text" })).toBe(true)
  })
})
