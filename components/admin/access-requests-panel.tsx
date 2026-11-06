"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Check, Loader2, X } from "lucide-react"

type RequestStatus = "pending" | "approved" | "rejected"

interface AccessRequestRow {
  id: string
  email: string
  first_name: string
  last_name: string
  school_name: string | null
  municipality: string | null
  source: "finish_screen" | "qr" | "link"
  status: RequestStatus
  review_note: string | null
  created_at: string
  reviewed_at: string | null
  games: { title: string; game_code: string } | null
  request_links: { label: string } | null
  account_status: "pending" | "active" | "blocked" | null
}

const dateFormat = new Intl.DateTimeFormat("lt-LT", { dateStyle: "medium", timeStyle: "short" })

function sourceText(r: AccessRequestRow): string {
  if (r.source === "link") return `Nuoroda „${r.request_links?.label ?? "be pavadinimo"}“`
  const activity = r.games ? `„${r.games.title}“ (${r.games.game_code})` : "veikla"
  return r.source === "qr" ? `Veiklos QR: ${activity}` : `Veiklos pabaiga: ${activity}`
}

const TABS: { value: RequestStatus; label: string }[] = [
  { value: "pending", label: "Laukia" },
  { value: "approved", label: "Patvirtinti" },
  { value: "rejected", label: "Atmesti" },
]

export function AccessRequestsPanel({ onPendingChange }: { onPendingChange?: (n: number) => void }) {
  const { toast } = useToast()
  const router = useRouter()
  const [tab, setTab] = useState<RequestStatus>("pending")
  const [rows, setRows] = useState<AccessRequestRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ row: AccessRequestRow; action: "approve" | "reject" } | null>(null)
  const [note, setNote] = useState("")

  const load = useCallback(
    async (status: RequestStatus) => {
      try {
        const res = await fetch(`/api/admin/access-requests?status=${status}`, { cache: "no-store" })
        const data = (await res.json()) as { requests?: AccessRequestRow[]; error?: string }
        if (!res.ok) throw new Error(data.error ?? "Nepavyko gauti prašymų.")
        setRows(data.requests ?? [])
        if (status === "pending") onPendingChange?.(data.requests?.length ?? 0)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Nepavyko gauti prašymų.")
        setRows([])
      }
    },
    [onPendingChange],
  )

  useEffect(() => {
    void load(tab)
  }, [tab, load])

  async function decide() {
    if (!confirm) return
    const { row, action } = confirm
    setBusyId(row.id)
    try {
      const res = await fetch(`/api/admin/access-requests/${row.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "approve" ? { action } : { action, note: note.trim() || undefined }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string }
      if (!res.ok) throw new Error(data.error ?? "Nepavyko.")
      toast({
        title: action === "approve" ? "Prašymas patvirtintas" : "Prašymas atmestas",
        description: data.message,
      })
      setRows((prev) => {
        const next = (prev ?? []).filter((r) => r.id !== row.id)
        if (tab === "pending") onPendingChange?.(next.length)
        return next
      })
      setConfirm(null)
      setNote("")
      // Updates the pending count in the navigation.
      router.refresh()
    } catch (e) {
      toast({ title: "Klaida", description: e instanceof Error ? e.message : "Nepavyko.", variant: "destructive" })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section aria-labelledby="requests-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="requests-title" className="text-lg font-semibold text-steam-dark">
          Paskyrų prašymai
        </h2>
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setRows(null)
            setError(null)
            setTab(v as RequestStatus)
          }}
        >
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {rows === null ? (
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Kraunama...
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted-foreground">
          {tab === "pending"
            ? "Naujų prašymų nėra. Mokytojai gali juos pateikti veiklos pabaigoje, per veiklos QR arba per jūsų sukurtą nuorodą."
            : "Čia dar nieko nėra."}
        </p>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-white">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="font-medium text-steam-dark">
                  {r.first_name} {r.last_name}
                </p>
                <p className="break-all text-sm text-muted-foreground">{r.email}</p>
                <p className="text-sm text-steam-dark">
                  {r.school_name ?? "Mokykla nenurodyta"}
                  {r.municipality ? `, ${r.municipality}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {sourceText(r)}. Pateikta {dateFormat.format(new Date(r.created_at))}
                </p>
                {r.account_status === "active" && tab === "pending" && (
                  <p className="text-xs font-medium text-secondary">Šis el. paštas jau turi aktyvią paskyrą.</p>
                )}
                {r.account_status === "pending" && tab === "pending" && (
                  <p className="text-xs font-medium text-secondary">
                    Jau bandė prisijungti: patvirtinus paskyra bus aktyvuota be kvietimo laiško.
                  </p>
                )}
                {r.account_status === "blocked" && (
                  <p className="text-xs font-medium text-destructive">Šio el. pašto paskyra užblokuota.</p>
                )}
                {r.review_note && <p className="text-xs text-muted-foreground">Pastaba: {r.review_note}</p>}
              </div>
              {tab === "pending" && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === r.id}
                    onClick={() => {
                      setNote("")
                      setConfirm({ row: r, action: "reject" })
                    }}
                    className="gap-1.5"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    Atmesti
                  </Button>
                  <Button
                    size="sm"
                    disabled={busyId === r.id}
                    onClick={() => setConfirm({ row: r, action: "approve" })}
                    className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Patvirtinti
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          {confirm && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {confirm.action === "approve" ? "Patvirtinti prašymą?" : "Atmesti prašymą?"}
                </DialogTitle>
                <DialogDescription>
                  {confirm.action === "approve"
                    ? confirm.row.account_status
                      ? `Paskyra ${confirm.row.email} bus aktyvuota.`
                      : `Į ${confirm.row.email} išsiųsime kvietimą. Paspaudęs nuorodą mokytojas užbaigs registraciją.`
                    : `${confirm.row.first_name} ${confirm.row.last_name} laiško negaus. Prašymą rasite skiltyje „Atmesti“.`}
                </DialogDescription>
              </DialogHeader>
              {confirm.action === "reject" && (
                <Textarea
                  aria-label="Pastaba sau (nebūtina)"
                  placeholder="Pastaba sau (nebūtina)"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  rows={3}
                />
              )}
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setConfirm(null)}>
                  Atšaukti
                </Button>
                <Button
                  onClick={decide}
                  disabled={busyId !== null}
                  className={
                    confirm.action === "approve"
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-destructive text-white hover:bg-destructive/90"
                  }
                >
                  {busyId ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : confirm.action === "approve" ? (
                    "Patvirtinti"
                  ) : (
                    "Atmesti"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
