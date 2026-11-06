"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, School as SchoolIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SchoolValue {
  school_code: string | null
  school_name: string
  municipality: string | null
}

interface Match {
  code: string
  name: string
  municipality: string
}

interface SchoolPickerProps {
  id: string
  value: SchoolValue | null
  onChange: (value: SchoolValue | null) => void
  invalid?: boolean
}

let municipalitiesCache: string[] | null = null

/**
 * Pick a school from the ŠVIS registry by typing part of its name or town.
 * A school that is not in the registry (e.g. a non-formal education centre)
 * can be typed in by hand with its municipality.
 */
export function SchoolPicker({ id, value, onChange, invalid }: SchoolPickerProps) {
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [manual, setManual] = useState(() => Boolean(value && !value.school_code && value.school_name))
  const [query, setQuery] = useState("")
  const [matches, setMatches] = useState<Match[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [municipalities, setMunicipalities] = useState<string[]>(municipalitiesCache ?? [])

  // Search as the person types, a little after they stop.
  useEffect(() => {
    if (manual) return
    const q = query.trim()
    if (q.length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/schools?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        const data = (await res.json()) as { schools?: Match[] }
        setMatches(data.schools ?? [])
        setActive(-1)
        setOpen(true)
      } catch {
        // Aborted by the next keystroke, or offline: keep the old list.
      } finally {
        if (!controller.signal.aborted) setSearching(false)
      }
    }, 200)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, manual])

  useEffect(() => {
    if (!manual || municipalitiesCache) return
    fetch("/api/schools?list=municipalities")
      .then((r) => r.json())
      .then((d: { municipalities?: string[] }) => {
        municipalitiesCache = d.municipalities ?? []
        setMunicipalities(municipalitiesCache)
      })
      .catch(() => {})
  }, [manual])

  function choose(match: Match) {
    onChange({ school_code: match.code, school_name: match.name, municipality: match.municipality })
    setQuery("")
    setMatches([])
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || matches.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => (i + 1) % matches.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => (i <= 0 ? matches.length - 1 : i - 1))
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault()
      choose(matches[active])
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  if (value?.school_code && !manual) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg border bg-white px-3 py-2.5",
          invalid ? "border-destructive" : "border-border",
        )}
      >
        <SchoolIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-ink" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-steam-dark">{value.school_name}</p>
          {value.municipality && <p className="text-xs text-muted-foreground">{value.municipality}</p>}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => {
            onChange(null)
            requestAnimationFrame(() => inputRef.current?.focus())
          }}
        >
          Keisti
        </Button>
      </div>
    )
  }

  if (manual) {
    return (
      <div className="space-y-2">
        <Input
          id={id}
          value={value?.school_name ?? ""}
          onChange={(e) =>
            onChange({ school_code: null, school_name: e.target.value, municipality: value?.municipality ?? null })
          }
          placeholder="Įstaigos pavadinimas"
          autoComplete="organization"
          aria-invalid={invalid || undefined}
          maxLength={200}
        />
        <select
          aria-label="Savivaldybė"
          value={value?.municipality ?? ""}
          onChange={(e) =>
            onChange({
              school_code: null,
              school_name: value?.school_name ?? "",
              municipality: e.target.value || null,
            })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Savivaldybė</option>
          {municipalities.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="text-xs font-medium text-primary-ink underline underline-offset-4"
          onClick={() => {
            setManual(false)
            onChange(null)
          }}
        >
          Ieškoti mokyklų sąraše
        </button>
      </div>
    )
  }

  const showList = open && query.trim().length >= 2 && (!searching || matches.length > 0)
  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={invalid || undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onFocus={() => matches.length > 0 && setOpen(true)}
          placeholder="Mokyklos pavadinimas arba miestas"
          autoComplete="off"
          className="pr-9"
        />
        {searching ? (
          <Loader2
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        ) : query ? (
          <button
            type="button"
            aria-label="Išvalyti paiešką"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-steam-dark"
            onClick={() => {
              setQuery("")
              inputRef.current?.focus()
            }}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        {showList && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-white py-1 shadow-lg"
          >
            {matches.length === 0 && !searching && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Nerasta. Patikrinkite pavadinimą arba įrašykite mokyklą patys.
              </li>
            )}
            {matches.map((m, i) => (
              <li
                key={m.code}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(m)}
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm",
                  i === active ? "bg-primary/10" : "hover:bg-muted",
                )}
              >
                <span className="block text-steam-dark">{m.name}</span>
                <span className="block text-xs text-muted-foreground">{m.municipality}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        className="text-xs font-medium text-primary-ink underline underline-offset-4"
        onClick={() => {
          setManual(true)
          onChange({ school_code: null, school_name: query.trim(), municipality: null })
        }}
      >
        Mano mokyklos sąraše nėra
      </button>
    </div>
  )
}
