"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Unhandled error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center space-y-6">
        <h1 className="text-7xl font-bold text-destructive">Klaida</h1>
        <h2 className="text-2xl font-semibold text-foreground">
          Kažkas nutiko ne taip
        </h2>
        <p className="text-muted-foreground max-w-md">
          Įvyko netikėta klaida. Pabandykite dar kartą arba grįžkite į
          pradinį puslapį.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground font-mono">
            Klaidos kodas: {error.digest}
          </p>
        )}
        <div className="flex gap-4 justify-center pt-4">
          <button
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            Bandyti dar kartą
          </button>
          <a
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
          >
            Grįžti į pradžią
          </a>
        </div>
      </div>
    </div>
  )
}
