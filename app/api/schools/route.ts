import { NextResponse } from "next/server"
import { MUNICIPALITIES, searchSchools } from "@/lib/access/schools"

const CACHE = { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" }

// GET /api/schools?q=klaipedos aukuro: a few registry matches for the
// school picker. GET /api/schools?list=municipalities: all municipalities,
// for a school that is not in the registry. Public data, no sign-in.
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  if (params.get("list") === "municipalities") {
    return NextResponse.json({ municipalities: MUNICIPALITIES }, { headers: CACHE })
  }
  const q = params.get("q") ?? ""
  if (q.trim().length < 2) return NextResponse.json({ schools: [] })
  const schools = searchSchools(q.slice(0, 100), 15).map((s) => ({
    code: s.code,
    name: s.name,
    municipality: s.municipality,
    type: s.type,
  }))
  return NextResponse.json({ schools }, { headers: CACHE })
}
