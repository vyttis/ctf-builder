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
    const isAuthPage =
      url.pathname.startsWith("/auth") || url.pathname === "/auth/login"

    if (!user && !isAuthPage) {
      url.pathname = "/auth/login"
      return NextResponse.redirect(url)
    }

    if (user && isAuthPage) {
      url.pathname = "/"
      return NextResponse.redirect(url)
    }

    return response
  }

  // Player routes: no auth needed
  if (subdomain === "play") {
    return response
  }

  // No subdomain: path-based routing
  const isAuthPage = url.pathname.startsWith("/auth")
  const isPlayPage = url.pathname.startsWith("/play")
  const isApiRoute = url.pathname.startsWith("/api")
  const isTeacherRoute =
    url.pathname.startsWith("/dashboard") ||
    url.pathname.startsWith("/games")

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

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|illustrations/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
