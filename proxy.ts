import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { hostKind, legacyRedirect } from "@/lib/hosts"

// In-memory account gate cache: user.id → { expiresAt }. Only the fully
// open state (active and onboarded) is cached, for 30 s: it cuts ~30-50 ms
// off every teacher navigation. Anything else is read fresh, so a user who
// just finished onboarding or was just approved is not bounced back. A
// block reaches cached instances within 30 s.
type GateCacheEntry = { expiresAt: number }
const GATE_TTL_MS = 30_000
const gateCache = new Map<string, GateCacheEntry>()

type AccountGate = { status: "pending" | "active" | "blocked"; onboarded: boolean }

async function accountGate(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
): Promise<AccountGate> {
  const now = Date.now()
  const cached = gateCache.get(userId)
  if (cached && cached.expiresAt > now) return { status: "active", onboarded: true }

  const first = await supabase
    .from("profiles")
    .select("onboarding_completed, status")
    .eq("id", userId)
    .single()
  let profile: { onboarding_completed: boolean; status: string } | null = first.data
  if (first.error?.code === "42703") {
    // Database without the status column yet (before 20261106130000):
    // every existing account was active, so behave as before.
    const legacy = await supabase.from("profiles").select("onboarding_completed").eq("id", userId).single()
    profile = legacy.data ? { ...legacy.data, status: "active" } : null
  }

  const status = (profile?.status as AccountGate["status"]) ?? "pending"
  const onboarded = Boolean(profile?.onboarding_completed)
  if (status === "active" && onboarded) {
    gateCache.set(userId, { expiresAt: now + GATE_TTL_MS })
  }
  return { status, onboarded }
}

// Facilitator APIs need an active account. Participant and public APIs
// (play, teams, submissions, reflections, health, schools, access
// requests) do not: a signed-in teacher may also play in someone's class.
const FACILITATOR_API =
  /^\/api\/(admin|ai|challenges|di|games|import|lesson-plans|lessons|library|upload|onboarding)(\/|$)/

/** Where an account that may not use the facilitator area goes. */
function gateRedirect(gate: AccountGate, pathname: string): string | null {
  if (gate.status !== "active") return pathname === "/laukia" ? null : "/laukia"
  if (!gate.onboarded && pathname !== "/onboarding") return "/onboarding"
  return null
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
    // Always let /auth/callback and /auth/confirm through: they turn an
    // OAuth code or an invitation link into a session, even when another
    // session is already open in this browser.
    if (isAuthCallback || url.pathname === "/auth/confirm") {
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

    if (user && !isAuthPage) {
      const gate = await accountGate(supabase, user.id)
      if (FACILITATOR_API.test(url.pathname) && gate.status !== "active") {
        return NextResponse.json({ error: "Paskyra dar nepatvirtinta." }, { status: 403 })
      }
      if (!url.pathname.startsWith("/api/")) {
        const target = gateRedirect(gate, url.pathname)
        if (target) {
          url.pathname = target
          return NextResponse.redirect(url)
        }
      }
    }

    return response
  }

  // pamokos.* and the bare domain: one host for facilitators and participants,
  // only facilitator routes require a session.
  const isAuthCallback = url.pathname === "/auth/callback"
  const isAuthPage = url.pathname.startsWith("/auth")
  const isOnboarding = url.pathname === "/onboarding"
  const isTeacherRoute =
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/games") ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/library") ||
    url.pathname.startsWith("/lesson-plans")

  // Always let /auth/callback and /auth/confirm through (see above)
  if (isAuthCallback || url.pathname === "/auth/confirm") {
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

  // Account gate: pending or blocked accounts see /laukia, active ones
  // finish onboarding first. Participant pages are never gated.
  if (user && (isTeacherRoute || isOnboarding || url.pathname === "/laukia")) {
    const gate = await accountGate(supabase, user.id)
    const target = gateRedirect(gate, url.pathname)
    if (target && target !== url.pathname) {
      url.pathname = target
      return NextResponse.redirect(url)
    }
    if (url.pathname === "/laukia" && gate.status === "active") {
      url.pathname = gate.onboarded ? "/dashboard" : "/onboarding"
      return NextResponse.redirect(url)
    }
  }
  if (user && FACILITATOR_API.test(url.pathname)) {
    const gate = await accountGate(supabase, user.id)
    if (gate.status !== "active") {
      return NextResponse.json({ error: "Paskyra dar nepatvirtinta." }, { status: 403 })
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|illustrations/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
