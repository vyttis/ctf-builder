import * as z from "zod"
import { describe, expect, it } from "vitest"
import { installLithuanianValidation } from "@/lib/validation/zod-lt"

installLithuanianValidation()

const messages = (schema: z.ZodType, input: unknown) => {
  const r = schema.safeParse(input)
  return r.success ? [] : r.error.issues.map((i) => i.message)
}

describe("Lithuanian validation messages", () => {
  it("covers the common cases", () => {
    expect(messages(z.number().max(1000), 5000)).toEqual(["Didžiausia leistina reikšmė: 1000."])
    expect(messages(z.number().min(1), 0)).toEqual(["Mažiausia leistina reikšmė: 1."])
    expect(messages(z.string().min(1), "")).toEqual(["Šis laukas privalomas."])
    expect(messages(z.string().max(30), "x".repeat(31))).toEqual(["Ne daugiau kaip 30 ženklų."])
    expect(messages(z.string().url(), "nope")).toEqual(["Neteisingas adresas."])
    expect(messages(z.enum(["a", "b"]), "c")).toEqual(["Pasirinkite vieną iš galimų reikšmių."])
    expect(messages(z.number().int(), 1.5)).toEqual(["Įveskite sveikąjį skaičių."])
    expect(messages(z.object({ a: z.string() }), {})).toEqual(["Šis laukas privalomas."])
  })

  it("keeps a message set on the schema", () => {
    expect(messages(z.string().min(1, "Įrašykite vardą."), "")).toEqual(["Įrašykite vardą."])
  })
})
