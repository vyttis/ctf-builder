"use client"

import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw } from "lucide-react"

interface LiveConnectionBannerProps {
  onRetry: () => void
  className?: string
  /** "dark": solid colours for the class screen's dark background. */
  tone?: "light" | "dark"
}

// Shown when a realtime subscription degrades — data falls back to polling.
export function LiveConnectionBanner({ onRetry, className = "", tone = "light" }: LiveConnectionBannerProps) {
  const dark = tone === "dark"
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
        dark
          ? "border-highlight bg-highlight text-highlight-foreground"
          : "border-highlight/40 bg-highlight/10 text-steam-dark"
      } ${className}`}
      role="status"
    >
      <WifiOff className={`h-4 w-4 shrink-0 ${dark ? "text-highlight-foreground" : "text-highlight-ink"}`} aria-hidden="true" />
      <span className="flex-1">
        Tiesioginis ryšys nutrūko, duomenys atnaujinami kas 30 s.
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="gap-1.5 text-xs shrink-0"
      >
        <RefreshCw className="h-3 w-3" />
        Bandyti dar kartą
      </Button>
    </div>
  )
}
