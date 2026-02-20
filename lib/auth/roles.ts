import { SupabaseClient } from "@supabase/supabase-js"

export type UserRole = "teacher" | "admin" | "super_admin"

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  school: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

/**
 * Get current user's role from profiles table
 */
export async function getUserRole(supabase: SupabaseClient): Promise<UserRole> {
  const { data } = await supabase.rpc("get_my_role")
  return (data as UserRole) || "teacher"
}

/**
 * Get current user's full profile
 */
export async function getUserProfile(
  supabase: SupabaseClient
): Promise<UserProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return profile as UserProfile | null
}

/**
 * Check if user has one of the allowed roles, throw if not
 */
export async function requireRole(
  supabase: SupabaseClient,
  ...allowedRoles: UserRole[]
): Promise<UserRole> {
  const role = await getUserRole(supabase)
  if (!allowedRoles.includes(role)) {
    throw new Error(`Prieiga uždrausta. Reikalinga rolė: ${allowedRoles.join(" arba ")}`)
  }
  return role
}

// Permission helpers
export function canManageUsers(role: UserRole): boolean {
  return role === "super_admin"
}

export function canChangeRoles(role: UserRole): boolean {
  return role === "super_admin"
}

export function canApproveLibrary(role: UserRole): boolean {
  return role === "admin" || role === "super_admin"
}

export function canViewAnalytics(role: UserRole): boolean {
  return role === "admin" || role === "super_admin"
}

export function canViewAdminDashboard(role: UserRole): boolean {
  return role === "admin" || role === "super_admin"
}

export function canDeleteLibraryItem(role: UserRole): boolean {
  return role === "super_admin"
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "Super administratorius"
    case "admin":
      return "Administratorius"
    case "teacher":
      return "Mokytojas"
    default:
      return role
  }
}

export function getRoleBadgeColor(role: UserRole): string {
  switch (role) {
    case "super_admin":
      return "bg-accent/10 text-accent border-accent/20"
    case "admin":
      return "bg-secondary/10 text-secondary border-secondary/20"
    case "teacher":
      return "bg-primary/10 text-primary border-primary/20"
    default:
      return "bg-muted text-muted-foreground"
  }
}
