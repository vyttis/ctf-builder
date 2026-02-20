"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { LibraryItem } from "@/types/game"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  XCircle,
  Puzzle,
  User,
  Clock,
  Loader2,
  Eye,
} from "lucide-react"
import Link from "next/link"

export default function AdminLibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({})
  const { toast } = useToast()

  useEffect(() => {
    fetchPending()
  }, [])

  async function fetchPending() {
    setLoading(true)
    const res = await fetch("/api/library?status=pending_review")
    if (res.ok) {
      setItems(await res.json())
    }
    setLoading(false)
  }

  async function handleReview(
    itemId: string,
    status: "approved" | "rejected"
  ) {
    setActionId(itemId)
    try {
      const res = await fetch(`/api/library/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          review_notes: rejectNotes[itemId] || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      setItems((prev) => prev.filter((i) => i.id !== itemId))
      toast({
        title: status === "approved" ? "Patvirtinta!" : "Atmesta",
        description:
          status === "approved"
            ? "Šablonas dabar matomas bibliotekoje"
            : "Autorius gaus pranešimą",
      })
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description: error instanceof Error ? error.message : "Nežinoma klaida",
        variant: "destructive",
      })
    } finally {
      setActionId(null)
    }
  }

  return (
    <div>
      <Link href="/admin" className="inline-block mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Administravimas
        </Button>
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-steam-dark flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-highlight" />
            Bibliotekos moderavimas
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Peržiūrėkite ir patvirtinkite mokytojų CTF šablonus
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length > 0 ? (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={item.id} className="border-border/50 bg-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-steam-dark text-lg">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                  <Badge className="bg-highlight/10 text-highlight border-highlight/20 shrink-0">
                    Laukia peržiūros
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {item.publisher_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Puzzle className="h-3 w-3" />
                    {item.challenge_count || 0} užduotys
                  </span>
                  {item.subject && (
                    <Badge variant="outline" className="text-xs">
                      {item.subject}
                    </Badge>
                  )}
                  {item.grade_level && (
                    <Badge variant="outline" className="text-xs">
                      {item.grade_level} kl.
                    </Badge>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleDateString("lt-LT")}
                  </span>
                </div>

                {/* Challenge preview */}
                {item.challenge_data && item.challenge_data.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-3 mb-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Užduočių peržiūra
                    </p>
                    <div className="space-y-1.5">
                      {item.challenge_data.slice(0, 5).map((c, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-steam-dark truncate">
                            {c.title}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] shrink-0"
                          >
                            {c.points} tšk.
                          </Badge>
                        </div>
                      ))}
                      {item.challenge_data.length > 5 && (
                        <p className="text-xs text-muted-foreground pl-7">
                          +{item.challenge_data.length - 5} daugiau...
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Reject notes */}
                <div className="mb-4">
                  <Textarea
                    placeholder="Pastaba autoriui (neprivaloma, naudojama atmetant)..."
                    value={rejectNotes[item.id] || ""}
                    onChange={(e) =>
                      setRejectNotes((prev) => ({
                        ...prev,
                        [item.id]: e.target.value,
                      }))
                    }
                    rows={2}
                    className="text-sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => handleReview(item.id, "approved")}
                    disabled={actionId === item.id}
                    className="bg-primary hover:bg-primary/90 text-white gap-2"
                  >
                    {actionId === item.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    Patvirtinti
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReview(item.id, "rejected")}
                    disabled={actionId === item.id}
                    className="gap-2 border-accent/30 text-accent hover:bg-accent/5"
                  >
                    <XCircle className="h-4 w-4" />
                    Atmesti
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <CheckCircle className="h-12 w-12 mx-auto text-primary/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            Nėra laukiančių patvirtinimo šablonų
          </p>
        </div>
      )}
    </div>
  )
}
