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

    // PKCE verifier cookie is host-only: if Supabase redirected the OAuth code
    // to a different host than the one where login started (Site URL fallback
    // when redirect_to is not allow-listed), the exchange fails here. Surface
    // a stable error code so the login page can show an actionable message.
    const isVerifierError =
      error.message.toLowerCase().includes("code verifier") ||
      error.code === "validation_failed"
    return NextResponse.redirect(
      `${getRedirectOrigin(request, origin)}/auth/login?error=${
        isVerifierError ? "pkce_mismatch" : encodeURIComponent(error.message)
      }`
    )
  }

  return NextResponse.redirect(
    `${getRedirectOrigin(request, origin)}/auth/login?error=auth_failed`
  )
}

// Use x-forwarded-host for production (behind proxy/CDN), fallback to origin
function getRedirectOrigin(request: Request, fallbackOrigin: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https"

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return fallbackOrigin
}
