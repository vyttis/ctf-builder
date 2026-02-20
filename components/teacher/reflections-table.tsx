"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Download, Search, MessageSquare, ChevronDown, ChevronUp } from "lucide-react"

interface Reflection {
  id: string
  team_name: string
  hardest_challenge_title: string | null
  improvement_text: string
  liked_text: string | null
  created_at: string
}

interface ReflectionsTableProps {
  reflections: Reflection[]
  totalTeams: number
}

function TruncatedText({ text, maxLength = 100 }: { text: string; maxLength?: number }) {
  const [expanded, setExpanded] = useState(false)

  if (text.length <= maxLength) {
    return <span>{text}</span>
  }

  return (
    <span>
      {expanded ? text : `${text.slice(0, maxLength)}...`}
      <button
        onClick={() => setExpanded(!expanded)}
        className="ml-1 text-primary hover:text-primary/80 text-xs font-medium inline-flex items-center gap-0.5"
      >
        {expanded ? (
          <>
            Sutraukti <ChevronUp className="h-3 w-3" />
          </>
        ) : (
          <>
            Rodyti daugiau <ChevronDown className="h-3 w-3" />
          </>
        )}
      </button>
    </span>
  )
}

export function ReflectionsTable({ reflections, totalTeams }: ReflectionsTableProps) {
  const [search, setSearch] = useState("")
  const [challengeFilter, setChallengeFilter] = useState<string>("all")

  // Get unique challenge titles for filter
  const uniqueChallenges = useMemo(() => {
    const titles = new Set<string>()
    reflections.forEach((r) => {
      if (r.hardest_challenge_title) titles.add(r.hardest_challenge_title)
    })
    return Array.from(titles).sort()
  }, [reflections])

  // Filter reflections
  const filtered = useMemo(() => {
    return reflections.filter((r) => {
      const matchesSearch =
        !search ||
        r.team_name.toLowerCase().includes(search.toLowerCase()) ||
        r.improvement_text.toLowerCase().includes(search.toLowerCase()) ||
        (r.liked_text && r.liked_text.toLowerCase().includes(search.toLowerCase()))

      const matchesChallenge =
        challengeFilter === "all" ||
        r.hardest_challenge_title === challengeFilter

      return matchesSearch && matchesChallenge
    })
  }, [reflections, search, challengeFilter])

  function exportCSV() {
    const BOM = "\uFEFF"
    const headers = [
      "Komanda",
      "Sudėtingiausia užduotis",
      "Ką darytų kitaip",
      "Kas patiko",
      "Data",
    ]

    const rows = reflections.map((r) => [
      r.team_name,
      r.hardest_challenge_title || "—",
      r.improvement_text,
      r.liked_text || "—",
      new Date(r.created_at).toLocaleString("lt-LT"),
    ])

    const csvContent =
      BOM +
      [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `refleksijos_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (reflections.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">
            Dar nėra refleksijų. Mokiniai gali užpildyti refleksiją baigę žaidimą.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">Refleksijos</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {reflections.length} / {totalTeams}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="gap-2 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            Eksportuoti CSV
          </Button>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ieškoti komandos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
          {uniqueChallenges.length > 0 && (
            <Select value={challengeFilter} onValueChange={setChallengeFilter}>
              <SelectTrigger className="h-9 w-full sm:w-[220px] text-sm">
                <SelectValue placeholder="Sudėtingiausia užduotis" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visos užduotys</SelectItem>
                {uniqueChallenges.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left py-2.5 px-3 font-medium text-muted-foreground whitespace-nowrap">
                  Komanda
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-muted-foreground whitespace-nowrap">
                  Sudėtingiausia užduotis
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-muted-foreground whitespace-nowrap">
                  Ką darytų kitaip
                </th>
                <th className="text-left py-2.5 px-3 font-medium text-muted-foreground whitespace-nowrap">
                  Kas patiko
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/10">
                  <td className="py-2.5 px-3 font-medium text-steam-dark whitespace-nowrap">
                    {r.team_name}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                    {r.hardest_challenge_title || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-steam-dark max-w-[250px]">
                    <TruncatedText text={r.improvement_text} />
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground max-w-[200px]">
                    {r.liked_text ? (
                      <TruncatedText text={r.liked_text} />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground text-sm">
                    Nerasta refleksijų pagal filtrą
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length !== reflections.length && (
          <p className="text-xs text-muted-foreground mt-2">
            Rodoma {filtered.length} iš {reflections.length}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
