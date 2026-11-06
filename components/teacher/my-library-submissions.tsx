"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LibraryItem, LibraryItemStatus } from "@/types/game"
import { Clock, CheckCircle2, XCircle, Loader2, Send, Puzzle } from "lucide-react"

const STATUS_CONFIG: Record<
  LibraryItemStatus,
  { label: string; className: string; icon: typeof Clock }
> = {
  pending_review: {
    label: "Laukia peržiūros",
    className: "border-highlight/40 text-highlight-ink bg-highlight/5",
    icon: Clock,
  },
  approved: {
    label: "Patvirtinta",
    className: "border-primary/40 text-primary-ink bg-primary/5",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Atmesta",
    className: "border-accent/40 text-accent-ink bg-accent/5",
    icon: XCircle,
  },
}

export function MyLibrarySubmissions() {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/library?mine=true&limit=50")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      setError(true)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-ink" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <Send className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm mb-4">
          Nepavyko įkelti jūsų pateikimų.
        </p>
        <Button variant="outline" size="sm" onClick={fetchItems}>
          Bandyti dar kartą
        </Button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <Send className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground text-sm">
          Dar nepateikėte šablonų bibliotekai. Pasidalinkite savo veikla iš
          jos puslapio.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const config = STATUS_CONFIG[item.status]
        const StatusIcon = config.icon
        return (
          <Card key={item.id} className="border-border/50 bg-white">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-steam-dark truncate">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      <Puzzle className="h-3 w-3 mr-1" />
                      {item.challenge_count ?? item.challenge_data?.length ?? 0} užd.
                    </Badge>
                    {item.subject && (
                      <Badge variant="secondary" className="text-xs">
                        {item.subject}
                      </Badge>
                    )}
                    {item.status === "approved" && (
                      <span className="text-xs text-muted-foreground">
                        Klonuota: {item.clone_count} k.
                      </span>
                    )}
                  </div>
                  {item.status === "rejected" && item.review_notes && (
                    <div className="mt-2 p-2 rounded-lg bg-accent/5 border border-accent/20 text-xs text-steam-dark">
                      <span className="font-medium text-accent-ink">
                        Administratoriaus pastaba:
                      </span>{" "}
                      {item.review_notes}
                    </div>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 gap-1 ${config.className}`}
                >
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
