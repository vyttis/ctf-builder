"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Challenge } from "@/types/game"
import { AiSuggestion } from "@/lib/ai/types"
import { ChallengeForm } from "@/components/teacher/challenge-form"
import { AiAssistantPanel } from "@/components/teacher/ai-assistant-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Puzzle,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Sparkles,
} from "lucide-react"
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
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Challenge | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [aiSheetOpen, setAiSheetOpen] = useState(false)
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
      setGameData({ id: data.id, title: data.title, description: data.description })
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    const res = await fetch(`/api/challenges/${deleteTarget.id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      toast({ title: "Užduotis pašalinta" })
      fetchChallenges()
    }
    setDeleting(false)
    setDeleteTarget(null)
  }

  async function moveChallenge(challengeId: string, direction: "up" | "down") {
    const index = challenges.findIndex((c) => c.id === challengeId)
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === challenges.length - 1)
    )
      return

    const swapIndex = direction === "up" ? index - 1 : index + 1

    // Update both challenges' order_index
    await Promise.all([
      fetch(`/api/challenges/${challenges[index].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_index: swapIndex }),
      }),
      fetch(`/api/challenges/${challenges[swapIndex].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_index: index }),
      }),
    ])

    fetchChallenges()
  }

  function handleAcceptSuggestion(suggestion: AiSuggestion) {
    setAiSheetOpen(false)
    setEditingChallenge(null)
    setPrefillData(suggestion)
    setShowForm(true)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <Link href={`/games/${gameId}`} className="inline-block mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Grįžti į žaidimą
        </Button>
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-steam-dark flex items-center gap-2">
            <Puzzle className="h-6 w-6 text-primary" />
            Užduotys
          </h1>
          <p className="text-muted-foreground mt-1">
            {challenges.length}{" "}
            {challenges.length === 1
              ? "užduotis"
              : challenges.length >= 10 && challenges.length <= 20
              ? "užduočių"
              : "užduotys"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setAiSheetOpen(true)}
            variant="outline"
            className="gap-2 border-highlight/30 text-highlight hover:bg-highlight/5"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Padėjėjas</span>
          </Button>
          {!showForm && (
            <Button
              onClick={() => {
                setEditingChallenge(null)
                setPrefillData(null)
                setShowForm(true)
              }}
              className="bg-primary hover:bg-primary/90 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Nauja užduotis
            </Button>
          )}
        </div>
      </div>

      {/* Challenge form */}
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

      {/* AI Assistant Panel */}
      {gameData && (
        <AiAssistantPanel
          open={aiSheetOpen}
          onOpenChange={setAiSheetOpen}
          gameId={gameId}
          gameTitle={gameData.title}
          gameDescription={gameData.description}
          existingChallenges={challenges}
          onAcceptSuggestion={handleAcceptSuggestion}
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-accent" />
              Pašalinti užduotį?
            </DialogTitle>
            <DialogDescription>
              Ar tikrai norite pašalinti užduotį &ldquo;{deleteTarget?.title}&rdquo;?
              Šis veiksmas negrįžtamas — visi susiję pateikimai bus ištrinti.
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

      {/* Challenges list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-lg bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : challenges.length > 0 ? (
        <div className="space-y-3">
          {challenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-border/50 bg-white hover:border-border transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Order controls */}
                    <div className="flex flex-col items-center gap-0.5 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-steam-dark"
                        onClick={() => moveChallenge(challenge.id, "up")}
                        disabled={index === 0}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-xs font-bold text-primary w-6 text-center">
                        {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-steam-dark"
                        onClick={() => moveChallenge(challenge.id, "down")}
                        disabled={index === challenges.length - 1}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-steam-dark truncate">
                          {challenge.title}
                        </h3>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {challenge.points} tšk.
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="shrink-0 text-xs"
                        >
                          {challenge.type === "text"
                            ? "Tekstas"
                            : challenge.type === "number"
                            ? "Skaičius"
                            : "Pasirinkimas"}
                        </Badge>
                      </div>
                      {challenge.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {challenge.description}
                        </p>
                      )}
                      {challenge.hints &&
                        (challenge.hints as string[]).length > 0 && (
                          <p className="text-xs text-highlight mt-1">
                            💡 {(challenge.hints as string[]).length}{" "}
                            {(challenge.hints as string[]).length === 1
                              ? "užuomina"
                              : "užuominos"}
                          </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-secondary"
                        onClick={() => {
                          setEditingChallenge(challenge)
                          setPrefillData(null)
                          setShowForm(true)
                        }}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-accent"
                        onClick={() => setDeleteTarget(challenge)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <img
            src="/illustrations/empty-state.svg"
            alt=""
            className="w-40 h-40 mx-auto mb-4 opacity-50"
          />
          <h2 className="text-lg font-semibold text-steam-dark mb-2">
            Dar nėra užduočių
          </h2>
          <p className="text-muted-foreground mb-4">
            Pridėkite pirmąją užduotį savo žaidimui
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => setShowForm(true)}
              className="bg-primary hover:bg-primary/90 text-white gap-2"
            >
              <Plus className="h-4 w-4" />
              Pridėti užduotį
            </Button>
            <Button
              onClick={() => setAiSheetOpen(true)}
              variant="outline"
              className="gap-2 border-highlight/30 text-highlight hover:bg-highlight/5"
            >
              <Sparkles className="h-4 w-4" />
              AI Padėjėjas
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
