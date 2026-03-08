"use client"

import { ErrorBoundary } from "@/components/shared/error-boundary"

export default function PlayerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F8FAFB] to-white">
      <ErrorBoundary
        fallbackTitle="Žaidimo klaida"
        fallbackMessage="Įvyko netikėta klaida. Pabandykite atnaujinti puslapį arba prisijungti iš naujo."
      >
        {children}
      </ErrorBoundary>
    </div>
  )
}
