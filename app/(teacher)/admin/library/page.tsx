import { createClient } from "@/lib/supabase/server"
import { getUserProfile } from "@/lib/auth/roles"
import { LibraryModeration } from "@/components/admin/library-moderation"

export default async function AdminLibraryPage() {
  // The admin layout already allows only administrators here; removing a
  // template is for the super administrator (the API checks it too).
  const supabase = await createClient()
  const profile = await getUserProfile(supabase)
  return <LibraryModeration canDelete={profile?.role === "super_admin"} />
}
