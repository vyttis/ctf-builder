"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send,
  Loader2,
  Lightbulb,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowLeft,
} from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MapsEmbed } from "@/components/shared/maps-embed"

interface ChallengeDetailModalProps {
  challenge: {
    id: string
    title: string
    description: string | null
    type: string
    points: number
    hints: string[]
    options: string[] | null
    image_url: string | null
    maps_url: string | null
    hint_penalty: number
  } | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (
    answer: string,
    hintsUsed: number
  ) => Promise<{
    is_correct: boolean
    points_awarded: number
    message: string
    explanation?: string | null
  }>
  isSolved: boolean
}

export function ChallengeDetailModal({
  challenge,
  open,
  onOpenChange,
  onSubmit,
  isSolved,
}: ChallengeDetailModalProps) {
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{
    is_correct: boolean
    points_awarded: number
    message: string
    explanation?: string | null
  } | null>(null)
  const [revealedHintCount, setRevealedHintCount] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)

  function handleClose() {
    // Reset state when closing
    setAnswer("")
    setFeedback(null)
    setRevealedHintCount(0)
    setShowExplanation(false)
    onOpenChange(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim() || !challenge || isSolved) return

    setLoading(true)
    setFeedback(null)

    try {
      const result = await onSubmit(answer.trim(), revealedHintCount)
      setFeedback(result)

      if (result.is_correct) {
        setAnswer("")
        if (result.explanation) {
          setShowExplanation(true)
        }
      }
    } catch {
      setFeedback({ is_correct: false, points_awarded: 0, message: "Tinklo klaida. Bandykite dar kartą." })
    } finally {
      setLoading(false)
    }
  }

  if (!challenge) return null

  const challengeHints = challenge.hints ?? []

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-2xl px-4 pb-8 pt-6 sm:px-6"
      >
        <SheetHeader className="mb-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="shrink-0 -ml-2"
              aria-label="Grįžti"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg font-bold text-[#00323C] text-left truncate">
                {challenge.title}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Užduoties detalės
              </SheetDescription>
            </div>
            <Badge
              variant="outline"
              className="shrink-0 bg-[#FAC846]/10 text-[#00323C] border-[#FAC846]/30 font-bold text-xs"
            >
              {challenge.points} tšk.
            </Badge>
          </div>
        </SheetHeader>

        {/* Solved indicator */}
        {isSolved && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-[#00D296]/10 border border-[#00D296]/20 flex items-center gap-2"
          >
            <CheckCircle2 className="h-5 w-5 text-[#00D296] shrink-0" />
            <p className="text-sm font-medium text-[#00D296]">
              Ši užduotis jau išspręsta
            </p>
          </motion.div>
        )}

        {/* Description */}
        {challenge.description && (
          <div className="bg-[#F8FAFB] rounded-lg p-4 mb-4 text-sm text-[#00323C] leading-relaxed">
            {challenge.description}
          </div>
        )}

        {/* Image */}
        {challenge.image_url && (
          <div className="mb-4 rounded-xl overflow-hidden border border-gray-200">
            <img
              src={challenge.image_url}
              alt={challenge.title}
              className="w-full max-h-64 object-cover"
            />
          </div>
        )}

        {/* Google Maps */}
        {challenge.maps_url && (
          <div className="mb-4">
            <MapsEmbed
              url={challenge.maps_url}
              className="rounded-xl overflow-hidden"
            />
          </div>
        )}

        {/* Progressive hints */}
        {challengeHints.length > 0 && !isSolved && (
          <div className="mb-4 space-y-2">
            {revealedHintCount > 0 && (
              <div className="space-y-1.5">
                {challengeHints.slice(0, revealedHintCount).map((hint, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <div className="bg-[#FAC846]/5 border border-[#FAC846]/20 rounded-lg p-3 text-sm flex items-start gap-2">
                      <Lightbulb className="h-3.5 w-3.5 text-[#FAC846] shrink-0 mt-0.5" />
                      <p className="text-[#00323C]">{hint}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {revealedHintCount < challengeHints.length && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRevealedHintCount((prev) => prev + 1)}
                className="text-[#FAC846] hover:text-[#FAC846]/80 gap-1.5"
              >
                <Lightbulb className="h-3.5 w-3.5" />
                {revealedHintCount === 0
                  ? "Reikia užuominos?"
                  : `Kita užuomina (${revealedHintCount}/${challengeHints.length})`}
                {challenge.hint_penalty > 0 && (
                  <span className="text-[#FA2864] text-[10px]">
                    -{challenge.hint_penalty} tšk.
                  </span>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Answer form */}
        {!isSolved && (
          <form onSubmit={handleSubmit} className="space-y-3" aria-label="Atsakymo forma">
            {challenge.type === "multiple_choice" && challenge.options ? (
              <div className="space-y-2">
                {challenge.options.map((option, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant={answer === option ? "default" : "outline"}
                    className={`w-full justify-start h-auto py-3 px-4 text-left ${
                      answer === option
                        ? "bg-[#00D296] text-white hover:bg-[#00D296]/90"
                        : ""
                    }`}
                    onClick={() => setAnswer(option)}
                    disabled={loading}
                  >
                    <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mr-3 shrink-0">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </Button>
                ))}
              </div>
            ) : (
              <Input
                type={challenge.type === "number" ? "number" : "text"}
                inputMode={challenge.type === "number" ? "numeric" : "text"}
                placeholder="Jūsų atsakymas..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="h-12 text-base bg-white"
                autoFocus
                disabled={loading}
              />
            )}

            <Button
              type="submit"
              disabled={loading || !answer.trim()}
              className="w-full h-12 bg-[#00D296] hover:bg-[#00D296]/90 text-white font-semibold shadow-lg shadow-[#00D296]/25 gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Pateikti atsakymą
                </>
              )}
            </Button>
          </form>
        )}

        {/* Feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 space-y-3"
              role="alert"
              aria-live="assertive"
            >
              <div
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  feedback.is_correct
                    ? "bg-[#00D296]/10 border border-[#00D296]/20"
                    : "bg-[#FA2864]/5 border border-[#FA2864]/20"
                }`}
              >
                {feedback.is_correct ? (
                  <CheckCircle2 className="h-6 w-6 text-[#00D296] shrink-0" />
                ) : (
                  <XCircle className="h-6 w-6 text-[#FA2864] shrink-0" />
                )}
                <div>
                  <p
                    className={`font-medium ${
                      feedback.is_correct
                        ? "text-[#00D296]"
                        : "text-[#FA2864]"
                    }`}
                  >
                    {feedback.message}
                  </p>
                  {feedback.is_correct && feedback.points_awarded > 0 && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      +{feedback.points_awarded} taškų
                    </p>
                  )}
                </div>
              </div>

              {/* Explanation after correct answer */}
              {showExplanation && feedback.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="p-4 rounded-lg bg-[#008CB4]/5 border border-[#008CB4]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-[#008CB4]" />
                      <p className="text-sm font-semibold text-[#008CB4]">
                        Ar žinojote?
                      </p>
                    </div>
                    <p className="text-sm text-[#00323C]/80 leading-relaxed">
                      {feedback.explanation}
                    </p>
                  </div>
                  <Button
                    onClick={handleClose}
                    className="w-full bg-[#00D296] hover:bg-[#00D296]/90 text-white gap-2"
                  >
                    Grįžti
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {/* Close button after correct answer without explanation */}
              {feedback.is_correct && !feedback.explanation && (
                <Button
                  onClick={handleClose}
                  className="w-full bg-[#00D296] hover:bg-[#00D296]/90 text-white gap-2"
                >
                  Grįžti
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </SheetContent>
    </Sheet>
  )
}
