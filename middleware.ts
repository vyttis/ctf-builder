import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const url = request.nextUrl.clone()

  // Determine subdomain
  let subdomain = ""
  if (hostname.includes("localhost")) {
    // app.localhost:3000 -> "app", play.localhost:3000 -> "play"
    const parts = hostname.split(".")
    if (parts.length > 1 && parts[0] !== "localhost") {
      subdomain = parts[0]
    }
  } else {
    // Production: app.ctfbuilder.com -> "app"
    const parts = hostname.split(".")
    if (parts.length > 2) {
      subdomain = parts[0]
    }
  }

  // Create Supabase client for auth refresh
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh auth token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Teacher routes: require auth
  if (subdomain === "app") {
    const isAuthCallback = url.pathname === "/auth/callback"
    const isAuthPage = url.pathname.startsWith("/auth")
    const isOnboarding = url.pathname === "/onboarding"
    const isOnboardingApi = url.pathname === "/api/onboarding"

    // Always let /auth/callback through — it exchanges the OAuth code
    if (isAuthCallback) {
      return response
    }

    if (!user && !isAuthPage) {
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    if (user && isAuthPage) {
      url.pathname = "/"
      return NextResponse.redirect(url)
    }

    // Check onboarding completion for authenticated users
    if (user && !isOnboarding && !isOnboardingApi && !isAuthPage) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single()

      if (profile && !profile.onboarding_completed) {
        url.pathname = "/onboarding"
        return NextResponse.redirect(url)
      }
    }

    return response
  }

  // Player routes: no auth needed
  if (subdomain === "play") {
    return response
  }

  // No subdomain: path-based routing
  const isAuthCallback = url.pathname === "/auth/callback"
  const isAuthPage = url.pathname.startsWith("/auth")
  const isOnboarding = url.pathname === "/onboarding"
  const isOnboardingApi = url.pathname === "/api/onboarding"
  const isTeacherRoute =
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/games") ||
    url.pathname.startsWith("/admin")

  // Always let /auth/callback through — it exchanges the OAuth code
  if (isAuthCallback) {
    return response
  }

  // Teacher routes require auth
  if (isTeacherRoute && !user) {
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users from landing & login to dashboard
  if (user && (url.pathname === "/" || isAuthPage)) {
    url.pathname = "/dashboard"
    return NextResponse.redirect(url)
  }

  // Check onboarding completion for authenticated users on teacher routes
  if (user && isTeacherRoute && !isOnboarding && !isOnboardingApi) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single()

    if (profile && !profile.onboarding_completed) {
      url.pathname = "/onboarding"
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|illustrations/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
