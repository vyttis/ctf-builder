import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LoginForm } from "@/app/auth/login/login-form"

export const metadata: Metadata = {
  title: "Vesti veiklą | KU STEAM pamokos",
  description: "Prisijunkite, kad galėtumėte kurti ir vesti interaktyvias veiklas.",
}

/**
 * Facilitator entry. Signed-in facilitators go straight to their activities;
 * everyone else gets the login form (Google or an email code).
 */
export default async function FacilitatorEntryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
