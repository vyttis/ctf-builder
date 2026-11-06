"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import Link from "next/link"

const OTP_TYPES: EmailOtpType[] = ["invite", "magiclink", "signup", "recovery", "email", "email_change"]

function safeNext(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/onboarding"
}

/**
 * Landing page of invitation emails. Handles both link shapes Supabase can
 * send: `?token_hash=…&type=invite` (custom email template) and the default
 * `#access_token=…&refresh_token=…` fragment.
 */
function Confirm() {
  const params = useSearchParams()
  const router = useRouter()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    const next = safeNext(params.get("next"))
    const tokenHash = params.get("token_hash")
    const type = params.get("type") as EmailOtpType | null
    const fragment = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = fragment.get("access_token")
    const refreshToken = fragment.get("refresh_token")

    async function run() {
      let ok = false
      if (tokenHash && type && OTP_TYPES.includes(type)) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
        ok = !error
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        ok = !error
      }
      if (ok) {
        router.replace(next)
        router.refresh()
      } else {
        setFailed(true)
      }
    }
    void run()
  }, [params, router])

  if (failed) {
    return (
      <div className="space-y-3 text-center">
        <h1 className="text-xl font-bold text-steam-dark">Nuoroda nebegalioja</h1>
        <p className="text-sm text-muted-foreground">
          Kvietimo nuoroda jau panaudota arba pasibaigė. Prisijunkite el. paštu: atsiųsime naują kodą.
        </p>
        <Link href="/vedejui" className="inline-block font-medium underline underline-offset-4">
          Prisijungti
        </Link>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3 text-muted-foreground" role="status">
      <Loader2 className="h-5 w-5 animate-spin" />
      Jungiamės...
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted">
      <Suspense>
        <Confirm />
      </Suspense>
    </main>
  )
}
