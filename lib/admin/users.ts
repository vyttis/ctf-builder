import type { SupabaseClient } from "@supabase/supabase-js"
import { usageByUser } from "@/lib/ai/usage"
import type { AccountStatus, UserRole } from "@/types/game"
import type { AdminUserRow } from "@/lib/admin/user-rows"

const PROFILE_COLUMNS =
  "id, email, full_name, first_name, last_name, avatar_url, role, status, school, school_code, municipality, school_type, subjects, grades, onboarding_completed, created_at, approved_at, ai_monthly_limit"

async function activitiesByTeacher(admin: SupabaseClient): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  const page = 1000
  for (let from = 0; ; from += page) {
    const { data, error } = await admin
      .from("games")
      .select("id, teacher_id")
      .order("id", { ascending: true })
      .range(from, from + page - 1)
    if (error) throw error
    for (const g of data ?? []) {
      if (g.teacher_id) counts.set(g.teacher_id, (counts.get(g.teacher_id) ?? 0) + 1)
    }
    if (!data || data.length < page) break
  }
  return counts
}

async function lastSignIns(admin: SupabaseClient): Promise<Map<string, string | null>> {
  const seen = new Map<string, string | null>()
  const perPage = 1000
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    for (const u of data.users) seen.set(u.id, u.last_sign_in_at ?? null)
    if (data.users.length < perPage) break
  }
  return seen
}

/**
 * Everything the user list shows, read with the service role: profiles,
 * activity counts, last sign-in from Auth and this month's DI use. A part
 * that cannot be read (Auth API down, say) shows as empty, not as an error.
 */
export async function loadAdminUsers(admin: SupabaseClient): Promise<AdminUserRow[]> {
  const { data: profiles, error } = await admin
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("created_at", { ascending: false })
  if (error) throw error

  const [activities, signIns, usage] = await Promise.all([
    activitiesByTeacher(admin).catch(() => new Map<string, number>()),
    lastSignIns(admin).catch(() => new Map<string, string | null>()),
    usageByUser(admin).catch(() => []),
  ])
  const actions = new Map(usage.map((u) => [u.userId, u.actions]))

  return (profiles ?? []).map((p) => {
    const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || p.full_name || p.email
    return {
      id: p.id,
      email: p.email,
      name,
      first_name: p.first_name ?? null,
      last_name: p.last_name ?? null,
      avatar_url: p.avatar_url ?? null,
      role: p.role as UserRole,
      status: (p.status ?? "active") as AccountStatus,
      school: p.school ?? null,
      school_code: p.school_code ?? null,
      municipality: p.municipality ?? null,
      school_type: p.school_type ?? null,
      subjects: p.subjects ?? [],
      grades: p.grades ?? [],
      onboarding_completed: Boolean(p.onboarding_completed),
      created_at: p.created_at,
      approved_at: p.approved_at ?? null,
      last_sign_in_at: signIns.get(p.id) ?? null,
      activities: activities.get(p.id) ?? 0,
      ai_actions: actions.get(p.id) ?? 0,
      ai_limit: p.ai_monthly_limit ?? null,
    }
  })
}
