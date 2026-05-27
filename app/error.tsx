"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-accent" />
        </div>
        <h1 className="text-2xl font-bold text-steam-dark mb-2">
          Įvyko klaida
        </h1>
        <p className="text-muted-foreground mb-6">
          Atsiprašome, kažkas nepavyko. Bandykite atnaujinti puslapį.
        </p>
        <Button onClick={reset} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Bandyti dar kartą
        </Button>
      </div>
    </div>
  )
}
