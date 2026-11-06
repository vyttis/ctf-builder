import { describe, expect, it } from "vitest"
import { firstJsonBlock, parseAiJson } from "@/lib/ai/rate-limit"

describe("parseAiJson", () => {
  it("reads JSON followed by a closing fence and a Markdown explanation", () => {
    const text = '```json\n{\n  "verdict": "pass",\n  "issues": [],\n  "confidence": 0.95\n}\n```\n\n**Patikrinimo rezultatai:**\n\n✓ **Teisingas atsakymas**: "Laikinoji sostinė"'
    expect(parseAiJson(text)).toEqual({ verdict: "pass", issues: [], confidence: 0.95 })
  })

  it("keeps braces and quotes inside strings", () => {
    expect(firstJsonBlock('x {"a": "}\\" {", "b": [1, {"c": 2}]} tail')).toBe('{"a": "}\\" {", "b": [1, {"c": 2}]}')
    expect(firstJsonBlock("no json here")).toBeNull()
  })
})
