import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

const onboardingSchema = z.object({
  full_name: z.string().min(2, "Vardas per trumpas"),
  school: z.string().min(2, "Mokyklos pavadinimas per trumpas"),
  phone: z.string().min(6, "Telefono numeris per trumpas"),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Neprisijungęs" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = onboardingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Neteisingi duomenys" },
        { status: 400 }
      )
    }

    const { full_name, school, phone } = parsed.data

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name,
        school,
        phone,
        onboarding_completed: true,
      })
      .eq("id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Serverio klaida" }, { status: 500 })
  }
}
