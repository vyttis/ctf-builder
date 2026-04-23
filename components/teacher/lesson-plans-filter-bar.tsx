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
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ieškoti pagal pavadinimą arba temą..."
          className="pl-9"
        />
      </div>

      <Select
        value={subject}
        onValueChange={(v) => {
          setSubject(v)
          updateUrl({ subject: v })
        }}
      >
        <SelectTrigger className="sm:w-52">
          <SelectValue placeholder="Visi dalykai" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Visi dalykai</SelectItem>
          {SUBJECTS.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={status}
        onValueChange={(v) => {
          setStatus(v)
          updateUrl({ status: v })
        }}
      >
        <SelectTrigger className="sm:w-44">
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
        <SelectTrigger className="sm:w-52">
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

      {hasFilters && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setSearch("")
            setSubject("all")
            setStatus("all")
            setSort("created_desc")
            startTransition(() => router.replace("/lesson-plans", { scroll: false }))
          }}
          title="Išvalyti filtrus"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
