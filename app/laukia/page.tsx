import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SteamLogo } from "@/components/steam-logo"
import { SignOutButton } from "@/components/auth/sign-out-button"

export const metadata: Metadata = { title: "Paskyra laukia patvirtinimo | KU STEAM pamokos" }
export const dynamic = "force-dynamic"

// Accounts that are not active (waiting for approval or blocked) land here
// instead of the facilitator area (see proxy.ts).
export default async function WaitingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/vedejui")

  const { data: profile } = await supabase.from("profiles").select("status").eq("id", user.id).single()
  const blocked = profile?.status === "blocked"

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="flex justify-center">
          <SteamLogo size="large" />
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm space-y-3 text-left">
          <h1 className="text-xl font-bold text-steam-dark">
            {blocked ? "Paskyra užblokuota" : "Paskyra laukia patvirtinimo"}
          </h1>
          {blocked ? (
            <p className="text-sm text-muted-foreground">
              Ši paskyra negali vesti veiklų. Jei manote, kad tai klaida, rašykite steam@ku.lt.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Prisijungėte kaip <span className="font-medium text-steam-dark">{user.email}</span>, bet vedėjo
                paskyra dar nepatvirtinta.
              </p>
              <p className="text-sm text-muted-foreground">
                Paskyrą patvirtina KU STEAM centras. Prašymą galite pateikti veiklos pabaigoje arba per nuorodą,
                kurią gavote el. paštu. Kai paskyra bus patvirtinta, prisijunkite iš naujo.
              </p>
            </>
          )}
        </div>
        <SignOutButton />
      </div>
    </main>
  )
}
