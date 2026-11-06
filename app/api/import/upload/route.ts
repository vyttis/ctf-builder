import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { UPLOAD_LIMIT_BYTES, UPLOAD_LIMIT_TEXT } from "@/lib/upload-limits"
import { nanoid } from "nanoid"

const MAX_FILE_SIZE = UPLOAD_LIMIT_BYTES
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]
const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "text/plain": "txt",
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "Failas privalomas" },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Failas per didelis. Didžiausias dydis ${UPLOAD_LIMIT_TEXT}.` },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type) && !file.name.endsWith(".txt")) {
      return NextResponse.json(
        { error: "Netinkamas failo tipas. Palaikomi: PDF, DOCX, TXT" },
        { status: 400 }
      )
    }

    const sessionId = nanoid(12)
    const ext = MIME_TO_EXT[file.type] || (file.name.toLowerCase().endsWith(".txt") ? "txt" : "bin")
    const storagePath = `imports/${user.id}/${sessionId}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Upload error:", uploadError)
      return NextResponse.json(
        { error: "Nepavyko įkelti failo" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      import_session_id: sessionId,
      file_name: file.name,
      file_type: file.type,
      storage_path: storagePath,
    })
  } catch (error) {
    console.error("Import upload error:", error)
    return NextResponse.json(
      { error: "Serverio klaida" },
      { status: 500 }
    )
  }
}
