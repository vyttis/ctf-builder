"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send,
  Loader2,
  Trophy,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Star,
  BarChart3,
  Clock,
  Play,
  AlertTriangle,
} from "lucide-react"
import type { PlayerSession, SubmissionResult, ChallengeType, GameSettings } from "@/types/game"
import { MapsEmbed } from "@/components/shared/maps-embed"
import { ReflectionForm } from "@/components/player/reflection-form"
import Link from "next/link"

interface PlayerChallenge {
  id: string
  title: string
  description: string | null
  type: ChallengeType
  points: number
  hints: string[]
  options: string[] | null
  order_index: number
  image_url: string | null
  maps_url: string | null
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export default function PlayPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const gameCode = (params.gameCode as string).toUpperCase()

  const [session, setSession] = useState<PlayerSession | null>(null)
  const [challenges, setChallenges] = useState<PlayerChallenge[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<SubmissionResult | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set())
  const [showHint, setShowHint] = useState(false)
  const [gameFinished, setGameFinished] = useState(false)
  const [reflectionDone, setReflectionDone] = useState(false)

  // Check if reflection already done
  useEffect(() => {
    const stored = localStorage.getItem(`ctf_reflection_${gameCode}`)
    if (stored) setReflectionDone(true)
  }, [gameCode])

  // Timer state
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [timeExpired, setTimeExpired] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)

  const handleTimeExpired = useCallback(() => {
    setTimeExpired(true)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Timer tick effect
  useEffect(() => {
    if (!gameStarted || !timeLimitMinutes || timeExpired || gameFinished) return

    const storageKey = `ctf_start_${gameCode}`
    let startTime = startTimeRef.current

    if (!startTime) {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        startTime = parseInt(stored, 10)
      } else {
        startTime = Date.now()
        localStorage.setItem(storageKey, startTime.toString())
      }
      startTimeRef.current = startTime
    }

    const totalMs = timeLimitMinutes * 60 * 1000
    const endTime = startTime + totalMs

    function tick() {
      const now = Date.now()
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000))
      setRemainingSeconds(remaining)

      if (remaining <= 0) {
        handleTimeExpired()
      }
    }

    tick() // initial
    timerRef.current = setInterval(tick, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameStarted, timeLimitMinutes, timeExpired, gameFinished, gameCode, handleTimeExpired])

  useEffect(() => {
    const stored = localStorage.getItem(`ctf_session_${gameCode}`)
    if (!stored) {
      router.replace(`/play/${gameCode}`)
      return
    }

    try {
      const s: PlayerSession = JSON.parse(stored)
      setSession(s)
      loadChallenges(s)
    } catch {
      router.replace(`/play/${gameCode}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameCode, router])

  async function loadChallenges(s: PlayerSession) {
    const supabase = createClient()

    const { data: game } = await supabase
      .from("games")
      .select("id, settings")
      .eq("game_code", gameCode)
      .single()

    if (!game) return

    // Check time limit
    const settings = game.settings as GameSettings | null
    const timeLimit = settings?.time_limit_minutes ?? null
    setTimeLimitMinutes(timeLimit)

    // If no time limit, or if already started (has start time in localStorage), auto-start
    const storageKey = `ctf_start_${gameCode}`
    const existingStart = localStorage.getItem(storageKey)
    if (!timeLimit || existingStart) {
      setGameStarted(true)

      // Check if time already expired
      if (timeLimit && existingStart) {
        const startTime = parseInt(existingStart, 10)
        const totalMs = timeLimit * 60 * 1000
        if (Date.now() > startTime + totalMs) {
          setTimeExpired(true)
        }
      }
    }

    const { data } = await supabase
      .from("challenges")
      .select("id, title, description, type, points, hints, options, order_index, image_url, maps_url")
      .eq("game_id", game.id)
      .order("order_index", { ascending: true })

    if (data) {
      setChallenges(data as PlayerChallenge[])
    }

    const { data: submissions } = await supabase
      .from("submissions")
      .select("challenge_id, points_awarded")
      .eq("team_id", s.team_id)
      .eq("is_correct", true)

    if (submissions) {
      const solved = new Set(submissions.map((sub) => sub.challenge_id))
      setSolvedIds(solved)
      const points = submissions.reduce((sum, sub) => sum + sub.points_awarded, 0)
      setTotalPoints(points)

      if (data) {
        const firstUnsolved = data.findIndex((c) => !solved.has(c.id))
        setCurrentIndex(firstUnsolved >= 0 ? firstUnsolved : data.length)
        if (firstUnsolved < 0) setGameFinished(true)
      }
    }
  }

  function handleStart() {
    const storageKey = `ctf_start_${gameCode}`
    const now = Date.now()
    localStorage.setItem(storageKey, now.toString())
    startTimeRef.current = now
    setGameStarted(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!answer.trim() || !session || !challenges[currentIndex] || timeExpired) return

    setLoading(true)
    setFeedback(null)

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_token: session.session_token,
          challenge_id: challenges[currentIndex].id,
          answer: answer.trim(),
        }),
      })

      if (res.status === 429) {
        toast({
          title: "Per daug bandymų",
          description: "Palaukite minutę ir bandykite dar kartą.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const result: SubmissionResult = await res.json()
      setFeedback(result)

      if (result.is_correct) {
        setTotalPoints(result.total_points || totalPoints + result.points_awarded)
        setSolvedIds((prev) => {
          const next = new Set(Array.from(prev))
          next.add(challenges[currentIndex].id)
          return next
        })
        setAnswer("")

        setTimeout(() => {
          setFeedback(null)
          setShowHint(false)
          if (currentIndex + 1 < challenges.length) {
            setCurrentIndex(currentIndex + 1)
          } else {
            setGameFinished(true)
          }
        }, 2000)
      }
    } catch {
      toast({
        title: "Klaida",
        description: "Nepavyko pateikti atsakymo",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (!session || challenges.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Time expired screen
  if (timeExpired && !gameFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
            <AlertTriangle className="h-10 w-10 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-steam-dark mb-2">
            Laikas baigėsi!
          </h1>
          <p className="text-muted-foreground mb-6">
            Žaidimui skirtas laikas pasibaigė. Jūsų rezultatai buvo išsaugoti.
          </p>

          <div className="bg-primary/5 rounded-2xl p-6 mb-6">
            <Trophy className="h-8 w-8 text-highlight mx-auto mb-2" />
            <p className="text-3xl font-bold text-steam-dark">{totalPoints}</p>
            <p className="text-sm text-muted-foreground">surinktų taškų</p>
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
            <span>{solvedIds.size} iš {challenges.length} išspręsta</span>
          </div>

          <p className="text-sm font-medium text-steam-dark mb-1">
            Komanda: {session.team_name}
          </p>

          <Link href={`/play/${gameCode}/leaderboard`}>
            <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-white gap-2">
              <BarChart3 className="h-4 w-4" />
              Rezultatų lentelė
            </Button>
          </Link>

          {!reflectionDone && (
            <ReflectionForm
              challenges={challenges.map(c => ({ id: c.id, title: c.title }))}
              sessionToken={session.session_token}
              gameCode={gameCode}
              onDone={() => setReflectionDone(true)}
            />
          )}
        </motion.div>
      </div>
    )
  }

  // "Ready to start?" screen (only when time limit exists and not yet started)
  if (timeLimitMinutes && !gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Clock className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-2xl font-bold text-steam-dark mb-2">
            Pasiruošę?
          </h1>
          <p className="text-muted-foreground mb-2">
            Šis žaidimas turi laiko limitą.
          </p>

          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
            <p className="text-lg font-bold text-steam-dark">
              {timeLimitMinutes} min.
            </p>
            <p className="text-sm text-muted-foreground">
              Paspaudus &quot;Pradėti&quot;, laikas pradės skaičiuotis atgal.
            </p>
          </div>

          <div className="space-y-3 text-left mb-6 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>Užduočių skaičius: <strong className="text-steam-dark">{challenges.length}</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>Pasibaigus laikui, žaidimas bus automatiškai sustabdytas</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">•</span>
              <span>Jūsų rezultatai bus išsaugoti</span>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleStart}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-lg shadow-primary/25 gap-3"
          >
            <Play className="h-6 w-6" />
            Pradėti žaidimą
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Komanda: <span className="font-medium text-steam-dark">{session.team_name}</span>
          </p>
        </motion.div>
      </div>
    )
  }

  // Game finished screen
  if (gameFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <img
            src="/illustrations/celebration.svg"
            alt=""
            className="w-48 h-48 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-steam-dark mb-2">
            Sveikiname! 🎉
          </h1>
          <p className="text-muted-foreground mb-4">
            Jūs atsakėte į visas užduotis!
          </p>

          <div className="bg-primary/5 rounded-2xl p-6 mb-6">
            <Trophy className="h-8 w-8 text-highlight mx-auto mb-2" />
            <p className="text-3xl font-bold text-steam-dark">{totalPoints}</p>
            <p className="text-sm text-muted-foreground">surinktų taškų</p>
          </div>

          <p className="text-sm font-medium text-steam-dark mb-1">
            Komanda: {session.team_name}
          </p>

          <Link href={`/play/${gameCode}/leaderboard`}>
            <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-white gap-2">
              <BarChart3 className="h-4 w-4" />
              Rezultatų lentelė
            </Button>
          </Link>

          {!reflectionDone && (
            <ReflectionForm
              challenges={challenges.map(c => ({ id: c.id, title: c.title }))}
              sessionToken={session.session_token}
              gameCode={gameCode}
              onDone={() => setReflectionDone(true)}
            />
          )}
        </motion.div>
      </div>
    )
  }

  const currentChallenge = challenges[currentIndex]
  const progressValue = (solvedIds.size / challenges.length) * 100
  const challengeHints = (currentChallenge.hints as string[]) || []
  const isTimerWarning = timeLimitMinutes && remainingSeconds > 0 && remainingSeconds <= 60

  return (
    <div className="min-h-screen p-4 pb-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs tracking-wider">
              {gameCode}
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Star className="h-3 w-3 text-highlight" />
              {totalPoints} tšk.
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {/* Timer badge */}
            {timeLimitMinutes && remainingSeconds > 0 && (
              <Badge
                variant={isTimerWarning ? "destructive" : "outline"}
                className={`gap-1 font-mono text-xs tabular-nums ${
                  isTimerWarning ? "animate-pulse" : ""
                }`}
              >
                <Clock className="h-3 w-3" />
                {formatTime(remainingSeconds)}
              </Badge>
            )}
            <Link href={`/play/${gameCode}/leaderboard`}>
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                <BarChart3 className="h-3.5 w-3.5" />
                Lentelė
              </Button>
            </Link>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Užduotis {currentIndex + 1} iš {challenges.length}</span>
            <span>{solvedIds.size} išspręsta</span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Challenge card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentChallenge.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="border-border/50 bg-white shadow-lg mb-4">
              <CardContent className="p-5">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
                    {currentIndex + 1}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-steam-dark">
                      {currentChallenge.title}
                    </h2>
                    <Badge variant="outline" className="text-xs mt-1">
                      {currentChallenge.points} taškų
                    </Badge>
                  </div>
                </div>

                {currentChallenge.description && (
                  <div className="bg-muted/30 rounded-lg p-4 mb-4 text-sm text-steam-dark leading-relaxed">
                    {currentChallenge.description}
                  </div>
                )}

                {/* Paveiksliukas */}
                {currentChallenge.image_url && (
                  <div className="mb-4 rounded-xl overflow-hidden border border-border/30">
                    <img
                      src={currentChallenge.image_url}
                      alt={currentChallenge.title}
                      className="w-full max-h-64 object-cover"
                    />
                  </div>
                )}

                {/* Google Maps */}
                {currentChallenge.maps_url && (
                  <div className="mb-4">
                    <MapsEmbed url={currentChallenge.maps_url} className="rounded-xl overflow-hidden" />
                  </div>
                )}

                {challengeHints.length > 0 && !showHint && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHint(true)}
                    className="text-highlight hover:text-highlight/80 gap-1 mb-3"
                  >
                    <Lightbulb className="h-3.5 w-3.5" />
                    Reikia užuominos?
                  </Button>
                )}

                <AnimatePresence>
                  {showHint && challengeHints.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4"
                    >
                      <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-3 text-sm">
                        <div className="flex items-center gap-1 text-highlight font-medium mb-1">
                          <Lightbulb className="h-3.5 w-3.5" />
                          Užuomina
                        </div>
                        {challengeHints.map((hint, i) => (
                          <p key={i} className="text-steam-dark">{hint}</p>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-3">
                  {currentChallenge.type === "multiple_choice" && currentChallenge.options ? (
                    <div className="space-y-2">
                      {(currentChallenge.options as string[]).map((option, i) => (
                        <Button
                          key={i}
                          type="button"
                          variant={answer === option ? "default" : "outline"}
                          className={`w-full justify-start h-auto py-3 px-4 text-left ${
                            answer === option ? "bg-primary text-white" : ""
                          }`}
                          onClick={() => setAnswer(option)}
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
                      type={currentChallenge.type === "number" ? "number" : "text"}
                      inputMode={currentChallenge.type === "number" ? "numeric" : "text"}
                      placeholder="Jūsų atsakymas..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      className="h-12 text-base bg-white"
                      autoFocus
                    />
                  )}

                  <Button
                    type="submit"
                    disabled={loading || !answer.trim()}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25 gap-2"
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

                <AnimatePresence>
                  {feedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mt-4 p-4 rounded-lg flex items-center gap-3 ${
                        feedback.is_correct
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-accent/5 border border-accent/20"
                      }`}
                    >
                      {feedback.is_correct ? (
                        <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                      ) : (
                        <XCircle className="h-6 w-6 text-accent shrink-0" />
                      )}
                      <div>
                        <p className={`font-medium ${feedback.is_correct ? "text-primary" : "text-accent"}`}>
                          {feedback.message}
                        </p>
                        {feedback.is_correct && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Pereinama prie kitos užduoties...
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="text-center text-sm text-muted-foreground">
          <span>Komanda: </span>
          <span className="font-medium text-steam-dark">{session.team_name}</span>
        </div>
      </div>
    </div>
  )
}
