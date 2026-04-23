"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState, useTransition, useEffect } from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { SubjectCombobox } from "@/components/ui/subject-combobox"
import { Search, X } from "lucide-react"
import { SUBJECTS } from "@/lib/curriculum/subjects"

const STATUS_OPTIONS = [
  { value: "all", label: "Visi statusai" },
  { value: "draft", label: "Juodraštis" },
  { value: "saved", label: "Išsaugotas" },
  { value: "converted", label: "Paverstas veikla" },
]

const SORT_OPTIONS = [
  { value: "created_desc", label: "Naujausi pirmiausiai" },
  { value: "created_asc", label: "Seniausi pirmiausiai" },
  { value: "title_asc", label: "Pavadinimas A–Z" },
  { value: "updated_desc", label: "Naujausiai atnaujinti" },
]

export function LessonPlansFilterBar({
  initialSearch,
  initialSubject,
  initialStatus,
  initialSort,
}: {
  initialSearch: string
  initialSubject: string
  initialStatus: string
  initialSort: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [search, setSearch] = useState(initialSearch)
  const [subject, setSubject] = useState(initialSubject || "all")
  const [status, setStatus] = useState(initialStatus || "all")
  const [sort, setSort] = useState(initialSort || "created_desc")

  const updateUrl = useCallback(
    (patch: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(patch)) {
        if (!v || v === "all" || v === "created_desc") params.delete(k)
        else params.set(k, v)
      }
      startTransition(() => {
        router.replace(`/lesson-plans${params.toString() ? `?${params}` : ""}`, { scroll: false })
      })
    },
    [router, searchParams]
  )

  useEffect(() => {
    const t = setTimeout(() => {
      if (search !== initialSearch) updateUrl({ q: search })
    }, 300)
    return () => clearTimeout(t)
  }, [search, initialSearch, updateUrl])

  const hasFilters = search || (subject && subject !== "all") || (status && status !== "all")

  return (
    <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
      {/* Search — full width on its own row below lg */}
      <div className="relative lg:flex-1 lg:min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ieškoti pagal pavadinimą arba temą..."
          className="pl-9"
        />
      </div>

      {/* Filter selects — grid on mobile/tablet, inline on desktop */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:items-center lg:gap-3">
      <SubjectCombobox
        value={subject === "all" ? "" : subject}
        options={[
          { value: "all", label: "Visi dalykai" },
          ...SUBJECTS.map((s) => ({ value: s.id, label: s.label })),
        ]}
        placeholder="Visi dalykai"
        searchPlaceholder="Ieškoti dalyko..."
        emptyText="Dalyko nerasta"
        className="lg:w-52"
        onChange={(v) => {
          setSubject(v)
          updateUrl({ subject: v })
        }}
      />

      <Select
        value={status}
        onValueChange={(v) => {
          setStatus(v)
          updateUrl({ status: v })
        }}
      >
        <SelectTrigger className="w-full lg:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={sort}
        onValueChange={(v) => {
          setSort(v)
          updateUrl({ sort: v })
        }}
      >
        <SelectTrigger className="w-full lg:w-52">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("")
            setSubject("all")
            setStatus("all")
            setSort("created_desc")
            startTransition(() => router.replace("/lesson-plans", { scroll: false }))
          }}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          <span className="lg:hidden">Išvalyti filtrus</span>
          <span className="sr-only lg:not-sr-only">Išvalyti filtrus</span>
        </Button>
      )}
    </div>
  )
}
