import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]

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
        { error: "Failas per didelis (maks. 10MB)" },
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
    const ext = file.name.split(".").pop() || "bin"
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
