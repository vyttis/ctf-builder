import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireRole } from "@/lib/auth/roles"
import { NextResponse } from "next/server"
import { z } from "zod"

const inviteSchema = z.object({
  email: z.string().email("Neteisingas el. pašto adresas"),
  full_name: z.string().min(2, "Vardas per trumpas"),
  school: z.string().min(2, "Mokyklos pavadinimas per trumpas"),
  phone: z.string().min(6, "Telefono numeris per trumpas"),
  role: z.enum(["teacher", "admin", "super_admin"]),
})

// POST /api/admin/invite — invite a new user (admin+ only)
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    await requireRole(supabase, "admin", "super_admin")

    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Netinkamas užklausos formatas" }, { status: 400 })
    }
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Neteisingi duomenys" },
        { status: 400 }
      )
    }

    const { email, full_name, school, phone, role } = parsed.data

    // Only super_admin can assign admin/super_admin roles
    const callerRole = await requireRole(supabase, "admin", "super_admin")
    if (role !== "teacher" && callerRole !== "super_admin") {
      return NextResponse.json(
        { error: "Tik super administratorius gali priskirti admin roles" },
        { status: 403 }
      )
    }

    const adminClient = createAdminClient()

    // Check if user already exists
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single()

    if (existingProfile) {
      return NextResponse.json(
        { error: "Vartotojas su šiuo el. paštu jau egzistuoja" },
        { status: 409 }
      )
    }

    // Create user via Supabase Auth admin API (sends invite email)
    const { data: authData, error: authError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name,
        },
      })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Nepavyko sukurti vartotojo" },
        { status: 500 }
      )
    }

    // Update the auto-created profile with additional fields
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        full_name,
        school,
        phone,
        role,
        onboarding_completed: true,
      })
      .eq("id", authData.user.id)

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email,
        full_name,
        school,
        phone,
        role,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Prieiga uždrausta"
    const isAuthError = message.includes("role") || message.includes("Prieiga") || message.includes("prisijung")
    return NextResponse.json(
      { error: message },
      { status: isAuthError ? 403 : 500 }
    )
  }
}
