"use client"

import { useState, useEffect } from "react"
import { LibraryItem } from "@/types/game"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  BookOpen,
  Loader2,
  Search,
  Plus,
  Puzzle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface LibraryWorkspaceProps {
  gameId: string
  onTaskAdded: () => void
}

export function LibraryWorkspace({ gameId, onTaskAdded }: LibraryWorkspaceProps) {
  const { toast } = useToast()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchItems()
  }, [])

  async function fetchItems() {
    setLoading(true)
    try {
      const res = await fetch("/api/library?status=approved&limit=50")
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      (item.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.tags || []).some((t) =>
        t.toLowerCase().includes(search.toLowerCase())
      )
  )

  async function addChallengeFromLibrary(
    item: LibraryItem,
    snap: { title: string; description: string; type: string; points: number; hints: string[]; options: string[] | null }
  ) {
    const key = `${item.id}-${snap.title}`
    setAddingIds((prev) => new Set(prev).add(key))
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: gameId,
          title: snap.title,
          description: snap.description || "",
          type: snap.type,
          points: snap.points,
          correct_answer: "placeholder",
          hints: snap.hints || [],
          options: snap.options,
        }),
      })
      if (res.ok) {
        toast({ title: `Užduotis "${snap.title}" pridėta` })
        onTaskAdded()
      } else {
        throw new Error("fail")
      }
    } catch {
      toast({
        title: "Nepavyko pridėti užduoties",
        variant: "destructive",
      })
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-secondary" />
        <h2 className="font-semibold text-steam-dark">Biblioteka</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        Naršykite patvirtintus žaidimus ir pridėkite užduotis
      </p>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Ieškoti..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-white"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-8">
          <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? "Bibliotekoje dar nėra patvirtintų žaidimų"
              : "Nerasta rezultatų"}
          </p>
        </div>
      )}

      {/* Library items */}
      <div className="space-y-2">
        {filtered.map((item) => (
          <Card key={item.id} className="border-border/50">
            <CardContent className="p-3">
              <button
                type="button"
                className="w-full text-left"
                onClick={() =>
                  setExpandedId(expandedId === item.id ? null : item.id)
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-medium text-steam-dark">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">
                        <Puzzle className="h-2.5 w-2.5 mr-1" />
                        {item.challenge_data?.length || 0} užd.
                      </Badge>
                      {item.subject && (
                        <Badge variant="secondary" className="text-[10px]">
                          {item.subject}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {expandedId === item.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              </button>

              {expandedId === item.id && item.challenge_data && (
                <div className="mt-3 space-y-2 border-t border-border/30 pt-3">
                  {item.challenge_data.map((snap, i) => {
                    const key = `${item.id}-${snap.title}`
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/20"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-steam-dark truncate">
                            {snap.title}
                          </p>
                          <div className="flex gap-1.5 mt-0.5">
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1 py-0"
                            >
                              {snap.points} tšk.
                            </Badge>
                            <Badge
                              variant="secondary"
                              className="text-[9px] px-1 py-0"
                            >
                              {snap.type === "text"
                                ? "Tekstas"
                                : snap.type === "number"
                                ? "Skaičius"
                                : "Pasirinkimas"}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 shrink-0"
                          disabled={addingIds.has(key)}
                          onClick={() => addChallengeFromLibrary(item, snap)}
                        >
                          {addingIds.has(key) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          Pridėti
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
