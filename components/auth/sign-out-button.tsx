"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, LogOut } from "lucide-react"

export function SignOutButton() {
  const [loading, setLoading] = useState(false)
  return (
    <Button
      variant="outline"
      onClick={async () => {
        setLoading(true)
        await createClient().auth.signOut()
        window.location.href = "/vedejui"
      }}
      disabled={loading}
      className="gap-2"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
      Atsijungti
    </Button>
  )
}
