"use client"

import { ErrorBoundary } from "@/components/shared/error-boundary"

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-muted to-white">
      <ErrorBoundary
        fallbackTitle="Veiklos klaida"
        fallbackMessage="Įvyko netikėta klaida. Pabandykite atnaujinti puslapį arba prisijungti iš naujo."
      >
        {children}
      </ErrorBoundary>
    </main>
  )
}
