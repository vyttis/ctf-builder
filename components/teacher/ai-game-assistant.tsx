"use client"

import { useState } from "react"
import { AiGameIdea, AiGameSuggestResponse } from "@/lib/ai/types"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sparkles,
  Loader2,
  Wand2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  BookOpen,
  MapPin,
  FlaskConical,
  History,
  Globe,
  Music,
} from "lucide-react"

interface AiGameAssistantProps {
  onAcceptIdea: (idea: AiGameIdea) => void
}

const themeButtons = [
  { label: "Istorija", theme: "Lietuvos istorija", icon: History },
  { label: "Gamta", theme: "Gamta ir biologija", icon: FlaskConical },
  { label: "Geografija", theme: "Geografija ir kelionės", icon: Globe },
  { label: "Miestas", theme: "Miesto pažinimas ir orientavimasis", icon: MapPin },
  { label: "Literatūra", theme: "Lietuvių literatūra", icon: BookOpen },
  { label: "Muzika", theme: "Muzika ir kultūra", icon: Music },
]

export function AiGameAssistant({ onAcceptIdea }: AiGameAssistantProps) {
  const [expanded, setExpanded] = useState(false)
  const [ideas, setIdeas] = useState<AiGameIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [teacherPrompt, setTeacherPrompt] = useState("")

  async function handleGenerate(themeOverride?: string) {
    setLoading(true)
    setError(null)
    setExpanded(true)

    try {
      const res = await fetch("/api/ai/suggest-game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: themeOverride || undefined,
          teacher_prompt: teacherPrompt.trim() || undefined,
          count: 3,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Nepavyko sugeneruoti idėjų")
      }

      const data: AiGameSuggestResponse = await res.json()
      setIdeas(data.ideas)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nežinoma klaida")
    } finally {
      setLoading(false)
    }
  }

  function handleAccept(idea: AiGameIdea) {
    onAcceptIdea(idea)
    setIdeas((prev) => prev.filter((i) => i !== idea))
  }

  function handleReject(index: number) {
    setIdeas((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Card className="border-highlight/30 bg-gradient-to-br from-highlight/5 to-transparent shadow-sm">
      <CardContent className="p-4">
        {/* Toggle header */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-highlight/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-highlight" />
            </div>
            <div className="text-left">
              <p className="font-medium text-steam-dark text-sm">
                AI Padėjėjas
              </p>
              <p className="text-xs text-muted-foreground">
                Leiskite AI sugeneruoti žaidimo idėją
              </p>
            </div>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {/* Expandable content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 space-y-4">
                {/* Theme buttons */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    Pasirinkite temą
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {themeButtons.map((btn) => {
                      const Icon = btn.icon
                      return (
                        <Button
                          key={btn.label}
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={loading}
                          onClick={() => handleGenerate(btn.theme)}
                          className="h-auto py-2 px-2 flex flex-col items-center gap-1 text-xs border-border/50 hover:border-highlight/50 hover:bg-highlight/5"
                        >
                          <Icon className="h-4 w-4 text-highlight" />
                          {btn.label}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Custom prompt */}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Arba aprašykite savo temą... pvz., Klaipėdos miesto istorija"
                    value={teacherPrompt}
                    onChange={(e) => setTeacherPrompt(e.target.value)}
                    className="resize-none bg-white text-sm"
                    rows={2}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    onClick={() => handleGenerate()}
                    disabled={loading}
                    size="sm"
                    className="w-full bg-highlight hover:bg-highlight/90 text-steam-dark font-medium gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generuojama...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        Generuoti idėjas
                      </>
                    )}
                  </Button>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 text-sm text-accent">
                    {error}
                  </div>
                )}

                {/* Loading */}
                {loading && (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-border/30 p-3 space-y-2"
                      >
                        <div className="h-4 w-2/3 bg-muted/50 rounded animate-pulse" />
                        <div className="h-3 w-full bg-muted/30 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Ideas list */}
                {!loading && ideas.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">
                      Pasiūlymai — paspauskite norėdami pasirinkti
                    </p>
                    <AnimatePresence>
                      {ideas.map((idea, index) => (
                        <motion.div
                          key={`${idea.title}-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="rounded-lg border border-border/50 bg-white p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-steam-dark text-sm">
                                  {idea.title}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                  {idea.description}
                                </p>
                              </div>
                              <Badge
                                variant="secondary"
                                className="text-xs shrink-0"
                              >
                                {idea.theme}
                              </Badge>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleAccept(idea)}
                                className="bg-primary hover:bg-primary/90 text-white gap-1.5 text-xs h-7"
                              >
                                <Check className="h-3 w-3" />
                                Naudoti
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReject(index)}
                                className="text-muted-foreground hover:text-accent gap-1.5 text-xs h-7"
                              >
                                <X className="h-3 w-3" />
                                Atmesti
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
