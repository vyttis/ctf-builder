import bcrypt from "bcryptjs"
import { describe, expect, it } from "vitest"
import { hashAcceptedAnswer, verifyAcceptedAnswers } from "@/lib/game/answer-hasher"
import { acceptedAnswersSchema, prepareAcceptedAnswers } from "@/lib/game/accepted-answers"

describe("extra accepted answers", () => {
  it("accepts any of them the way a main text answer is accepted", async () => {
    const hashes = await Promise.all(["Vilnius", "Vilniaus miestas"].map((a) => hashAcceptedAnswer(a, "text")))
    expect(await verifyAcceptedAnswers("vilniaus  MIESTAS.", hashes, "text")).toBe(true)
    expect(await verifyAcceptedAnswers("vilnius", hashes, "text")).toBe(true)
    expect(await verifyAcceptedAnswers("Kaunas", hashes, "text")).toBe(false)
  })

  it("folds Lithuanian letters", async () => {
    const hashes = [await hashAcceptedAnswer("Šiauliai", "text")]
    expect(await verifyAcceptedAnswers("siauliai", hashes, "text")).toBe(true)
  })

  it("compares numbers by value", async () => {
    const hashes = [await hashAcceptedAnswer("3,14", "number")]
    expect(hashes[0].endsWith(":num")).toBe(true)
    expect(await verifyAcceptedAnswers("3.140", hashes, "number")).toBe(true)
    expect(await verifyAcceptedAnswers("3.15", hashes, "number")).toBe(false)
    expect(await verifyAcceptedAnswers("trys", hashes, "number")).toBe(false)
  })

  it("never applies to a choice task or an empty list", async () => {
    const hashes = [await hashAcceptedAnswer("B", "text")]
    expect(await verifyAcceptedAnswers("B", hashes, "multiple_choice")).toBe(false)
    expect(await verifyAcceptedAnswers("B", [], "text")).toBe(false)
    expect(await verifyAcceptedAnswers("B", null, "text")).toBe(false)
  })

  it("compares a long answer in full, past bcrypt's 72 bytes", async () => {
    const long = "a".repeat(72) + "x"
    const hashes = [await hashAcceptedAnswer(long, "text")]
    expect(hashes[0].endsWith(":sha")).toBe(true)
    expect(await verifyAcceptedAnswers(long, hashes, "text")).toBe(true)
    expect(await verifyAcceptedAnswers("a".repeat(72) + "wrong", hashes, "text")).toBe(false)
  })

  it("still reads a hash made before the digest (no suffix)", async () => {
    const legacy = [await bcrypt.hash("vilniaus miestas", 8)]
    expect(await verifyAcceptedAnswers("Vilniaus miestas", legacy, "text")).toBe(true)
  })

  it("does not mix a text hash with a number answer", async () => {
    const hashes = [await hashAcceptedAnswer("42", "text")]
    expect(await verifyAcceptedAnswers("42", hashes, "number")).toBe(false)
  })
})

describe("prepareAcceptedAnswers", () => {
  it("drops empty entries, repeats and the main answer", async () => {
    const r = await prepareAcceptedAnswers(["Vilnius", " ", "vilnius!", "Sostinė", "VILNIUS"], "text", "Vilniaus miestas")
    expect(r.ok && r.hashes.length).toBe(2)
    const same = await prepareAcceptedAnswers(["Vilniaus miestas", "Vilnius"], "text", "vilniaus miestas")
    expect(same.ok && same.hashes.length).toBe(1)
  })

  it("keeps an extra answer the main one does not accept", async () => {
    const r = await prepareAcceptedAnswers(["JAV"], "text", "JAV.")
    expect(r.ok && r.hashes.length).toBe(1)
    const num = await prepareAcceptedAnswers(["3.140", "3,1416"], "number", "3,14")
    expect(num.ok && num.hashes.length).toBe(1)
  })

  it("refuses a non-number for a number task", async () => {
    expect(await prepareAcceptedAnswers(["3,14", "pi"], "number")).toEqual({
      ok: false,
      error: "Kiti priimami atsakymai turi būti skaičiai.",
    })
  })

  it("keeps none for a choice task", async () => {
    expect(await prepareAcceptedAnswers(["A"], "multiple_choice")).toEqual({ ok: true, hashes: [] })
  })

  it("allows at most five", () => {
    expect(acceptedAnswersSchema.safeParse(["a", "b", "c", "d", "e"]).success).toBe(true)
    expect(acceptedAnswersSchema.safeParse(["a", "b", "c", "d", "e", "f"]).success).toBe(false)
  })
})
