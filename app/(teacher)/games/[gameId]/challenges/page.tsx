"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Challenge } from "@/types/game"
import { AiSuggestion } from "@/lib/ai/types"
import { ChallengeForm } from "@/components/teacher/challenge-form"
import { ChallengeBuilder } from "@/components/teacher/challenge-builder/challenge-builder"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import Link from "next/link"

interface GameData {
  id: string
  title: string
  description: string | null
}

export default function ChallengesPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const gameId = params.gameId as string

  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(
    null
  )
  const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [prefillData, setPrefillData] = useState<AiSuggestion | null>(null)
  const [gameData, setGameData] = useState<GameData | null>(null)

  useEffect(() => {
    fetchChallenges()
    fetchGameData()
  }, [gameId])

  // Check for AI prefill from game detail page navigation
  useEffect(() => {
    if (searchParams.get("ai_prefill") === "1") {
      try {
        const stored = sessionStorage.getItem("ai_prefill")
        if (stored) {
          const suggestion: AiSuggestion = JSON.parse(stored)
          sessionStorage.removeItem("ai_prefill")
          setPrefillData(suggestion)
          setShowForm(true)
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [searchParams])

  async function fetchChallenges() {
    const res = await fetch(`/api/challenges?game_id=${gameId}`)
    if (res.ok) {
      const data = await res.json()
      setChallenges(data)
    }
    setLoading(false)
  }

  async function fetchGameData() {
    const res = await fetch(`/api/games/${gameId}`)
    if (res.ok) {
      const data = await res.json()
      setGameData({
        id: data.id,
        title: data.title,
        description: data.description,
      })
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/challenges/${deleteTarget.id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      toast({ title: "Užduotis pašalinta!" })
      fetchChallenges()
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div>
      {/* Back button */}
      <Link href={`/games/${gameId}`} className="inline-block mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Grįžti į žaidimą
        </Button>
      </Link>

      {/* Challenge form (shown above both panels) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="border-primary/20 bg-white shadow-md">
              <CardContent className="p-6">
                <h3 className="font-semibold text-steam-dark mb-4">
                  {editingChallenge ? "Redaguoti užduotį" : "Nauja užduotis"}
                </h3>
                <ChallengeForm
                  gameId={gameId}
                  challenge={editingChallenge ?? undefined}
                  prefillData={prefillData ?? undefined}
                  onSuccess={() => {
                    setShowForm(false)
                    setEditingChallenge(null)
                    setPrefillData(null)
                    fetchChallenges()
                  }}
                  onCancel={() => {
                    setShowForm(false)
                    setEditingChallenge(null)
                    setPrefillData(null)
                  }}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent" />
              Pašalinti užduotį?
            </DialogTitle>
            <DialogDescription>
              Ar tikrai norite pašalinti užduotį &ldquo;
              {deleteTarget?.title}&rdquo;? Šis veiksmas negrįžtamas — visi
              susiję pateikimai bus ištrinti.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Atšaukti
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-accent hover:bg-accent/90 text-white gap-2"
            >
              {deleting ? "Šalinama..." : "Pašalinti"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Two-panel drag-and-drop builder */}
      {gameData && (
        <ChallengeBuilder
          gameId={gameId}
          gameTitle={gameData.title}
          gameDescription={gameData.description}
          challenges={challenges}
          onChallengesChange={setChallenges}
          onRefreshChallenges={fetchChallenges}
          onEditChallenge={(challenge) => {
            setEditingChallenge(challenge)
            setPrefillData(null)
            setShowForm(true)
          }}
          onDeleteChallenge={setDeleteTarget}
          onAddNew={() => {
            setEditingChallenge(null)
            setPrefillData(null)
            setShowForm(true)
          }}
        />
      )}
    </div>
  )
}
