"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LibraryItem } from "@/types/game"
import { Copy, Puzzle, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"

interface LibraryCardProps {
  item: LibraryItem
}

export function LibraryCard({ item }: LibraryCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [cloning, setCloning] = useState(false)

  async function handleClone() {
    setCloning(true)
    try {
      const res = await fetch(`/api/library/${item.id}/clone`, {
        method: "POST",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Nepavyko klonuoti")
      }

      const { game_id } = await res.json()

      toast({
        title: "Sėkmingai klonuota!",
        description: "Žaidimas sukurtas kaip juodraštis. Pridėkite atsakymus.",
      })

      router.push(`/games/${game_id}`)
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description: error instanceof Error ? error.message : "Nežinoma klaida",
        variant: "destructive",
      })
    } finally {
      setCloning(false)
    }
  }

  const subjectColors: Record<string, string> = {
    Fizika: "bg-blue-100 text-blue-700",
    Chemija: "bg-green-100 text-green-700",
    Biologija: "bg-emerald-100 text-emerald-700",
    Matematika: "bg-purple-100 text-purple-700",
    Informatika: "bg-orange-100 text-orange-700",
    Technologijos: "bg-amber-100 text-amber-700",
    Menas: "bg-pink-100 text-pink-700",
  }

  return (
    <Card className="border-border/50 bg-white hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="font-semibold text-steam-dark text-[15px] leading-tight line-clamp-2">
            {item.title}
          </h3>
          {item.subject && (
            <Badge
              variant="outline"
              className={`shrink-0 text-xs ${
                subjectColors[item.subject] || "bg-muted text-muted-foreground"
              }`}
            >
              {item.subject}
            </Badge>
          )}
        </div>

        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <Puzzle className="h-3 w-3" />
            {item.challenge_count || 0} užd.
          </span>
          {item.grade_level && (
            <span className="flex items-center gap-1">
              {item.grade_level} kl.
            </span>
          )}
          <span className="flex items-center gap-1">
            <Copy className="h-3 w-3" />
            {item.clone_count}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{item.publisher_name}</span>
          </div>

          <Button
            size="sm"
            onClick={handleClone}
            disabled={cloning}
            className="bg-primary hover:bg-primary/90 text-white gap-1.5 text-xs h-8"
          >
            <Copy className="h-3 w-3" />
            {cloning ? "Klonuojama..." : "Klonuoti"}
          </Button>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {item.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] px-1.5 py-0 text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
