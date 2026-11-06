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
  LogOut,
  BookOpen,
  ChevronRight,
} from "lucide-react"
import type { PlayerSession, SubmissionResult, ChallengeType, GameSettings, AchievementType } from "@/types/game"
import { getPlayerSession, clearPlayerSession } from "@/lib/game/session"
import { pluralizeLt } from "@/lib/utils"
import { MapsEmbed } from "@/components/shared/maps-embed"
import { ReflectionForm } from "@/components/player/reflection-form"
import { FinishRequestCard } from "@/components/access/finish-request-card"
import { AnnouncementBanner } from "@/components/player/announcement-banner"
import { AchievementToast } from "@/components/player/achievement-toast"
import { ChallengeGrid } from "@/components/player/challenge-grid"
import { ChallengeDetailModal } from "@/components/player/challenge-detail-modal"
import Link from "next/link"
import Image from "next/image"

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
  hint_penalty: number
  prerequisites: string[]
}

interface ExtendedSubmissionResult extends SubmissionResult {
  explanation?: string | null
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return "00:00"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const mmss = `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  return h > 0 ? `${h}:${mmss}` : mmss
}

// Number challenges accept both decimal separators — Lithuanian mobile
// keypads type "3,14", teachers hash "3.14".
function normalizeNumericAnswer(value: string): string {
  return value.trim().replace(",", ".")
}

// Stamp the team's server-side start (idempotent). Best-effort: the countdown
// UI runs off localStorage regardless; this is what /api/submissions enforces
// the deadline against.
async function stampGameStart(token: string): Promise<void> {
  try {
    await fetch("/api/play/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_token: token }),
    })
  } catch {
    // Ignored — enforcement still works from whenever started_at first gets set.
  }
}

// Record a hint reveal server-side so the penalty is computed from stored rows,
// not the client-declared count. Best-effort: a failed call just means the
// student keeps the benefit of the doubt on that hint.
async function recordHintReveal(
  token: string,
  challengeId: string,
  hintIndex: number
): Promise<void> {
  try {
    await fetch("/api/play/hint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_token: token,
        challenge_id: challengeId,
        hint_index: hintIndex,
      }),
    })
  } catch {
    // Ignored — best effort.
  }
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
  const [feedback, setFeedback] = useState<ExtendedSubmissionResult | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set())
  const [revealedHintCount, setRevealedHintCount] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null)
  const [gameFinished, setGameFinished] = useState(false)
  const [reflectionDone, setReflectionDone] = useState(false)
  // Live game status: paused shows a full-screen overlay, finished ends the
  // game even mid-play (teacher-ended)
  const [gameStatus, setGameStatus] = useState<string>("active")
  // Bumped on every realtime status event, so a status poll that started
  // earlier can tell its answer is older and must not overwrite it.
  const statusVersionRef = useRef(0)
  const [endedByTeacher, setEndedByTeacher] = useState(false)
  const [loadError, setLoadError] = useState(false)
  // Distinguishes "still loading" from "loaded, but the game has no challenges"
  const [stateLoaded, setStateLoaded] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(true)

  // Free mode state
  const [pathMode, setPathMode] = useState<"linear" | "free">("linear")
  const [selectedChallengeIndex, setSelectedChallengeIndex] = useState<number | null>(null)
  const [gameId, setGameId] = useState<string | null>(null)

  // Achievement state
  const [achievementQueue, setAchievementQueue] = useState<{ type: AchievementType; metadata?: Record<string, unknown> }[]>([])
  const pendingAchievement = achievementQueue.length > 0 ? achievementQueue[0] : null
  const dismissAchievement = () => setAchievementQueue((q) => q.slice(1))

  // Check if reflection already done
  useEffect(() => {
    const stored = localStorage.getItem(`ctf_reflection_${gameCode}`)
    if (stored) setReflectionDone(true)
  }, [gameCode])

  // Timer state
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [timeExpired, setTimeExpired] = useState(false)
  const [allowAccessRequests, setAllowAccessRequests] = useState(false)
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
    const s = getPlayerSession(gameCode)
    if (!s) {
      router.replace(`/play/${gameCode}`)
      return
    }

    setSession(s)
    loadChallenges(s)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameCode, router])

  async function loadChallenges(s: PlayerSession) {
    // Single round-trip via /api/play/state (game + challenges + solved submissions)
    setLoadError(false)
    let state: {
      game: { id: string; status?: string; settings: GameSettings | null } | null
      challenges: PlayerChallenge[]
      team: { id: string; name: string } | null
      solved: { challenge_id: string; points_awarded: number }[]
    }
    try {
      const res = await fetch(
        `/api/play/state?game_code=${encodeURIComponent(gameCode)}`,
        { headers: { "x-session-token": s.session_token } }
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      state = await res.json()
    } catch {
      setLoadError(true)
      return
    }

    if (!state.game) {
      setLoadError(true)
      return
    }

    // Session token no longer matches a team in this game (team deleted,
    // token from another game/device) — without this check every submit 401s
    // with no way out, because the join page redirects back here while any
    // stored session exists.
    if (state.team === null && state.game.status !== "draft") {
      clearPlayerSession(gameCode)
      router.replace(`/play/${gameCode}`)
      return
    }

    setGameId(state.game.id)
    if (state.game.status) {
      setGameStatus(state.game.status)
      if (state.game.status === "finished") {
        setEndedByTeacher(true)
        setGameFinished(true)
      }
    }

    const settings = state.game.settings
    const timeLimit = settings?.time_limit_minutes ?? null
    setTimeLimitMinutes(timeLimit)
    setPathMode(settings?.challenge_path_mode || "linear")
    setShowLeaderboard(settings?.show_leaderboard !== false)
    setAllowAccessRequests(settings?.allow_access_requests === true)

    const storageKey = `ctf_start_${gameCode}`
    const existingStart = localStorage.getItem(storageKey)
    if (!timeLimit || existingStart) {
      setGameStarted(true)
      if (timeLimit && existingStart) {
        // Already started on this device — ensure the server has a started_at
        // so deadline enforcement works even for pre-existing runs (idempotent).
        stampGameStart(s.session_token)
        const startTime = parseInt(existingStart, 10)
        const totalMs = timeLimit * 60 * 1000
        if (Date.now() > startTime + totalMs) {
          setTimeExpired(true)
        }
      }
    }

    setChallenges(state.challenges)

    const solved = new Set(state.solved.map((sub) => sub.challenge_id))
    setSolvedIds(solved)
    const points = state.solved.reduce((sum, sub) => sum + sub.points_awarded, 0)
    setTotalPoints(points)

    const firstUnsolved = state.challenges.findIndex((c) => !solved.has(c.id))
    setCurrentIndex(firstUnsolved >= 0 ? firstUnsolved : state.challenges.length)
    if (state.challenges.length > 0 && firstUnsolved < 0) setGameFinished(true)
    setStateLoaded(true)
  }

  // Subscribe to game setting changes (time extensions, status changes)
  useEffect(() => {
    if (!gameId) return
    const supabase = createClient()
    const channel = supabase
      .channel(`game_settings_${gameId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => {
          const updated = payload.new as { settings?: GameSettings; status?: string }
          if (updated.settings?.time_limit_minutes !== undefined) {
            setTimeLimitMinutes(updated.settings.time_limit_minutes)
            // If time was expired but limit was extended, recheck
            if (timeExpired && updated.settings.time_limit_minutes) {
              const storageKey = `ctf_start_${gameCode}`
              const stored = localStorage.getItem(storageKey)
              if (stored) {
                const startTime = parseInt(stored, 10)
                const totalMs = updated.settings.time_limit_minutes * 60 * 1000
                if (Date.now() < startTime + totalMs) {
                  setTimeExpired(false)
                }
              }
            }
          }
          if (updated.status) {
            statusVersionRef.current += 1
            setGameStatus(updated.status)
            if (updated.status === "finished") {
              setEndedByTeacher(true)
              setGameFinished(true)
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [gameId, gameCode, timeExpired])

  // Status polling safety net: paused games may be invisible to anon realtime
  // (RLS), so realtime alone cannot be trusted to deliver pause events.
  // 5 s keeps a teacher's pause visible to participants almost at once;
  // the request is a tiny status read, and it also re-runs when the tab
  // becomes visible again (phones suspend timers in the background).
  useEffect(() => {
    if (gameFinished) return

    // One request at a time: overlapping polls could finish out of order and
    // an older "active" would hide the pause overlay. A hung request is cut
    // off so it cannot block the next polls.
    let inFlight = false
    let disposed = false
    const checkStatus = async () => {
      if (inFlight) return
      inFlight = true
      const startedAt = statusVersionRef.current
      try {
        const res = await fetch(
          `/api/play/status?game_code=${encodeURIComponent(gameCode)}`,
          {
            cache: "no-store",
            // AbortSignal.timeout is missing on older phones (iOS < 16)
            signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(8000) : undefined,
          }
        )
        if (!res.ok) return
        const data = (await res.json()) as { status: string | null; allow_access_requests?: boolean }
        if (disposed || !data.status) return
        if (statusVersionRef.current !== startedAt) return
        setGameStatus(data.status)
        if (typeof data.allow_access_requests === "boolean") setAllowAccessRequests(data.allow_access_requests)
        if (data.status === "finished") {
          setEndedByTeacher(true)
          setGameFinished(true)
        }
      } catch {
        // Network hiccup or timeout: the next poll retries
      } finally {
        inFlight = false
      }
    }

    const interval = setInterval(checkStatus, 5000)
    const onVisible = () => {
      if (document.visibilityState === "visible") void checkStatus()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      disposed = true
      clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [gameCode, gameFinished])

  function handleStart() {
    const storageKey = `ctf_start_${gameCode}`
    const now = Date.now()
    localStorage.setItem(storageKey, now.toString())
    startTimeRef.current = now
    setGameStarted(true)
    // Anchor the server-side deadline on the moment the student taps start.
    if (session) stampGameStart(session.session_token)
  }

  // Free mode: handle submission from challenge detail modal
  async function handleFreeSubmit(submittedAnswer: string, hintsUsed: number): Promise<{ is_correct: boolean; points_awarded: number; message: string; explanation?: string | null }> {
    if (!session || selectedChallengeIndex === null) {
      return { is_correct: false, points_awarded: 0, message: "Klaida" }
    }
    const challenge = challenges[selectedChallengeIndex]
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_token: session.session_token,
          challenge_id: challenge.id,
          answer:
            challenge.type === "number"
              ? normalizeNumericAnswer(submittedAnswer)
              : submittedAnswer.trim(),
          hints_used: hintsUsed,
        }),
      })

      if (res.status === 429) {
        return { is_correct: false, points_awarded: 0, message: "Per daug bandymų. Palaukite minutę." }
      }

      // Error responses carry { error } — surface the message instead of an
      // empty red feedback box; a dead session gets a way out.
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        if (res.status === 401) {
          clearPlayerSession(gameCode)
          router.replace(`/play/${gameCode}`)
        }
        return {
          is_correct: false,
          points_awarded: 0,
          message: err?.error || "Nepavyko pateikti atsakymo. Bandykite dar kartą.",
        }
      }

      const result: ExtendedSubmissionResult & {
        achievements?: { type: AchievementType; metadata?: Record<string, unknown> }[]
        total_points?: number
      } = await res.json()

      if (result.is_correct) {
        setTotalPoints(result.total_points || totalPoints + result.points_awarded)
        setSolvedIds((prev) => {
          const next = new Set(Array.from(prev))
          next.add(challenge.id)
          return next
        })
        // Show achievement if earned
        if (result.achievements && result.achievements.length > 0) {
          const earned = result.achievements
          setAchievementQueue((q) => [...q, ...earned])
        }
        // Check if all solved
        if (solvedIds.size + 1 >= challenges.length) {
          setTimeout(() => {
            setSelectedChallengeIndex(null)
            setGameFinished(true)
          }, 2000)
        }
      }

      return result
    } catch {
      return { is_correct: false, points_awarded: 0, message: "Tinklo klaida. Bandykite dar kartą." }
    }
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
          answer:
            challenges[currentIndex].type === "number"
              ? normalizeNumericAnswer(answer)
              : answer.trim(),
          hints_used: revealedHintCount,
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

      // Error responses carry { error }, not a SubmissionResult — showing
      // them as feedback rendered an empty red box with no message.
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        if (res.status === 401) {
          clearPlayerSession(gameCode)
          router.replace(`/play/${gameCode}`)
          return
        }
        toast({
          title: "Nepavyko pateikti atsakymo",
          description: err?.error || "Bandykite dar kartą.",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const result: ExtendedSubmissionResult & {
        achievements?: { type: AchievementType; metadata?: Record<string, unknown> }[]
      } = await res.json()
      setFeedback(result)

      // Show achievement toast if earned
      if (result.achievements && result.achievements.length > 0) {
        const earned = result.achievements
        setAchievementQueue((q) => [...q, ...earned])
      }

      if (result.is_correct) {
        setTotalPoints(result.total_points || totalPoints + result.points_awarded)
        setSolvedIds((prev) => {
          const next = new Set(Array.from(prev))
          next.add(challenges[currentIndex].id)
          return next
        })
        setAnswer("")

        // Show explanation if available
        if (result.explanation) {
          setCurrentExplanation(result.explanation)
          setShowExplanation(true)
          // Don't auto-advance — wait for user to click "Toliau"
        } else {
          setTimeout(() => {
            setFeedback(null)
            setRevealedHintCount(0)
            if (currentIndex + 1 < challenges.length) {
              setCurrentIndex(currentIndex + 1)
            } else {
              setGameFinished(true)
            }
          }, 2000)
        }
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

  // Load error state (network failure or game unavailable)
  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-xl font-bold text-steam-dark mb-2">
            Nepavyko įkelti žaidimo
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Patikrinkite interneto ryšį arba paklauskite vedėjo, ar žaidimas
            vis dar vyksta.
          </p>
          <Button
            onClick={() => session && loadChallenges(session)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Bandyti dar kartą
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              clearPlayerSession(gameCode)
              router.replace(`/play/${gameCode}`)
            }}
            className="w-full mt-2 text-muted-foreground gap-2"
          >
            <LogOut className="h-4 w-4" />
            Prisijungti iš naujo
          </Button>
        </div>
      </div>
    )
  }

  // Loading state
  if (!session || !stateLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // The game was reverted to draft, or has no challenges (e.g. the teacher
  // deleted them mid-game) — an explicit message instead of a forever-spinner.
  if (gameStatus === "draft" || (challenges.length === 0 && !gameFinished)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-highlight/10 flex items-center justify-center">
            <Clock className="h-8 w-8 text-highlight" />
          </div>
          <h1 className="text-xl font-bold text-steam-dark mb-2">
            {gameStatus === "draft"
              ? "Žaidimas dar neprasidėjo"
              : "Žaidime dar nėra užduočių"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {gameStatus === "draft"
              ? "Palaukite, kol vedėjas paleis žaidimą, ir bandykite dar kartą."
              : "Paklauskite vedėjo, ar žaidimas paruoštas, ir bandykite dar kartą."}
          </p>
          <Button
            onClick={() => session && loadChallenges(session)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Atnaujinti
          </Button>
        </div>
      </div>
    )
  }

  // Paused by the teacher — full-screen overlay until the game resumes
  if (gameStatus === "paused" && !gameFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-steam-dark">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm text-center text-white"
          role="status"
          aria-live="polite"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
            <Clock className="h-10 w-10 text-highlight" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Žaidimas pristabdytas</h1>
          <p className="text-white/70 mb-6">
            Palaukite, kol vedėjas tęs žaidimą. Jūsų taškai išsaugoti.
          </p>
          <div className="bg-white/5 rounded-2xl p-4 mb-2">
            <p className="text-2xl font-bold">{totalPoints} tšk.</p>
            <p className="text-sm text-white/60">
              Komanda: {session.team_name}
            </p>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-white/50">
            <div className="w-2 h-2 rounded-full bg-highlight animate-pulse" />
            Laukiama tęsimo...
          </div>
        </motion.div>
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

          {showLeaderboard && (
            <Link href={`/play/${gameCode}/leaderboard`}>
              <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <BarChart3 className="h-4 w-4" />
                Rezultatų lentelė
              </Button>
            </Link>
          )}

          {!reflectionDone && (
            <ReflectionForm
              challenges={challenges.map(c => ({ id: c.id, title: c.title }))}
              sessionToken={session.session_token}
              gameCode={gameCode}
              onDone={() => setReflectionDone(true)}
            />
          )}

          {allowAccessRequests && (
            <FinishRequestCard gameCode={gameCode} sessionToken={session.session_token} />
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
              <span className="text-primary-ink font-bold mt-0.5">•</span>
              <span>Užduočių skaičius: <strong className="text-steam-dark">{challenges.length}</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-ink font-bold mt-0.5">•</span>
              <span>Pasibaigus laikui, žaidimas bus automatiškai sustabdytas</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-ink font-bold mt-0.5">•</span>
              <span>Jūsų rezultatai bus išsaugoti</span>
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleStart}
            className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25 gap-3"
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
          <Image src="/illustrations/celebration.svg" alt="" width={192} height={192} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-steam-dark mb-2">
            {endedByTeacher && solvedIds.size < challenges.length
              ? "Žaidimas baigtas!"
              : "Sveikiname! 🎉"}
          </h1>
          <p className="text-muted-foreground mb-4">
            {endedByTeacher && solvedIds.size < challenges.length
              ? `Vedėjas užbaigė žaidimą. Išsprendėte ${solvedIds.size} iš ${challenges.length} užduočių.`
              : "Jūs išsprendėte visas užduotis!"}
          </p>

          <div className="bg-primary/5 rounded-2xl p-6 mb-6">
            <Trophy className="h-8 w-8 text-highlight mx-auto mb-2" />
            <p className="text-3xl font-bold text-steam-dark">{totalPoints}</p>
            <p className="text-sm text-muted-foreground">surinktų taškų</p>
          </div>

          <p className="text-sm font-medium text-steam-dark mb-1">
            Komanda: {session.team_name}
          </p>

          {showLeaderboard && (
            <Link href={`/play/${gameCode}/leaderboard`}>
              <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                <BarChart3 className="h-4 w-4" />
                Rezultatų lentelė
              </Button>
            </Link>
          )}

          {!reflectionDone && (
            <ReflectionForm
              challenges={challenges.map(c => ({ id: c.id, title: c.title }))}
              sessionToken={session.session_token}
              gameCode={gameCode}
              onDone={() => setReflectionDone(true)}
            />
          )}

          {allowAccessRequests && (
            <FinishRequestCard gameCode={gameCode} sessionToken={session.session_token} />
          )}
        </motion.div>
      </div>
    )
  }

  // Free mode: show challenge grid
  if (pathMode === "free") {
    return (
      <div className="min-h-screen p-4 pb-8">
        <div className="max-w-2xl mx-auto">
          {/* Announcement banner */}
          {gameId && <AnnouncementBanner gameId={gameId} />}

          {/* Achievement toast */}
          {pendingAchievement && (
            <AchievementToast
              achievement={pendingAchievement}
              onDismiss={dismissAchievement}
            />
          )}

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
              {timeLimitMinutes && remainingSeconds > 0 && (
                <Badge
                  variant={
                    remainingSeconds <= 60
                      ? "destructive"
                      : remainingSeconds <= 300
                        ? "default"
                        : "outline"
                  }
                  className={`gap-1 font-mono text-xs tabular-nums ${
                    remainingSeconds <= 60 ? "animate-pulse" : ""
                  } ${
                    remainingSeconds > 60 && remainingSeconds <= 300
                      ? "bg-highlight text-highlight-foreground"
                      : ""
                  }`}
                  aria-live={remainingSeconds <= 60 ? "assertive" : "off"}
                >
                  <Clock className="h-3 w-3" />
                  {formatTime(remainingSeconds)}
                </Badge>
              )}
              {showLeaderboard && (
                <Link href={`/play/${gameCode}/leaderboard`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    <BarChart3 className="h-3.5 w-3.5" />
                    Lentelė
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <ChallengeGrid
            challenges={challenges}
            solvedIds={solvedIds}
            onSelectChallenge={(index) => setSelectedChallengeIndex(index)}
          />

          <ChallengeDetailModal
            challenge={selectedChallengeIndex !== null ? challenges[selectedChallengeIndex] : null}
            open={selectedChallengeIndex !== null}
            onOpenChange={(open) => { if (!open) setSelectedChallengeIndex(null) }}
            onSubmit={handleFreeSubmit}
            isSolved={selectedChallengeIndex !== null ? solvedIds.has(challenges[selectedChallengeIndex].id) : false}
            onRevealHint={(idx) => {
              if (session && selectedChallengeIndex !== null) {
                recordHintReveal(session.session_token, challenges[selectedChallengeIndex].id, idx)
              }
            }}
          />

          <div className="text-center text-sm text-muted-foreground mt-4">
            <span>Komanda: </span>
            <span className="font-medium text-steam-dark">{session.team_name}</span>
            <span className="mx-2">&middot;</span>
            <button
              onClick={() => { clearPlayerSession(gameCode); router.replace(`/play/${gameCode}`) }}
              className="text-xs text-muted-foreground/60 hover:text-accent transition-colors inline-flex items-center gap-1"
            >
              <LogOut className="h-3 w-3" />
              Išeiti
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentChallenge = challenges[currentIndex]
  const progressValue = (solvedIds.size / challenges.length) * 100
  const challengeHints = (currentChallenge.hints as string[]) || []
  const isTimerCritical = timeLimitMinutes && remainingSeconds > 0 && remainingSeconds <= 60
  const isTimerWarning = timeLimitMinutes && remainingSeconds > 0 && remainingSeconds <= 300 // 5 min

  return (
    <div className="min-h-screen p-4 pb-8">
      <div className="max-w-lg mx-auto">
        {/* Announcement banner */}
        {gameId && <AnnouncementBanner gameId={gameId} />}

        {/* Achievement toast */}
        {pendingAchievement && (
          <AchievementToast
            achievement={pendingAchievement}
            onDismiss={dismissAchievement}
          />
        )}

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
            {/* Timer badge — outline > 5min, highlight ≤5min, destructive ≤60s (pulsing) */}
            {timeLimitMinutes && remainingSeconds > 0 && (
              <Badge
                variant={isTimerCritical ? "destructive" : isTimerWarning ? "default" : "outline"}
                className={`gap-1 font-mono text-xs tabular-nums ${
                  isTimerCritical ? "animate-pulse" : ""
                } ${isTimerWarning && !isTimerCritical ? "bg-highlight text-highlight-foreground" : ""}`}
                aria-live={isTimerCritical ? "assertive" : "off"}
              >
                <Clock className="h-3 w-3" />
                {formatTime(remainingSeconds)}
              </Badge>
            )}
            {showLeaderboard && (
              <Link href={`/play/${gameCode}/leaderboard`}>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Lentelė
                </Button>
              </Link>
            )}
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
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary-ink shrink-0">
                    {currentIndex + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold text-steam-dark leading-tight break-words">
                      {currentChallenge.title}
                    </h2>
                    <Badge variant="outline" className="text-xs mt-1">
                      {currentChallenge.points}{" "}
                      {pluralizeLt(currentChallenge.points, "taškas", "taškai", "taškų")}
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
                    <Image src={currentChallenge.image_url} alt={currentChallenge.title} width={800} height={256} className="w-full max-h-64 object-cover" unoptimized />
                  </div>
                )}

                {/* Google Maps */}
                {currentChallenge.maps_url && (
                  <div className="mb-4">
                    <MapsEmbed url={currentChallenge.maps_url} className="rounded-xl overflow-hidden" />
                  </div>
                )}

                {/* Progressive hints */}
                {challengeHints.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {revealedHintCount > 0 && (
                      <div className="space-y-1.5">
                        {challengeHints.slice(0, revealedHintCount).map((hint, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                          >
                            <div className="bg-highlight/5 border border-highlight/20 rounded-lg p-3 text-sm flex items-start gap-2">
                              <Lightbulb className="h-3.5 w-3.5 text-highlight shrink-0 mt-0.5" />
                              <p className="text-steam-dark">{hint}</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    {revealedHintCount < challengeHints.length && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const idx = revealedHintCount
                          setRevealedHintCount((prev) => prev + 1)
                          if (session) {
                            recordHintReveal(session.session_token, currentChallenge.id, idx)
                          }
                        }}
                        className="text-highlight hover:text-highlight/80 gap-1.5"
                      >
                        <Lightbulb className="h-3.5 w-3.5" />
                        {revealedHintCount === 0
                          ? "Reikia užuominos?"
                          : `Kita užuomina (${revealedHintCount}/${challengeHints.length})`}
                        {currentChallenge.hint_penalty > 0 && (
                          <span className="text-accent text-[10px]">
                            -{currentChallenge.hint_penalty} tšk.
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                {!feedback?.is_correct && (
                <form onSubmit={handleSubmit} className="space-y-3" aria-label="Atsakymo forma">
                  {currentChallenge.type === "multiple_choice" && currentChallenge.options ? (
                    <div className="space-y-2">
                      {(currentChallenge.options as string[]).map((option, i) => (
                        <Button
                          key={i}
                          type="button"
                          variant={answer === option ? "default" : "outline"}
                          className={`w-full justify-start items-start h-auto min-h-12 py-3 px-4 text-left whitespace-normal break-words ${
                            answer === option ? "bg-primary text-primary-foreground" : ""
                          }`}
                          onClick={() => setAnswer(option)}
                        >
                          <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold mr-3 shrink-0 mt-0.5">
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="flex-1 leading-relaxed">{option}</span>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <Input
                      type="text"
                      inputMode={currentChallenge.type === "number" ? "decimal" : "text"}
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
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 gap-2"
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
                          <p className={`font-medium ${feedback.is_correct ? "text-primary-ink" : "text-accent"}`}>
                            {feedback.message}
                          </p>
                          {feedback.is_correct && !showExplanation && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              Pereinama prie kitos užduoties...
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Explanation after correct answer */}
                      {showExplanation && currentExplanation && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <div className="p-4 rounded-lg bg-secondary/5 border border-secondary/20">
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="h-4 w-4 text-secondary" />
                              <p className="text-sm font-semibold text-secondary">
                                Ar žinojote?
                              </p>
                            </div>
                            <p className="text-sm text-steam-dark/80 leading-relaxed">
                              {currentExplanation}
                            </p>
                          </div>
                          <Button
                            onClick={() => {
                              setFeedback(null)
                              setShowExplanation(false)
                              setCurrentExplanation(null)
                              setRevealedHintCount(0)
                              if (currentIndex + 1 < challenges.length) {
                                setCurrentIndex(currentIndex + 1)
                              } else {
                                setGameFinished(true)
                              }
                            }}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                          >
                            Toliau
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      )}
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
          <span className="mx-2">&middot;</span>
          <button
            onClick={() => {
              clearPlayerSession(gameCode)
              router.replace(`/play/${gameCode}`)
            }}
            className="text-xs text-muted-foreground/60 hover:text-accent transition-colors inline-flex items-center gap-1"
          >
            <LogOut className="h-3 w-3" />
            Išeiti
          </button>
        </div>
      </div>
    </div>
  )
}
