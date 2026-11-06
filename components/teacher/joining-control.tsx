"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { DoorOpen } from "lucide-react"

/**
 * Lets the facilitator close joining once every team is in, so nobody (and
 * no stray device with the code) can add teams later. Teams already in keep
 * playing; joining can be opened again at any time.
 */
export function JoiningControl({ gameId, closed }: { gameId: string; closed: boolean }) {
  const [value, setValue] = useState<{ base: boolean; closed: boolean } | null>(null)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  // The saved value until the page's own value catches up after a refresh.
  const isClosed = value && value.base === closed ? value.closed : closed

  async function change(nextClosed: boolean) {
    setSaving(true)
    try {
      const res = await fetch(`/api/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: { joining_closed: nextClosed } }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) throw new Error(data.error || "Nepavyko išsaugoti.")
      setValue({ base: closed, closed: nextClosed })
      toast({ title: nextClosed ? "Prisijungimas uždarytas" : "Prisijungimas atidarytas" })
      router.refresh()
    } catch (e) {
      toast({
        title: "Nepavyko pakeisti prisijungimo",
        description: e instanceof Error ? e.message : undefined,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-border/50 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DoorOpen className="h-4 w-4 text-primary-ink" aria-hidden="true" />
          Prisijungimas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={`joining-${gameId}`} className="text-sm font-medium">
            Naujos komandos gali prisijungti
          </Label>
          <Switch
            id={`joining-${gameId}`}
            checked={!isClosed}
            disabled={saving}
            onCheckedChange={(open) => change(!open)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {isClosed
            ? "Prisijungimas uždarytas: jau prisijungusios komandos tęsia, naujų nepriimama."
            : "Kai visos komandos prisijungs, uždarykite, kad niekas nepridėtų naujų."}
        </p>
      </CardContent>
    </Card>
  )
}
