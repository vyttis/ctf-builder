"use client"

import { useEffect, useState } from "react"
import { pluralizeLt } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Quota {
  used: number
  limit: number | null
  remaining: number | null
  resetsOn: string
  blocked: "ai_budget" | "ai_user_limit" | null
}

/**
 * One line under a DI button: how many DI actions are left this month.
 * Nothing for the super admin (no limit) or while it loads.
 */
export function AiQuotaNote({ className, refreshKey }: { className?: string; refreshKey?: unknown }) {
  const [quota, setQuota] = useState<Quota | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch("/api/ai/usage", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((q: Quota | null) => {
        if (!cancelled) setQuota(q)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  if (!quota) return null
  if (quota.blocked === "ai_budget") {
    return (
      <p className={cn("text-xs text-accent-ink", className)} role="status">
        Šį mėnesį platformos DI biudžetas išnaudotas. DI vėl veiks nuo {quota.resetsOn}
      </p>
    )
  }
  if (quota.limit === null || quota.remaining === null) return null
  if (quota.blocked === "ai_user_limit") {
    return (
      <p className={cn("text-xs text-accent-ink", className)} role="status">
        Šio mėnesio DI užklausos panaudotos. Limitas atsinaujins {quota.resetsOn}
      </p>
    )
  }
  const word = pluralizeLt(quota.remaining, "DI užklausa", "DI užklausos", "DI užklausų")
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Šį mėnesį liko {quota.remaining} {word} iš {quota.limit}.
    </p>
  )
}
