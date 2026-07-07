"use client"

import { useEffect, useState, useCallback } from "react"
import { LibraryCard } from "@/components/teacher/library-card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MyLibrarySubmissions } from "@/components/teacher/my-library-submissions"
import { LibraryItem } from "@/types/game"
import { BookOpen, Search, Loader2, Send } from "lucide-react"

const subjects = [
  { value: "all", label: "Visi dalykai" },
  { value: "Fizika", label: "Fizika" },
  { value: "Chemija", label: "Chemija" },
  { value: "Biologija", label: "Biologija" },
  { value: "Matematika", label: "Matematika" },
  { value: "Informatika", label: "Informatika" },
  { value: "Technologijos", label: "Technologijos" },
  { value: "Menas", label: "Menas" },
  { value: "Kita", label: "Kita" },
]

const gradeLevels = [
  { value: "all", label: "Visos klasės" },
  { value: "5-6", label: "5-6 klasė" },
  { value: "7-8", label: "7-8 klasė" },
  { value: "9-10", label: "9-10 klasė" },
  { value: "11-12", label: "11-12 klasė" },
]

export default function LibraryPage() {
  const [items, setItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState("")
  const [subject, setSubject] = useState("all")
  const [gradeLevel, setGradeLevel] = useState("all")

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(false)
    const params = new URLSearchParams()
    params.set("status", "approved")
    if (subject !== "all") params.set("subject", subject)
    if (gradeLevel !== "all") params.set("grade_level", gradeLevel)
    if (search) params.set("search", search)

    try {
      const res = await fetch(`/api/library?${params.toString()}`)
      if (!res.ok) throw new Error("library fetch failed")
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      setItems([])
      setError(true)
    }
    setLoading(false)
  }, [subject, gradeLevel, search])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    fetchItems()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-steam-dark flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-secondary" />
            CTF Biblioteka
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Patvirtinti CTF šablonai — klonuokite ir naudokite savo pamokose
          </p>
        </div>
      </div>

      <Tabs defaultValue="public">
        <TabsList className="mb-6">
          <TabsTrigger value="public" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Vieši šablonai
          </TabsTrigger>
          <TabsTrigger value="mine" className="gap-2">
            <Send className="h-4 w-4" />
            Mano pateikimai
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ieškoti šablonų..."
              className="pl-10"
            />
          </div>
        </form>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Dalykas" />
          </SelectTrigger>
          <SelectContent>
            {subjects.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={gradeLevel} onValueChange={setGradeLevel}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Klasė" />
          </SelectTrigger>
          <SelectContent>
            {gradeLevels.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm mb-4">
            Nepavyko įkelti bibliotekos.
          </p>
          <Button variant="outline" size="sm" onClick={fetchItems}>
            Bandyti dar kartą
          </Button>
        </div>
      ) : items.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <LibraryCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-sm">
            {search || subject !== "all" || gradeLevel !== "all"
              ? "Nerasta šablonų su šiais filtrais"
              : "Bibliotekoje dar nėra patvirtintų šablonų"}
          </p>
        </div>
      )}
        </TabsContent>

        <TabsContent value="mine">
          <MyLibrarySubmissions />
        </TabsContent>
      </Tabs>
    </div>
  )
}
