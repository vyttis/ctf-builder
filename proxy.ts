import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { hostKind, legacyRedirect } from "@/lib/hosts"

// In-memory onboarding-completed cache: user.id → { completed, expiresAt }.
// 30s TTL is short enough to feel "live" but cuts ~30-50ms off every teacher
// navigation. Cache is per-instance — irrelevant for correctness because the
// values are read-only flags. Only `completed: true` is cached: onboarding is
// one-way, so true never goes stale, while caching false would bounce a user
// who just finished onboarding back to /onboarding for up to 30s (the API
// route runs in a different runtime and cannot bust this cache).
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
  if (completed) {
    onboardingCache.set(userId, { completed, expiresAt: now + ONBOARDING_TTL_MS })
  }
  return completed
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const url = request.nextUrl.clone()

  const kind = hostKind(hostname)

  // After the switch to pamokos.kusteam.app, the old split hosts move their
  // visitors there (paths and query kept). Unset = old behaviour, so the
  // switch and its rollback are one environment variable.
  const canonical = legacyRedirect(
    kind,
    url.pathname,
    url.search,
    process.env.CANONICAL_CLASSROOM_HOST,
  )
  // 307 (temporary) while the switch is new: browsers do not cache it, so
  // unsetting the variable really rolls back. Move to 308 once it has been
  // stable for a while.
  if (canonical) {
    return NextResponse.redirect(canonical, 307)
  }

  // Participant routes on play.*: no auth, no Supabase calls, fast first paint.
  if (kind === "play") {
    // Participants who type play.kusteam.app by hand should land on the
    // code entry screen, not the facilitator-facing landing page.
    if (url.pathname === "/" || url.pathname === "/play") {
      url.pathname = "/prisijungti"
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  // Participants who land on app.* (an old QR code, a shared link, or the
  // participant entry) belong on play.*: the facilitator auth guard below
  // would otherwise send them to a login page they cannot use.
  if (
    kind === "app" &&
    (url.pathname.startsWith("/play/") || url.pathname === "/prisijungti")
  ) {
    const playUrl = url.clone()
    playUrl.host = hostname.replace(/^app\./, "play.")
    return NextResponse.redirect(playUrl)
  }

  // Uptime checks call /api/health without a session. On app.* the auth
  // guard below would answer with the login page (HTML, 200), so let the
  // health route through before any Supabase call.
  if (url.pathname === "/api/health") {
    return NextResponse.next({ request })
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

  // Facilitator host app.*: everything except auth pages requires a session
  if (kind === "app") {
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

  // pamokos.* and the bare domain: one host for facilitators and participants,
  // only facilitator routes require a session.
  const isAuthCallback = url.pathname === "/auth/callback"
  const isAuthPage = url.pathname.startsWith("/auth")
  const isOnboarding = url.pathname === "/onboarding"
  const isOnboardingApi = url.pathname === "/api/onboarding"
  const isTeacherRoute =
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/games") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/library") ||
    url.pathname.startsWith("/lesson-plans")

  // Always let /auth/callback through — it exchanges the OAuth code
  if (isAuthCallback) {
    return response
  }

  // The facilitator entry on pamokos.* is /vedejui; the older login address
  // keeps working and lands there with its query (e.g. ?error=) intact.
  if (kind === "pamokos" && url.pathname === "/auth/login" && !user) {
    url.pathname = "/vedejui"
    return NextResponse.redirect(url)
  }

  // Facilitator routes require a session
  if (isTeacherRoute && !user) {
    url.pathname = kind === "pamokos" ? "/vedejui" : "/auth/login"
    return NextResponse.redirect(url)
  }

  // Signed-in facilitators skip the login page. On pamokos.* the root stays
  // the role choice ("Vesti veiklą" / "Prisijungti prie veiklos").
  if (user && (isAuthPage || (url.pathname === "/" && kind !== "pamokos"))) {
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
