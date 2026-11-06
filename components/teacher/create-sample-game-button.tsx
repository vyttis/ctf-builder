"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Wand2 } from "lucide-react"

interface CreateSampleGameButtonProps {
  variant?: "default" | "outline"
  size?: "default" | "sm"
}

export function CreateSampleGameButton({
  variant = "outline",
  size = "default",
}: CreateSampleGameButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    setLoading(true)
    try {
      const res = await fetch("/api/games/sample", { method: "POST" })
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || "Nepavyko sukurti pavyzdinės veiklos")
      }
      const data = (await res.json()) as { game_id: string }
      toast({
        title: "Pavyzdinė veikla sukurta!",
        description: "Pradėkite veiklą ir nuskaitykite QR kodą telefonu.",
      })
      router.push(`/games/${data.game_id}`)
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description:
          error instanceof Error ? error.message : "Nepavyko sukurti veiklos",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCreate}
      disabled={loading}
      className={
        variant === "outline"
          ? "gap-2 border-highlight/40 text-highlight-ink hover:bg-highlight/5"
          : "gap-2 bg-highlight hover:bg-highlight/90 text-steam-dark"
      }
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wand2 className="h-4 w-4" />
      )}
      Sukurti pavyzdinę veiklą
    </Button>
  )
}
