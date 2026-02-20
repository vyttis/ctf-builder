"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { BookOpen, Loader2 } from "lucide-react"

interface PublishDialogProps {
  gameId: string
  gameTitle: string
  gameDescription?: string | null
}

const subjects = [
  "Fizika",
  "Chemija",
  "Biologija",
  "Matematika",
  "Informatika",
  "Technologijos",
  "Menas",
  "Kita",
]

const gradeLevels = ["5-6", "7-8", "9-10", "11-12"]

export function PublishDialog({
  gameId,
  gameTitle,
  gameDescription,
}: PublishDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(gameTitle)
  const [description, setDescription] = useState(gameDescription || "")
  const [subject, setSubject] = useState("")
  const [gradeLevel, setGradeLevel] = useState("")
  const [tags, setTags] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handlePublish() {
    if (!title.trim()) return

    setLoading(true)
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          game_id: gameId,
          title: title.trim(),
          description: description.trim() || undefined,
          subject: subject || undefined,
          grade_level: gradeLevel || undefined,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Nepavyko publikuoti")
      }

      toast({
        title: "Pateikta peržiūrai!",
        description:
          "Jūsų CTF šablonas bus matomas bibliotekoje po administratoriaus patvirtinimo.",
      })

      setOpen(false)
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description: error instanceof Error ? error.message : "Nežinoma klaida",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-secondary/30 text-secondary hover:bg-secondary/5"
        >
          <BookOpen className="h-4 w-4" />
          Publikuoti į biblioteką
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-steam-dark">
            Publikuoti į biblioteką
          </DialogTitle>
          <DialogDescription>
            Jūsų CTF šablonas bus prieinamas kitiems mokytojams po
            administratoriaus patvirtinimo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="pub-title">Pavadinimas</Label>
            <Input
              id="pub-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="CTF šablono pavadinimas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pub-desc">Aprašymas</Label>
            <Textarea
              id="pub-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Trumpas aprašymas apie šį CTF žaidimą"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dalykas</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Pasirinkite" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Klasė</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Pasirinkite" />
                </SelectTrigger>
                <SelectContent>
                  {gradeLevels.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g} klasė
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pub-tags">
              Tagai{" "}
              <span className="text-muted-foreground font-normal">
                (atskirti kableliais)
              </span>
            </Label>
            <Input
              id="pub-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="pvz.: jūra, ekosistema, tyrimai"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Atšaukti
          </Button>
          <Button
            onClick={handlePublish}
            disabled={loading || !title.trim()}
            className="bg-primary hover:bg-primary/90 text-white gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
            Publikuoti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
