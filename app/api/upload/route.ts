import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
}
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json(
      { error: "Failas nerastas" },
      { status: 400 }
    )
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Netinkamas failo formatas. Leidžiami: JPEG, PNG, GIF, WebP" },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Failas per didelis. Maksimalus dydis: 5MB" },
      { status: 400 }
    )
  }

  // Derive extension from validated MIME — never trust file.name
  const ext = MIME_TO_EXT[file.type] || "jpg"
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

  const { data, error } = await supabase.storage
    .from("challenge-images")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Nepavyko įkelti failo." }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("challenge-images").getPublicUrl(data.path)

  return NextResponse.json({ url: publicUrl }, { status: 201 })
}
