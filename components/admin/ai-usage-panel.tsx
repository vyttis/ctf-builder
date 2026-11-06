"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Settings {
  ai_monthly_budget_usd: number
  ai_user_monthly_limit: number
  ai_budget_alert_ratio: number
}

interface UserUsage {
  userId: string
  name: string
  email: string | null
  role: string | null
  actions: number
  calls: number
  costUsd: number
  limit: number | null
}

interface UsageResponse {
  settings: Settings
  spentUsd: number
  month: string
  resetsOn: string
  users: UserUsage[]
}

const usd = new Intl.NumberFormat("lt-LT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Monthly DI spend against the budget, per-person use and the limits. */
export function AiUsagePanel() {
  const { toast } = useToast()
  const [data, setData] = useState<UsageResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [budget, setBudget] = useState("")
  const [userLimit, setUserLimit] = useState("")
  const [alertPct, setAlertPct] = useState("")
  const [saving, setSaving] = useState(false)
  const [limitDrafts, setLimitDrafts] = useState<Record<string, string>>({})
  const [savingUser, setSavingUser] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-usage", { cache: "no-store" })
      const body = (await res.json()) as UsageResponse & { error?: string }
      if (!res.ok) throw new Error(body.error ?? "Nepavyko gauti duomenų.")
      setData(body)
      setBudget(String(body.settings.ai_monthly_budget_usd))
      setUserLimit(String(body.settings.ai_user_monthly_limit))
      setAlertPct(String(Math.round(body.settings.ai_budget_alert_ratio * 100)))
      setLimitDrafts(Object.fromEntries(body.users.map((u) => [u.userId, u.limit === null ? "" : String(u.limit)])))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nepavyko gauti duomenų.")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_monthly_budget_usd: Number(budget.replace(",", ".")),
          ai_user_monthly_limit: Number(userLimit),
          ai_budget_alert_ratio: Number(alertPct) / 100,
        }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(body.error ?? "Nepavyko išsaugoti.")
      toast({ title: "Nustatymai išsaugoti" })
      await load()
    } catch (err) {
      toast({ title: "Klaida", description: err instanceof Error ? err.message : "Nepavyko.", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function saveUserLimit(userId: string) {
    const draft = (limitDrafts[userId] ?? "").trim()
    setSavingUser(userId)
    try {
      const res = await fetch(`/api/admin/users/${userId}/ai-limit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_monthly_limit: draft === "" ? null : Number(draft) }),
      })
      const body = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(body.error ?? "Nepavyko išsaugoti.")
      toast({ title: "Limitas išsaugotas" })
      await load()
    } catch (err) {
      toast({ title: "Klaida", description: err instanceof Error ? err.message : "Nepavyko.", variant: "destructive" })
    } finally {
      setSavingUser(null)
    }
  }

  if (error) {
    return (
      <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
        {error}
      </p>
    )
  }
  if (!data) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        Kraunama...
      </div>
    )
  }

  const ratio = data.settings.ai_monthly_budget_usd > 0 ? data.spentUsd / data.settings.ai_monthly_budget_usd : 1
  const pct = Math.min(100, Math.round(ratio * 100))
  const barColor = ratio >= 1 ? "bg-accent" : ratio >= data.settings.ai_budget_alert_ratio ? "bg-highlight" : "bg-primary"

  return (
    <div className="space-y-10">
      <section aria-labelledby="spend-title" className="space-y-3 rounded-xl border border-border/60 bg-white p-5">
        <h2 id="spend-title" className="text-lg font-semibold text-steam-dark">
          Išleista {data.month} mėnesį
        </h2>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-3xl font-bold text-steam-dark">{usd.format(data.spentUsd)} USD</p>
          <p className="text-sm text-muted-foreground">
            iš {usd.format(data.settings.ai_monthly_budget_usd)} USD, {pct} %
          </p>
        </div>
        <div
          className="h-3 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Išnaudota mėnesio DI biudžeto dalis"
        >
          <div className={cn("h-full rounded-full", barColor)} style={{ width: `${Math.max(2, pct)}%` }} />
        </div>
        <p className="text-sm text-muted-foreground">
          {ratio >= 1
            ? `Biudžetas išnaudotas: DI vedėjams išjungtas iki ${data.resetsOn} Padidinus biudžetą, DI įsijungs iš karto.`
            : `Pasiekus ${Math.round(data.settings.ai_budget_alert_ratio * 100)} % gausite įspėjimą el. paštu, pasiekus 100 % DI vedėjams išsijungs iki mėnesio pabaigos.`}
        </p>
      </section>

      <section aria-labelledby="settings-title" className="space-y-4">
        <h2 id="settings-title" className="text-lg font-semibold text-steam-dark">
          Limitai
        </h2>
        <form
          onSubmit={saveSettings}
          className="grid grid-cols-1 gap-4 rounded-xl border border-border/60 bg-white p-5 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
        >
          <div className="space-y-1.5">
            <Label htmlFor="ai-budget">Mėnesio biudžetas, USD</Label>
            <Input id="ai-budget" inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-user-limit">Vedėjui per mėnesį, užklausų</Label>
            <Input
              id="ai-user-limit"
              type="number"
              min={0}
              inputMode="numeric"
              value={userLimit}
              onChange={(e) => setUserLimit(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ai-alert">Įspėti pasiekus, %</Label>
            <Input
              id="ai-alert"
              type="number"
              min={10}
              max={100}
              inputMode="numeric"
              value={alertPct}
              onChange={(e) => setAlertPct(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Išsaugoti"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Užklausa yra vienas vedėjo veiksmas su DI: užduočių generavimas, pamokos planas, dokumento importas. Pakartotinis
          užduoties tikrinimas limito nemažina, bet kainuoja ir įskaičiuojamas į biudžetą.
        </p>
      </section>

      <section aria-labelledby="users-title" className="space-y-4">
        <h2 id="users-title" className="text-lg font-semibold text-steam-dark">
          Vedėjai šį mėnesį
        </h2>
        {data.users.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-white px-4 py-8 text-center text-sm text-muted-foreground">
            Aktyvių vedėjų dar nėra.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-white">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-3 font-medium">Vedėjas</th>
                  <th scope="col" className="px-4 py-3 font-medium">Užklausos</th>
                  <th scope="col" className="px-4 py-3 font-medium">Kaina</th>
                  <th scope="col" className="px-4 py-3 font-medium">Asmeninis limitas</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => {
                  const unlimited = u.role === "super_admin"
                  const effective = u.limit ?? data.settings.ai_user_monthly_limit
                  return (
                    <tr key={u.userId} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-steam-dark">{u.name}</p>
                        {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {unlimited ? u.actions : `${u.actions} iš ${effective}`}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{usd.format(u.costUsd)} USD</td>
                      <td className="px-4 py-3">
                        {unlimited ? (
                          <span className="text-sm text-muted-foreground">Be limito (super administratorius)</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Input
                              aria-label={`Asmeninis limitas: ${u.name}`}
                              type="number"
                              min={0}
                              inputMode="numeric"
                              placeholder={`Numatytasis (${data.settings.ai_user_monthly_limit})`}
                              value={limitDrafts[u.userId] ?? ""}
                              onChange={(e) => setLimitDrafts((d) => ({ ...d, [u.userId]: e.target.value }))}
                              className="h-9 w-40"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => saveUserLimit(u.userId)}
                              disabled={savingUser === u.userId}
                            >
                              {savingUser === u.userId ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Išsaugoti"}
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Sąraše yra visi aktyvūs vedėjai, ir tie, kurie DI dar nenaudojo, todėl limitą galima nustatyti iš anksto. Tuščias laukas reiškia numatytąjį limitą.
        </p>
      </section>
    </div>
  )
}
