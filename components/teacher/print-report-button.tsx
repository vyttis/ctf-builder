"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintReportButton() {
  return (
    <Button
      onClick={() => window.print()}
      className="bg-primary hover:bg-primary/90 text-white gap-2 print:hidden"
    >
      <Printer className="h-4 w-4" />
      Spausdinti / Išsaugoti PDF
    </Button>
  )
}
