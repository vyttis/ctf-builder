"use client"

import { ErrorBoundary } from "@/components/shared/error-boundary"

export function TeacherErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackTitle="Klaida"
      fallbackMessage="Įvyko netikėta klaida. Pabandykite atnaujinti puslapį."
    >
      {children}
    </ErrorBoundary>
  )
}
