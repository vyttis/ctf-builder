import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import Anthropic from "@anthropic-ai/sdk"
import { buildSystemPrompt } from "@/lib/ai/prompt"
import { aiSuggestResponseSchema, verificationResultSchema } from "@/lib/ai/schemas"
import {
  buildVerificationSystemPrompt,
  buildVerificationUserMessage,
} from "@/lib/ai/verify-prompt"
import { validateDeterministic } from "@/lib/ai/deterministic-validator"
import type { AiSuggestion, VerificationResult } from "@/lib/ai/types"

const processSchema = z.object({
  storage_path: z.string().min(1),
  game_title: z.string().min(1),
  game_description: z.string().nullable().default(null),
  count: z.number().min(1).max(10).default(5),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Netinkamas užklausos formatas" },
      { status: 400 }
    )
  }

  const parsed = processSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Neteisingi duomenys" },
      { status: 400 }
    )
  }

  try {
    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(parsed.data.storage_path)

    if (downloadError || !fileData) {
      return NextResponse.json(
        { error: "Nepavyko gauti failo" },
        { status: 404 }
      )
    }

    // Extract text based on file type
    const text = await extractText(fileData, parsed.data.storage_path)

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: "Nepavyko išgauti teksto iš dokumento arba tekstas per trumpas" },
        { status: 400 }
      )
    }

    // Truncate to reasonable length for AI processing
    const truncatedText = text.slice(0, 8000)

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "DI paslauga nepasiekiama" },
        { status: 503 }
      )
    }

    const anthropic = new Anthropic({ apiKey })

    // Generate tasks from document content
    const systemPrompt = buildSystemPrompt()
    const userMessage = `Žaidimo pavadinimas: ${parsed.data.game_title}
${parsed.data.game_description ? `Žaidimo aprašymas: ${parsed.data.game_description}` : ""}

Mokytojas įkėlė dokumentą su mokomąja medžiaga. Pagal šį turinį sugeneruok ${parsed.data.count} edukacines CTF užduotis.

DOKUMENTO TURINYS:
---
${truncatedText}
---

Sugeneruok ${parsed.data.count} užduotis pagal šį dokumentą. Užduotys turi tikrinti mokinių supratimą apie dokumento turinį.`

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from DI")
    }

    let jsonText = textBlock.text.trim()
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
    }

    const rawGenerated = JSON.parse(jsonText)
    const validated = aiSuggestResponseSchema.safeParse(rawGenerated)
    if (!validated.success) {
      throw new Error("Invalid DI response")
    }

    // Verify each suggestion
    const enriched = await Promise.all(
      validated.data.suggestions.map(async (suggestion) => {
        const verification = await verifySuggestion(anthropic, suggestion)
        return { ...suggestion, verification }
      })
    )

    return NextResponse.json({ suggestions: enriched })
  } catch (error) {
    console.error("Import process error:", error)
    return NextResponse.json(
      { error: "Dokumento apdorojimas nepavyko. Bandykite dar kartą." },
      { status: 500 }
    )
  }
}

async function extractText(blob: Blob, path: string): Promise<string> {
  const ext = path.split(".").pop()?.toLowerCase()

  if (ext === "txt") {
    return await blob.text()
  }

  if (ext === "pdf") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse")
      const buffer = Buffer.from(await blob.arrayBuffer())
      const data = await pdfParse(buffer)
      return data.text
    } catch {
      return ""
    }
  }

  if (ext === "docx") {
    try {
      const mammoth = await import("mammoth")
      const buffer = Buffer.from(await blob.arrayBuffer())
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    } catch {
      return ""
    }
  }

  return ""
}

async function verifySuggestion(
  anthropic: Anthropic,
  suggestion: AiSuggestion
): Promise<VerificationResult> {
  const deterministicResult = validateDeterministic(suggestion)
  if (deterministicResult !== null) return deterministicResult

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: buildVerificationSystemPrompt(),
      messages: [
        { role: "user", content: buildVerificationUserMessage(suggestion) },
      ],
    })

    const textBlock = message.content.find((b) => b.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      return { verdict: "uncertain", issues: ["Patikra negauta"], confidence: 0 }
    }

    let jsonText = textBlock.text.trim()
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    }

    const rawParsed = JSON.parse(jsonText)
    const validated = verificationResultSchema.safeParse(rawParsed)
    if (!validated.success) {
      return { verdict: "uncertain", issues: ["Netikėtas formatas"], confidence: 0 }
    }
    return validated.data
  } catch {
    return { verdict: "uncertain", issues: ["Patikra nepavyko"], confidence: 0 }
  }
}
