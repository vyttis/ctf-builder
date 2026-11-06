"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Clock,
  Lightbulb,
  Loader2,
  MapPin,
  Puzzle,
  RotateCcw,
  Trash2,
  User,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
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
import { pluralizeLt } from "@/lib/utils"
import { getSubjectLabel } from "@/lib/curriculum/subjects"
import type { ChallengeSnapshot, LibraryItem, LibraryItemStatus } from "@/types/game"

const PAGE_SIZE = 20

const TABS: { status: LibraryItemStatus; label: string; empty: string }[] = [
  { status: "pending_review", label: "Laukia", empty: "Nėra šablonų, laukiančių peržiūros." },
  { status: "approved", label: "Patvirtinti", empty: "Patvirtintų šablonų dar nėra." },
  { status: "rejected", label: "Atmesti", empty: "Atmestų šablonų nėra." },
]

const TYPE_LABELS: Record<string, string> = {
  text: "Tekstas",
  number: "Skaičius",
  multiple_choice: "Pasirinkimas",
}

type ListState = {
  items: LibraryItem[]
  total: number
  page: number
  loading: boolean
  error: string | null
}

type Pending =
  | { kind: "reject"; item: LibraryItem }
  | { kind: "delete"; item: LibraryItem }
  | null

const uzduotis = (n: number) => `${n} ${pluralizeLt(n, "užduotis", "užduotys", "užduočių")}`

/**
 * Library moderation: every task of a template in full (text, choices,
 * hints, images), tabs for waiting, approved and rejected templates, and the
 * actions that fit each: approve or reject (with a required note for the
 * author), return to review, and remove (super administrator).
 */
export function LibraryModeration({ canDelete }: { canDelete: boolean }) {
  const { toast } = useToast()
  const [tab, setTab] = useState<LibraryItemStatus>("pending_review")
  const [lists, setLists] = useState<Record<LibraryItemStatus, ListState>>(() => ({
    pending_review: { items: [], total: 0, page: 0, loading: true, error: null },
    approved: { items: [], total: 0, page: 0, loading: true, error: null },
    rejected: { items: [], total: 0, page: 0, loading: true, error: null },
  }))
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pending, setPending] = useState<Pending>(null)
  const [note, setNote] = useState("")
  const [noteError, setNoteError] = useState<string | null>(null)

  // The newest request per tab wins: an older answer arriving later (a
  // reload after an action while "Rodyti daugiau" runs) is dropped.
  const requestSeq = useRef<Record<LibraryItemStatus, number>>({ pending_review: 0, approved: 0, rejected: 0 })

  const load = useCallback(async (status: LibraryItemStatus, page: number) => {
    const seq = ++requestSeq.current[status]
    const stale = () => seq !== requestSeq.current[status]
    setLists((prev) => ({ ...prev, [status]: { ...prev[status], loading: true, error: null } }))
    try {
      const res = await fetch(`/api/library?status=${status}&page=${page}&limit=${PAGE_SIZE}`, { cache: "no-store" })
      const data = (await res.json().catch(() => ({}))) as {
        items?: LibraryItem[]
        total?: number
        error?: string
      }
      if (stale()) return
      if (!res.ok || !Array.isArray(data.items)) {
        throw new Error(data.error ?? "Nepavyko gauti šablonų.")
      }
      const items = data.items
      setLists((prev) => ({
        ...prev,
        [status]: {
          items: page === 1 ? items : [...prev[status].items, ...items],
          total: data.total ?? items.length,
          page,
          loading: false,
          error: null,
        },
      }))
    } catch (error) {
      if (stale()) return
      setLists((prev) => ({
        ...prev,
        [status]: {
          ...prev[status],
          loading: false,
          error: error instanceof Error ? error.message : "Nepavyko gauti šablonų.",
        },
      }))
    }
  }, [])

  useEffect(() => {
    for (const t of TABS) void load(t.status, 1)
  }, [load])

  // An item leaves one list and joins another: both lists reload, so counts
  // and order stay right.
  function moved(from: LibraryItemStatus, to: LibraryItemStatus | null) {
    void load(from, 1)
    if (to) void load(to, 1)
  }

  async function review(item: LibraryItem, status: LibraryItemStatus, reviewNote?: string) {
    if (busyId !== null) return false
    setBusyId(item.id)
    try {
      const res = await fetch(`/api/library/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, review_notes: reviewNote }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Nepavyko išsaugoti sprendimo.")
      toast({
        title:
          status === "approved"
            ? "Šablonas patvirtintas"
            : status === "rejected"
              ? "Šablonas atmestas"
              : "Grąžinta peržiūrai",
        description:
          status === "approved"
            ? "Jis dabar matomas bibliotekoje."
            : status === "rejected"
              ? "Autorius matys pastabą skiltyje „Mano pateikimai“."
              : "Šablonas vėl laukia sprendimo ir bibliotekoje nerodomas.",
      })
      moved(item.status, status)
      return true
    } catch (error) {
      toast({
        title: "Nepavyko",
        description: error instanceof Error ? error.message : "Bandykite dar kartą.",
        variant: "destructive",
      })
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function remove(item: LibraryItem) {
    if (busyId !== null) return false
    setBusyId(item.id)
    try {
      const res = await fetch(`/api/library/${item.id}`, { method: "DELETE" })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Nepavyko pašalinti šablono.")
      toast({ title: "Šablonas pašalintas", description: "Iš jo jau sukurtos veiklos lieka vedėjams." })
      moved(item.status, null)
      return true
    } catch (error) {
      toast({
        title: "Nepavyko",
        description: error instanceof Error ? error.message : "Bandykite dar kartą.",
        variant: "destructive",
      })
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function confirmPending() {
    if (!pending) return
    if (pending.kind === "reject") {
      const text = note.trim()
      if (text.length < 5) {
        setNoteError("Parašykite autoriui, ką pataisyti (bent 5 ženklai).")
        return
      }
      if (await review(pending.item, "rejected", text)) setPending(null)
    } else if (await remove(pending.item)) {
      setPending(null)
    }
  }

  const current = lists[tab]
  const currentTab = TABS.find((t) => t.status === tab)!

  return (
    <div>
      <Link href="/admin" className="inline-block mb-6">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Administravimas
        </Button>
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-steam-dark flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-highlight-ink" aria-hidden="true" />
          Bibliotekos moderavimas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Peržiūrėkite vedėjų pateiktus veiklų šablonus prieš juos parodant bibliotekoje.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as LibraryItemStatus)} className="mb-6">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
          {TABS.map((t) => (
            <TabsTrigger key={t.status} value={t.status} className="gap-1.5">
              {t.label}
              {!lists[t.status].loading && !lists[t.status].error && (
                <span className="rounded-full bg-muted px-1.5 text-xs tabular-nums text-muted-foreground">
                  {lists[t.status].total}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {current.error ? (
        <div role="alert" className="rounded-lg border border-accent/30 bg-accent/5 p-6 text-center">
          <p className="text-sm text-steam-dark mb-3">{current.error}</p>
          <Button variant="outline" size="sm" onClick={() => void load(tab, 1)}>
            Bandyti dar kartą
          </Button>
        </div>
      ) : current.loading && current.items.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-ink" aria-label="Kraunama" />
        </div>
      ) : current.items.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle className="h-12 w-12 mx-auto text-primary-ink/30 mb-3" aria-hidden="true" />
          <p className="text-muted-foreground text-sm">{currentTab.empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {current.items.map((item) => (
            <TemplateCard
              key={item.id}
              item={item}
              busy={busyId === item.id}
              locked={busyId !== null}
              canDelete={canDelete}
              onApprove={() => void review(item, "approved")}
              onReject={() => {
                setNote("")
                setNoteError(null)
                setPending({ kind: "reject", item })
              }}
              onReturn={() => void review(item, "pending_review")}
              onDelete={() => setPending({ kind: "delete", item })}
            />
          ))}
          {current.items.length < current.total && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => void load(tab, current.page + 1)} disabled={current.loading}>
                {current.loading && <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />}
                Rodyti daugiau ({current.total - current.items.length})
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={pending !== null} onOpenChange={(open) => !open && busyId === null && setPending(null)}>
        <DialogContent>
          {pending?.kind === "reject" ? (
            <>
              <DialogHeader>
                <DialogTitle>Atmesti šabloną „{pending.item.title}“?</DialogTitle>
                <DialogDescription>
                  Autorius matys šią pastabą skiltyje „Mano pateikimai“ ir galės šabloną pataisyti.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="reject-note">Pastaba autoriui</Label>
                <Textarea
                  id="reject-note"
                  value={note}
                  onChange={(e) => {
                    setNote(e.target.value)
                    if (noteError) setNoteError(null)
                  }}
                  rows={4}
                  maxLength={1000}
                  aria-invalid={noteError ? true : undefined}
                  aria-describedby={noteError ? "reject-note-error" : undefined}
                  placeholder="Pvz.: 3 užduoties atsakymas neteisingas, trūksta paveikslėlio."
                />
                {noteError && (
                  <p id="reject-note-error" className="text-xs text-accent-ink">
                    {noteError}
                  </p>
                )}
              </div>
            </>
          ) : pending?.kind === "delete" ? (
            <DialogHeader>
              <DialogTitle>Pašalinti šabloną „{pending.item.title}“?</DialogTitle>
              <DialogDescription>
                Šablonas dings iš bibliotekos visam laikui. Iš jo jau sukurtos vedėjų veiklos liks.
              </DialogDescription>
            </DialogHeader>
          ) : null}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPending(null)} disabled={busyId !== null}>
              Atšaukti
            </Button>
            <Button variant="destructive" onClick={() => void confirmPending()} disabled={busyId !== null} className="gap-2">
              {busyId !== null && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {pending?.kind === "delete" ? "Pašalinti" : "Atmesti"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TemplateCard({
  item,
  busy,
  locked,
  canDelete,
  onApprove,
  onReject,
  onReturn,
  onDelete,
}: {
  item: LibraryItem
  /** This template's action is running. */
  busy: boolean
  /** Some action is running: one decision at a time. */
  locked: boolean
  canDelete: boolean
  onApprove: () => void
  onReject: () => void
  onReturn: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(item.status === "pending_review")
  const tasks = Array.isArray(item.challenge_data)
    ? [...item.challenge_data].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    : []
  const panelId = `template-tasks-${item.id}`

  return (
    <Card className="border-border/50 bg-white">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-3">
          <h2 className="font-semibold text-steam-dark text-lg">{item.title}</h2>
          {item.description && <p className="text-sm text-muted-foreground mt-1">{item.description}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" aria-hidden="true" />
            {item.publisher_name}
          </span>
          <span className="flex items-center gap-1">
            <Puzzle className="h-3 w-3" aria-hidden="true" />
            {uzduotis(tasks.length)}
          </span>
          {item.subject && (
            <Badge variant="outline" className="text-xs">
              {getSubjectLabel(item.subject)}
            </Badge>
          )}
          {item.grade_level && (
            <Badge variant="outline" className="text-xs">
              {item.grade_level} kl.
            </Badge>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" aria-hidden="true" />
            Pateikta {new Date(item.created_at).toLocaleDateString("lt-LT", { timeZone: "Europe/Vilnius" })}
          </span>
          {item.status === "approved" && <span>Nukopijuota: {item.clone_count} k.</span>}
        </div>

        {item.status === "rejected" && item.review_notes && (
          <p className="mb-4 rounded-lg border border-accent/20 bg-accent/5 p-3 text-sm text-steam-dark">
            <span className="font-medium text-accent-ink">Pastaba autoriui:</span> {item.review_notes}
          </p>
        )}

        {tasks.length > 0 && (
          <div className="mb-4 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={panelId}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-steam-dark hover:bg-muted/40 rounded-lg"
            >
              Užduotys ({tasks.length})
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {open && (
              <ol id={panelId} className="divide-y divide-border/60 border-t border-border/60">
                {tasks.map((task, i) => (
                  <TaskPreview key={i} task={task} index={i} />
                ))}
              </ol>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {item.status === "pending_review" && (
            <>
              <Button onClick={onApprove} disabled={locked} className="gap-2">
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                )}
                Patvirtinti
              </Button>
              <Button
                variant="outline"
                onClick={onReject}
                disabled={locked}
                className="gap-2 border-accent/30 text-accent-ink hover:bg-accent/5"
              >
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Atmesti
              </Button>
            </>
          )}
          {item.status !== "pending_review" && (
            <Button variant="outline" onClick={onReturn} disabled={locked} className="gap-2">
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              )}
              Grąžinti peržiūrai
            </Button>
          )}
          {canDelete && (
            <Button
              variant="ghost"
              onClick={onDelete}
              disabled={locked}
              className="gap-2 text-accent-ink hover:text-accent-ink hover:bg-accent/5 sm:ml-auto"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Pašalinti
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function TaskPreview({ task, index }: { task: ChallengeSnapshot; index: number }) {
  const hints = Array.isArray(task.hints) ? task.hints.filter((h) => typeof h === "string" && h.trim()) : []
  const options = Array.isArray(task.options) ? task.options : []
  return (
    <li className="px-4 py-3 text-sm">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-ink">
          {index + 1}
        </span>
        <span className="font-medium text-steam-dark">{task.title}</span>
        <Badge variant="secondary" className="text-[10px]">
          {TYPE_LABELS[task.type] ?? task.type}
        </Badge>
        <Badge variant="outline" className="text-[10px]">
          {task.points} tšk.
        </Badge>
      </div>
      {task.description && (
        <p className="whitespace-pre-wrap text-muted-foreground pl-8">{task.description}</p>
      )}
      {task.type === "multiple_choice" && options.length > 0 && (
        <ul className="mt-2 space-y-0.5 pl-8 text-steam-dark">
          {options.map((option, i) => (
            <li key={i}>
              {String.fromCharCode(65 + i)}. {option}
            </li>
          ))}
        </ul>
      )}
      {hints.length > 0 && (
        <div className="mt-2 pl-8">
          <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Lightbulb className="h-3 w-3" aria-hidden="true" />
            Užuominos
          </p>
          <ol className="mt-0.5 list-decimal space-y-0.5 pl-5 text-xs text-steam-dark">
            {hints.map((hint, i) => (
              <li key={i}>{hint}</li>
            ))}
          </ol>
        </div>
      )}
      {task.image_url && <TaskImage url={task.image_url} index={index} />}
      {task.maps_url && (
        <a
          href={task.maps_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 ml-8 flex items-center gap-1 text-xs text-secondary-ink underline"
        >
          <MapPin className="h-3 w-3" aria-hidden="true" />
          Žemėlapis
        </a>
      )}
    </li>
  )
}

/** Images uploaded to the platform's storage. */
function isOwnStorage(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !!base && url.startsWith(`${base.replace(/\/$/, "")}/storage/`)
}

/**
 * An image from the platform's storage shows at once; one from another site
 * loads only on request, so opening a submission does not tell its author
 * (or anyone else) when and from where it is being reviewed.
 */
function TaskImage({ url, index }: { url: string; index: number }) {
  const own = isOwnStorage(url)
  const [shown, setShown] = useState(own)
  let host = ""
  try {
    host = new URL(url).host
  } catch {
    return null
  }
  if (!shown) {
    return (
      <Button variant="outline" size="sm" className="mt-2 ml-8" onClick={() => setShown(true)}>
        Rodyti paveikslėlį iš {host}
      </Button>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 ml-8 inline-block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`${index + 1} užduoties paveikslėlis`}
        referrerPolicy="no-referrer"
        className="max-h-48 max-w-full rounded-md border border-border/60 object-contain bg-muted/30"
        loading="lazy"
      />
    </a>
  )
}
