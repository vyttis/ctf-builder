"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

/** "Baigti" for an activity a facilitator left running (admin list). */
export function FinishGameButton({ gameId, title, teacher }: { gameId: string; title: string; teacher: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function finish() {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/games/${gameId}/finish`, { method: "POST" })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? "Nepavyko baigti veiklos.")
      toast({ title: "Veikla baigta", description: `„${title}“ baigta, rezultatai išsaugoti.` })
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Nepavyko",
        description: error instanceof Error ? error.message : "Bandykite dar kartą.",
        variant: "destructive",
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 border-accent/30 text-accent-ink hover:bg-accent/5"
        onClick={() => setOpen(true)}
      >
        <Square className="h-3.5 w-3.5" aria-hidden="true" />
        Baigti
      </Button>
      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Baigti veiklą „{title}“?</DialogTitle>
            <DialogDescription>
              Veiklą vedė {teacher}. Dalyviai nebegalės atsakinėti, o rezultatai ir ataskaita liks. Atšaukti negalima.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Atšaukti
            </Button>
            <Button variant="destructive" onClick={() => void finish()} disabled={busy} className="gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Baigti veiklą
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
