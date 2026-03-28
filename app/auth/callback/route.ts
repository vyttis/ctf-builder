import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const nextParam = searchParams.get("next") ?? "/dashboard"
  // Prevent open redirect: must be relative path, not protocol-relative or absolute URL
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") && !nextParam.includes("://") ? nextParam : "/"
  const errorParam = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Handle OAuth provider errors (e.g., user denied access, provider misconfigured)
  if (errorParam) {
    const errorMsg = errorDescription || errorParam
    return NextResponse.redirect(
      `${getRedirectOrigin(request, origin)}/auth/login?error=${encodeURIComponent(errorMsg)}`
    )
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const redirectOrigin = getRedirectOrigin(request, origin)
      return NextResponse.redirect(`${redirectOrigin}${next}`)
    }

    // Pass specific error for debugging
    return NextResponse.redirect(
      `${getRedirectOrigin(request, origin)}/auth/login?error=${encodeURIComponent(error.message)}`
    )
  }

  return NextResponse.redirect(
    `${getRedirectOrigin(request, origin)}/auth/login?error=auth_failed`
  )
}

// Use NEXT_PUBLIC_APP_URL if set, otherwise fallback to request origin.
// Never trust x-forwarded-host blindly to prevent open redirect attacks.
function getRedirectOrigin(_request: Request, fallbackOrigin: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) {
    return appUrl.replace(/\/+$/, "")
  }
  return fallbackOrigin
}
