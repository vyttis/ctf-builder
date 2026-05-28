import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// In-memory onboarding-completed cache: user.id → { completed, expiresAt }.
// 30s TTL is short enough to feel "live" but cuts ~30-50ms off every teacher
// navigation. Cache is per-instance — irrelevant for correctness because the
// values are read-only flags.
type OnboardingCacheEntry = { completed: boolean; expiresAt: number }
const ONBOARDING_TTL_MS = 30_000
const onboardingCache = new Map<string, OnboardingCacheEntry>()

async function isOnboardingCompleted(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<boolean> {
  const now = Date.now()
  const cached = onboardingCache.get(userId)
  if (cached && cached.expiresAt > now) return cached.completed

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .single()

  const completed = Boolean(profile?.onboarding_completed)
  onboardingCache.set(userId, { completed, expiresAt: now + ONBOARDING_TTL_MS })
  return completed
}

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

  // Player routes: no auth, no Supabase calls — return immediately for fast page load
  if (subdomain === "play") {
    return NextResponse.next({ request })
  }

  // Defensive redirect: students who land on app.* with a /play/<code> path
  // (e.g. from an old QR code or a shared link) should bounce to play.* —
  // otherwise the auth guard below would redirect them to /auth/login,
  // a dead end for students who have no account.
  if (subdomain === "app" && url.pathname.startsWith("/play/")) {
    const playHost = hostname.replace(/^app\./, "play.")
    const playUrl = url.clone()
    playUrl.host = playHost
    // Keep the full /play/<code> path — Next.js route shape is the same
    // on both subdomains.
    return NextResponse.redirect(playUrl)
  }

  // Create Supabase client for auth refresh (teacher routes only)
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

  // Safety net: if ?code= lands on the wrong page (e.g. due to www redirect),
  // forward it to /auth/callback so the code exchange still happens
  if (
    url.searchParams.has("code") &&
    url.pathname !== "/auth/callback" &&
    !user
  ) {
    url.pathname = "/auth/callback"
    return NextResponse.redirect(url)
  }

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

    // Check onboarding completion for authenticated users (30s in-memory cache)
    if (user && !isOnboarding && !isOnboardingApi && !isAuthPage) {
      const completed = await isOnboardingCompleted(supabase, user.id)
      if (!completed) {
        url.pathname = "/onboarding"
        return NextResponse.redirect(url)
      }
    }

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
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/library")

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
    const completed = await isOnboardingCompleted(supabase, user.id)
    if (!completed) {
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
