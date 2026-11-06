import type { SupabaseClient } from "@supabase/supabase-js"
import { findSchoolByCode } from "@/lib/access/schools"

/** The public address of the platform (pamokos.kusteam.app in production). */
export function publicBaseUrl(origin: string): string {
  const host = process.env.CANONICAL_CLASSROOM_HOST
  return host ? `https://${host}` : origin
}

/** Where invitation links land: a page that turns the link into a session. */
export function confirmUrl(origin: string): string {
  return `${publicBaseUrl(origin)}/auth/confirm?next=/onboarding`
}

export async function logAdminAction(
  admin: SupabaseClient,
  actorId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown> = {},
): Promise<void> {
  const { error } = await admin.from("admin_audit_log").insert({
    actor_id: actorId,
    action,
    target_type: targetType,
    target_id: targetId,
    details,
  })
  // The action itself already happened; a missing log line must not undo it.
  if (error) console.error("[admin-audit] insert failed", { action, code: error.code })
}

export interface NewAccount {
  email: string
  first_name: string
  last_name: string
  school_code: string | null
  school_name: string | null
  municipality: string | null
  role?: "teacher" | "admin" | "super_admin"
}

export type AccountResult =
  | { ok: true; userId: string; existing: boolean }
  | { ok: false; status: number; error: string }

/**
 * Gives a person an active facilitator account. If the email already has
 * an account (e.g. it signed in with Google and waits for approval), that
 * account is activated; otherwise an invitation email is sent. The profile
 * starts active with the request's details; the person completes the rest
 * on first sign-in (onboarding).
 */
export async function grantAccount(
  admin: SupabaseClient,
  account: NewAccount,
  actorId: string,
  origin: string,
): Promise<AccountResult> {
  const email = account.email.trim().toLowerCase()
  const school = account.school_code ? findSchoolByCode(account.school_code) : null
  const profileFields = {
    first_name: account.first_name,
    last_name: account.last_name,
    full_name: `${account.first_name} ${account.last_name}`.trim(),
    school: school?.name ?? account.school_name,
    school_code: school?.code ?? null,
    municipality: school?.municipality ?? account.municipality,
    school_type: school?.type ?? null,
    status: "active",
    approved_at: new Date().toISOString(),
    approved_by: actorId,
    ...(account.role ? { role: account.role } : {}),
  }

  // Exact match: ilike would treat "_" and "%" in an address as wildcards.
  // Supabase Auth stores emails in lower case, and so do profiles.
  const { data: existing } = await admin
    .from("profiles")
    .select("id, first_name, last_name, school")
    .eq("email", email)
    .maybeSingle()

  if (existing) {
    // Keep what the person already entered; fill only empty fields. The
    // role of an existing account changes only in user management, so an
    // approval can never demote an admin.
    const update: Record<string, unknown> = {
      status: "active",
      approved_at: profileFields.approved_at,
      approved_by: actorId,
    }
    if (!existing.first_name) update.first_name = profileFields.first_name
    if (!existing.last_name) update.last_name = profileFields.last_name
    if (!existing.school) {
      update.school = profileFields.school
      update.school_code = profileFields.school_code
      update.municipality = profileFields.municipality
      update.school_type = profileFields.school_type
    }
    const { error } = await admin.from("profiles").update(update).eq("id", existing.id)
    if (error) return { ok: false, status: 500, error: "Nepavyko aktyvuoti paskyros." }
    return { ok: true, userId: existing.id, existing: true }
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: confirmUrl(origin),
    data: { full_name: profileFields.full_name },
  })
  if (inviteError || !invited?.user) {
    console.error("[access] invite failed", { status: inviteError?.status })
    return { ok: false, status: 502, error: "Nepavyko išsiųsti kvietimo laiško. Bandykite dar kartą." }
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ ...profileFields, onboarding_completed: false })
    .eq("id", invited.user.id)
  if (profileError) {
    // Do not leave a half-made account behind: the next attempt starts clean.
    await admin.auth.admin.deleteUser(invited.user.id)
    return { ok: false, status: 500, error: "Nepavyko sukurti profilio. Bandykite dar kartą." }
  }
  return { ok: true, userId: invited.user.id, existing: false }
}
