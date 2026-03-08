"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Check, ChevronsUpDown, X, Link2, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface ChallengePrerequisitesProps {
  challengeId: string
  gameId: string
  allChallenges: Array<{ id: string; title: string; order_index: number; prerequisites?: string[] }>
  currentPrerequisites: string[]
  onChange: (prerequisites: string[]) => void
}

export function ChallengePrerequisites({
  challengeId,
  allChallenges,
  currentPrerequisites,
  onChange,
}: ChallengePrerequisitesProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  // Exclude self from the list
  const availableChallenges = useMemo(() => {
    return allChallenges
      .filter((c) => c.id !== challengeId)
      .sort((a, b) => a.order_index - b.order_index)
  }, [allChallenges, challengeId])

  // Build a set of IDs that would cause circular dependencies
  // Uses BFS to find all challenges that transitively depend on this one
  const circularBlockedIds = useMemo(() => {
    const blocked = new Set<string>()

    // Build a prerequisite map: challengeId -> set of challenges that require it
    const dependents = new Map<string, Set<string>>()
    for (const c of allChallenges) {
      for (const prereqId of c.prerequisites || []) {
        if (!dependents.has(prereqId)) dependents.set(prereqId, new Set())
        dependents.get(prereqId)!.add(c.id)
      }
    }

    // BFS: find all challenges that transitively depend on this challenge
    // These cannot be prerequisites (would create a cycle)
    const queue = [challengeId]
    const visited = new Set<string>()
    while (queue.length > 0) {
      const current = queue.shift()!
      if (visited.has(current)) continue
      visited.add(current)
      const deps = dependents.get(current)
      if (deps) {
        deps.forEach((depId) => {
          if (depId !== challengeId) {
            blocked.add(depId)
            queue.push(depId)
          }
        })
      }
    }

    return blocked
  }, [allChallenges, challengeId])

  // Filter by search
  const filteredChallenges = useMemo(() => {
    if (!search.trim()) return availableChallenges
    const q = search.toLowerCase()
    return availableChallenges.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        `#${c.order_index + 1}`.includes(q)
    )
  }, [availableChallenges, search])

  function togglePrerequisite(id: string) {
    if (circularBlockedIds.has(id)) return

    if (currentPrerequisites.includes(id)) {
      onChange(currentPrerequisites.filter((pid) => pid !== id))
    } else {
      onChange([...currentPrerequisites, id])
    }
  }

  function removePrerequisite(id: string) {
    onChange(currentPrerequisites.filter((pid) => pid !== id))
  }

  const selectedChallenges = availableChallenges.filter((c) =>
    currentPrerequisites.includes(c.id)
  )

  return (
    <div className="space-y-2" ref={containerRef}>
      <Label className="flex items-center gap-1.5 text-sm font-medium">
        <Link2 className="h-3.5 w-3.5 text-[#008CB4]" />
        Prieš tai reikia išspręsti:
      </Label>

      {/* Selected prerequisites as badges */}
      {selectedChallenges.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedChallenges.map((c) => (
            <Badge
              key={c.id}
              variant="outline"
              className="gap-1 pr-1 bg-[#008CB4]/5 text-[#008CB4] border-[#008CB4]/20 text-xs"
            >
              <span className="font-mono text-[10px] text-[#00323C]/50">
                #{c.order_index + 1}
              </span>
              <span className="max-w-[140px] truncate">{c.title}</span>
              <button
                type="button"
                onClick={() => removePrerequisite(c.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-[#FA2864]/10 hover:text-[#FA2864] transition-colors"
                aria-label={`Pašalinti ${c.title}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground mb-2">
          Nėra reikalavimų — užduotis prieinama iš karto
        </p>
      )}

      {/* Dropdown trigger */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setOpen(!open)
            setSearch("")
          }}
          className="w-full justify-between text-xs font-normal h-9"
          aria-expanded={open}
        >
          <span className="text-muted-foreground">
            Pasirinkite užduotis...
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
        </Button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
            {/* Search input */}
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                placeholder="Ieškoti užduočių..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-2 py-1.5 text-sm rounded border border-gray-200 outline-none focus:border-[#00D296] focus:ring-1 focus:ring-[#00D296]/30 transition-colors"
                autoFocus
              />
            </div>

            {/* Options list */}
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredChallenges.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Užduočių nerasta
                </p>
              ) : (
                filteredChallenges.map((c) => {
                  const isSelected = currentPrerequisites.includes(c.id)
                  const isBlocked = circularBlockedIds.has(c.id)

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => togglePrerequisite(c.id)}
                      disabled={isBlocked}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded text-left text-sm transition-colors ${
                        isBlocked
                          ? "opacity-40 cursor-not-allowed"
                          : isSelected
                          ? "bg-[#00D296]/5"
                          : "hover:bg-[#F8FAFB]"
                      }`}
                      title={
                        isBlocked
                          ? "Negalima pasirinkti — sukeltų ciklinę priklausomybę"
                          : undefined
                      }
                    >
                      {/* Check indicator */}
                      <div
                        className={`shrink-0 flex items-center justify-center w-4 h-4 rounded border transition-colors ${
                          isSelected
                            ? "bg-[#00D296] border-[#00D296] text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>

                      {/* Challenge info */}
                      <span className="font-mono text-[10px] text-[#00323C]/40 shrink-0">
                        #{c.order_index + 1}
                      </span>
                      <span className="truncate text-[#00323C]">
                        {c.title}
                      </span>

                      {/* Blocked indicator */}
                      {isBlocked && (
                        <AlertTriangle className="h-3 w-3 text-[#FAC846] shrink-0 ml-auto" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
