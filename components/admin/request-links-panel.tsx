"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getPublicUrl } from "@/lib/game/play-url"
import { Copy, Link2, Loader2, Plus } from "lucide-react"

interface RequestLink {
  id: string
  token: string
  label: string
  expires_at: string | null
  revoked_at: string | null
  max_uses: number | null
  created_at: string
  uses: number
}

const dateFormat = new Intl.DateTimeFormat("lt-LT", { dateStyle: "medium" })

const EXPIRY_OPTIONS = [
  { value: "7", label: "7 dienos" },
  { value: "30", label: "30 dienų" },
  { value: "90", label: "90 dienų" },
  { value: "none", label: "Be termino" },
]

function linkState(l: RequestLink): { open: boolean; text: string } {
  if (l.revoked_at) return { open: false, text: "Atšaukta" }
  if (l.expires_at && new Date(l.expires_at).getTime() <= Date.now()) return { open: false, text: "Pasibaigė" }
  if (l.max_uses !== null && l.uses >= l.max_uses) return { open: false, text: "Išnaudota" }
  return { open: true, text: l.expires_at ? `Galioja iki ${dateFormat.format(new Date(l.expires_at))}` : "Galioja" }
}

/**
 * Secret request links: the super admin creates one per group of teachers
 * (a school, a course), sends it by email, and can revoke it any time.
 */
export function RequestLinksPanel() {
  const { toast } = useToast()
  const [links, setLinks] = useState<RequestLink[] | null>(null)
  const [label, setLabel] = useState("")
  const [expiry, setExpiry] = useState("30")
  const [maxUses, setMaxUses] = useState("")
  const [creating, setCreating] = useState(false)
  const [revoke, setRevoke] = useState<RequestLink | null>(null)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    fetch("/api/admin/request-links", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { links?: RequestLink[] }) => setLinks(d.links ?? []))
      .catch(() => setLinks([]))
  }, [])

  async function copy(l: RequestLink) {
    const url = getPublicUrl(`/prasymas/${l.token}`)
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: "Nuoroda nukopijuota", description: url })
    } catch {
      toast({ title: "Nukopijuokite ranka", description: url })
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch("/api/admin/request-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label,
          expires_in_days: expiry === "none" ? null : Number(expiry),
          max_uses: maxUses ? Number(maxUses) : null,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { link?: RequestLink; error?: string }
      if (!res.ok || !data.link) throw new Error(data.error ?? "Nepavyko sukurti nuorodos.")
      setLinks((prev) => [data.link!, ...(prev ?? [])])
      setLabel("")
      setMaxUses("")
      await copy(data.link)
    } catch (err) {
      toast({ title: "Klaida", description: err instanceof Error ? err.message : "Nepavyko.", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  async function doRevoke() {
    if (!revoke) return
    setRevoking(true)
    try {
      const res = await fetch(`/api/admin/request-links/${revoke.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      const now = new Date().toISOString()
      setLinks((prev) => (prev ?? []).map((l) => (l.id === revoke.id ? { ...l, revoked_at: now } : l)))
      toast({ title: "Nuoroda atšaukta" })
      setRevoke(null)
    } catch {
      toast({ title: "Nepavyko atšaukti nuorodos", variant: "destructive" })
    } finally {
      setRevoking(false)
    }
  }

  return (
    <section aria-labelledby="links-title" className="space-y-4">
      <div className="space-y-1">
        <h2 id="links-title" className="text-lg font-semibold text-steam-dark">
          Prašymo nuorodos
        </h2>
        <p className="text-sm text-muted-foreground">
          Slapta nuoroda, kurią galite nusiųsti mokytojams el. paštu. Kas turi nuorodą, gali pateikti prašymą; paskyrą
          vis tiek tvirtinate jūs.
        </p>
      </div>

      <form onSubmit={create} className="grid grid-cols-1 gap-3 rounded-xl border border-border/60 bg-white p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="link-label">Kam skirta</Label>
          <Input
            id="link-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Pvz., Gargždų mokyklų mokytojai"
            maxLength={120}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="link-expiry">Galioja</Label>
          <select
            id="link-expiry"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {EXPIRY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="link-max">Daugiausia prašymų</Label>
          <Input
            id="link-max"
            type="number"
            min={1}
            max={10000}
            inputMode="numeric"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Neribota"
            className="sm:w-36"
          />
        </div>
        <Button
          type="submit"
          disabled={creating || label.trim().length < 2}
          className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
          Sukurti ir kopijuoti
        </Button>
      </form>

      {links === null ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground" role="status">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Kraunama...
        </div>
      ) : links.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nuorodų dar nėra.</p>
      ) : (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-white">
          {links.map((l) => {
            const state = linkState(l)
            return (
              <li key={l.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <p className="flex items-center gap-2 font-medium text-steam-dark">
                    <Link2 className="h-4 w-4 shrink-0 text-secondary-ink" aria-hidden="true" />
                    {l.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {state.text}. Prašymų: {l.uses}
                    {l.max_uses !== null ? ` iš ${l.max_uses}` : ""}. Sukurta {dateFormat.format(new Date(l.created_at))}
                  </p>
                </div>
                {state.open && (
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="outline" onClick={() => copy(l)} className="gap-1.5">
                      <Copy className="h-4 w-4" aria-hidden="true" />
                      Kopijuoti
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setRevoke(l)} className="text-destructive">
                      Atšaukti
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={revoke !== null} onOpenChange={(open) => !open && setRevoke(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Atšaukti nuorodą?</DialogTitle>
            <DialogDescription>
              Nuoroda „{revoke?.label}“ nebeveiks. Jau pateikti prašymai liks sąraše.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRevoke(null)}>
              Palikti
            </Button>
            <Button onClick={doRevoke} disabled={revoking} className="bg-destructive text-white hover:bg-destructive/90">
              {revoking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Atšaukti nuorodą"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
