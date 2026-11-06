"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send,
  Loader2,
  Trophy,
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
import { getPlayerSession, clearPlayerSession, savePlayerSession } from "@/lib/game/session"
import { AnswerInput } from "@/components/player/answer-input"
import { type GameClock, secondsLeft } from "@/lib/game/clock"
import { remapTaskIndex } from "@/lib/game/tasks-version"
import { pluralizeLt } from "@/lib/utils"
import { MapsEmbed } from "@/components/shared/maps-embed"
import { ReflectionForm } from "@/components/player/reflection-form"
import { FinishRequestCard } from "@/components/access/finish-request-card"
import { AnnouncementBanner } from "@/components/player/announcement-banner"
import { AchievementToast } from "@/components/player/achievement-toast"
import { ChallengeGrid } from "@/components/player/challenge-grid"
import { ChallengeDetailModal } from "@/components/player/challenge-detail-modal"
import { HintList } from "@/components/player/hint-list"
import Link from "next/link"
import Image from "next/image"
import { TimerAnnouncer } from "@/components/player/timer-announcer"
import { LeaveTeamButton } from "@/components/player/leave-team-button"

interface PlayerChallenge {
  id: string
  title: string
  description: string | null
  type: ChallengeType
  points: number
  // null: a hint the team has not opened yet (its text comes from /api/play/hint)
  hints: (string | null)[]
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

function openedHintCount(challenge: { hints?: (string | null)[] } | undefined): number {
  return (challenge?.hints ?? []).filter((hint) => hint !== null).length
}

// The free-mode sheet starts clean for another task, and when the open task
// changes what an answer looks like (type or choices).
function sheetKey(challenge: { id: string; type: string; options: string[] | null } | undefined): string {
  return challenge ? `${challenge.id}:${challenge.type}:${JSON.stringify(challenge.options)}` : "none"
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

// Stamp the team's server-side start (idempotent) and return it with the
// pause offset, so the countdown runs on the same deadline the server
// enforces. null when the request fails; the page keeps asking (see the
// effect that confirms the run).
async function stampGameStart(token: string): Promise<{ startedAtMs: number; offsetMs: number } | null> {
  try {
    const res = await fetch("/api/play/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_token: token }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { started_at?: string | null; pause_offset_ms?: number }
    if (!data.started_at) return null
    return { startedAtMs: Date.parse(data.started_at), offsetMs: Number(data.pause_offset_ms ?? 0) }
  } catch {
    return null
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
  // Marker of the tasks on screen (lib/game/tasks-version.ts): when the
  // status poll reports another one, the facilitator changed a task and the
  // tasks reload in place.
  const tasksVersionRef = useRef<string | null>(null)
  const challengesRef = useRef<PlayerChallenge[]>([])
  const reloadingTasksRef = useRef(false)
  // Latest solved tasks and open task, read by timers and the reload.
  const solvedIdsRef = useRef<Set<string>>(new Set())
  const currentIndexRef = useRef(0)
  const showExplanationRef = useRef(false)
  // The first load finished: only then may a poll start a reload.
  const tasksLoadedRef = useRef(false)
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

  useEffect(() => {
    challengesRef.current = challenges
    solvedIdsRef.current = solvedIds
    currentIndexRef.current = currentIndex
    showExplanationRef.current = showExplanation
  }, [challenges, solvedIds, currentIndex, showExplanation])

  // Check if reflection already done
  useEffect(() => {
    const stored = localStorage.getItem(`ctf_reflection_${gameCode}`)
    if (stored) setReflectionDone(true)
  }, [gameCode])

  // Timer state. The clock follows lib/game/clock.ts: pauses stop it, and
  // the deadline is the server's (team start + limit + pause time inside
  // the run), corrected for this device's clock.
  const [clock, setClock] = useState<GameClock>({ limitMinutes: null, pausedMs: 0, pausedAt: null })
  const timeLimitMinutes = clock.limitMinutes
  // confirmed: the start and pause offset came from the server. Until then
  // the countdown runs from this device's start and keeps asking.
  const [run, setRun] = useState<{ startedAtMs: number; offsetMs: number; confirmed: boolean } | null>(null)
  const skewMsRef = useRef(0)
  const [gameStarted, setGameStarted] = useState(false)
  // A timed activity sends its tasks only after the server has the team's
  // start; until then the team knows how many there are.
  const [awaitingStart, setAwaitingStart] = useState(false)
  const [taskCount, setTaskCount] = useState(0)
  const [timeExpired, setTimeExpired] = useState(false)
  const [allowAccessRequests, setAllowAccessRequests] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  const applyClock = useCallback(
    (data: { time_limit_minutes?: number | null; paused_ms?: number | string | null; paused_at?: string | null }) => {
      setClock((c) => ({
        limitMinutes:
          data.time_limit_minutes === undefined
            ? c.limitMinutes
            : typeof data.time_limit_minutes === "number" && data.time_limit_minutes > 0
              ? data.time_limit_minutes
              : null,
        pausedMs: data.paused_ms === undefined || data.paused_ms === null ? c.pausedMs : Number(data.paused_ms) || 0,
        pausedAt: data.paused_at === undefined ? c.pausedAt : data.paused_at,
      }))
    },
    []
  )

  // Timer tick. Keeps running after the time is up, so an extension made
  // while this phone slept brings the team back in.
  useEffect(() => {
    if (!gameStarted || !timeLimitMinutes || !run || gameFinished) return

    function tick() {
      const left = secondsLeft(clock, run!.startedAtMs, run!.offsetMs, Date.now() + skewMsRef.current) ?? 0
      setRemainingSeconds(left)
      setTimeExpired(left <= 0)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [gameStarted, timeLimitMinutes, run, clock, gameFinished])

  // Anchor the countdown on the server's start and pause offset. A failed
  // request is retried every few seconds; otherwise a late team that
  // reloaded could keep a countdown that credits pauses from before its
  // start, while the server rejects its answers.
  const sessionToken = session?.session_token
  const runConfirmed = run?.confirmed ?? true
  useEffect(() => {
    if (runConfirmed || !sessionToken || gameFinished) return
    let cancelled = false
    let inFlight = false
    const confirm = async () => {
      if (inFlight) return
      inFlight = true
      const server = await stampGameStart(sessionToken)
      inFlight = false
      if (!cancelled && server) setRun({ ...server, confirmed: true })
    }
    void confirm()
    const interval = setInterval(confirm, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [runConfirmed, sessionToken, gameFinished])

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

  // The tasks of a timed activity come once the server has the team's start.
  useEffect(() => {
    if (!awaitingStart || !run?.confirmed || !session) return
    void loadChallenges(session)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaitingStart, run?.confirmed, session])

  // On the ready screen, another device of the team may press "Pradėti":
  // ask every few seconds, and join its clock as soon as it started.
  useEffect(() => {
    if (!awaitingStart || gameStarted || !session) return
    let busy = false
    const poll = async () => {
      if (busy || document.visibilityState !== "visible") return
      busy = true
      try {
        const res = await fetch(`/api/play/state?game_code=${encodeURIComponent(gameCode)}`, {
          headers: { "x-session-token": session.session_token },
          cache: "no-store",
        })
        if (!res.ok) return
        const state = (await res.json()) as { team_started_at?: string | null; challenge_count?: number }
        if (typeof state.challenge_count === "number") setTaskCount(state.challenge_count)
        if (state.team_started_at) void loadChallenges(session)
      } catch {
        // Network hiccup: the next round retries.
      } finally {
        busy = false
      }
    }
    const interval = setInterval(poll, 5000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awaitingStart, gameStarted, session, gameCode])

  async function loadChallenges(s: PlayerSession) {
    // Single round-trip via /api/play/state (game + challenges + solved submissions)
    setLoadError(false)
    let state: {
      game: { id: string; status?: string; settings: GameSettings | null } | null
      challenges: PlayerChallenge[]
      team: { id: string; name: string } | null
      solved: { challenge_id: string; points_awarded: number }[]
      tasks_version?: string | null
      challenge_count?: number
      awaiting_start?: boolean
      team_started_at?: string | null
      team_pause_offset_ms?: number
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

    // The facilitator may have renamed the team: show the current name.
    if (state.team && state.team.name && state.team.name !== s.team_name) {
      const renamed = { ...s, team_name: state.team.name }
      setSession(renamed)
      try {
        savePlayerSession(gameCode, renamed)
      } catch {
        // Storage blocked: the name still shows for this visit.
      }
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
    applyClock({ time_limit_minutes: timeLimit })
    setPathMode(settings?.challenge_path_mode || "linear")
    setShowLeaderboard(settings?.show_leaderboard !== false)
    setAllowAccessRequests(settings?.allow_access_requests === true)

    const storageKey = `ctf_start_${gameCode}`
    let existingStart: string | null = null
    try {
      existingStart = localStorage.getItem(storageKey)
    } catch {
      // Storage blocked: the server start below still applies.
    }
    if (!timeLimit || existingStart) {
      setGameStarted(true)
      if (timeLimit && existingStart) {
        // Already started on this device: run from the local start until the
        // server answers with the real one (idempotent stamp).
        setRun((r) => r ?? { startedAtMs: parseInt(existingStart!, 10), offsetMs: 0, confirmed: false })
      }
    }
    const serverStart = state.team_started_at ? Date.parse(state.team_started_at) : NaN
    if (timeLimit && Number.isFinite(serverStart)) {
      // The team already started, here or on another device (a rejoin link):
      // its clock runs from the server's start, no "Pradėti" again.
      setGameStarted(true)
      setRun({ startedAtMs: serverStart, offsetMs: state.team_pause_offset_ms ?? 0, confirmed: true })
      try {
        localStorage.setItem(storageKey, String(serverStart))
      } catch {
        // Storage blocked: the server start still applies.
      }
    }
    setAwaitingStart(state.awaiting_start === true)
    setTaskCount(state.challenge_count ?? state.challenges.length)

    setChallenges(state.challenges)
    challengesRef.current = state.challenges
    tasksVersionRef.current = state.tasks_version ?? null

    const solved = new Set(state.solved.map((sub) => sub.challenge_id))
    setSolvedIds(solved)
    solvedIdsRef.current = solved
    const points = state.solved.reduce((sum, sub) => sum + sub.points_awarded, 0)
    setTotalPoints(points)

    const firstUnsolved = state.challenges.findIndex((c) => !solved.has(c.id))
    setCurrentIndex(firstUnsolved >= 0 ? firstUnsolved : state.challenges.length)
    if (state.challenges.length > 0 && firstUnsolved < 0) setGameFinished(true)
    setStateLoaded(true)
    tasksLoadedRef.current = true
  }

  // Open a hint: the server records it (the penalty counts from that row) and
  // returns its text, which stays with the task until the page is closed and
  // comes back with the play state after a reload.
  const revealHint = useCallback(
    async (challengeId: string, index: number): Promise<boolean> => {
      const s = getPlayerSession(gameCode)
      if (!s) return false
      try {
        const res = await fetch("/api/play/hint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_token: s.session_token, challenge_id: challengeId, hint_index: index }),
        })
        if (!res.ok) return false
        const data = (await res.json()) as { hint?: unknown }
        if (typeof data.hint !== "string") return false
        const text = data.hint
        setChallenges((prev) =>
          prev.map((c) => (c.id === challengeId ? { ...c, hints: c.hints.map((h, i) => (i === index ? text : h)) } : c))
        )
        return true
      } catch {
        return false
      }
    },
    [gameCode]
  )

  // Reload the tasks after the facilitator changed one. Only the tasks are
  // replaced: answers already counted, the timer and the team stay. The open
  // task stays open (found by its id); if it was removed, the team goes to
  // its first unsolved task with an empty answer. A task added after the
  // team finished brings it back to the tasks.
  const reloadTasks = useCallback(async (polledVersion: string) => {
    const s = getPlayerSession(gameCode)
    if (!s || reloadingTasksRef.current) return
    reloadingTasksRef.current = true
    try {
      const res = await fetch(`/api/play/state?game_code=${encodeURIComponent(gameCode)}`, {
        headers: { "x-session-token": s.session_token },
        cache: "no-store",
      })
      if (!res.ok) return
      const state = (await res.json()) as {
        challenges?: PlayerChallenge[]
        solved?: { challenge_id: string; points_awarded?: number }[]
        team?: { total_points?: number } | null
        tasks_version?: string | null
        awaiting_start?: boolean
        challenge_count?: number
      }
      if (typeof state.challenge_count === "number") setTaskCount(state.challenge_count)
      // Tasks held back until the team's start (on the ready screen, or a
      // limit set while the team was already working): keep what it has;
      // its first answer starts the clock on the server.
      if (!Array.isArray(state.challenges) || state.awaiting_start) return
      // Without a marker in the answer (its read failed), keep the polled
      // one: the tasks are now at least that new, and change detection goes on.
      tasksVersionRef.current = state.tasks_version ?? polledVersion
      const prev = challengesRef.current
      const next = state.challenges
      if (JSON.stringify(prev) === JSON.stringify(next)) return

      // Solved: what the server counted plus what this page solved meanwhile,
      // only for tasks that still exist.
      const ids = new Set(next.map((c) => c.id))
      const solved = new Set<string>()
      for (const sub of state.solved ?? []) if (ids.has(sub.challenge_id)) solved.add(sub.challenge_id)
      solvedIdsRef.current.forEach((id) => {
        if (ids.has(id)) solved.add(id)
      })
      const firstUnsolved = next.findIndex((c) => !solved.has(c.id))
      const kept = remapTaskIndex(prev, next, currentIndexRef.current)

      challengesRef.current = next
      solvedIdsRef.current = solved
      setChallenges(next)
      setSolvedIds(solved)
      // Answers counted elsewhere (the same team on another device) bring
      // their points; the score never goes down here, so an answer this page
      // is still sending keeps its points too.
      const serverPoints =
        typeof state.team?.total_points === "number"
          ? state.team.total_points
          : (state.solved ?? []).reduce((sum, sub) => sum + (sub.points_awarded ?? 0), 0)
      setTotalPoints((points) => Math.max(points, serverPoints))
      // The open task changed what an answer looks like (type or choices):
      // a typed or selected answer no longer fits, so it is cleared.
      const before = prev[currentIndexRef.current]
      const after = kept !== null ? next[kept] : undefined
      const shapeChanged =
        before !== undefined &&
        after !== undefined &&
        (before.type !== after.type || JSON.stringify(before.options) !== JSON.stringify(after.options))
      // The open task was solved elsewhere (the same team on another device)
      // and nothing here is showing its result: move on like after a solve.
      const keptSolvedElsewhere =
        kept !== null && solved.has(next[kept].id) && !showExplanationRef.current && firstUnsolved >= 0
      if (kept !== null && !keptSolvedElsewhere) {
        setCurrentIndex(kept)
        currentIndexRef.current = kept
        if (shapeChanged) {
          setAnswer("")
          setFeedback(null)
        }
      } else {
        const index = firstUnsolved >= 0 ? firstUnsolved : next.length
        setCurrentIndex(index)
        currentIndexRef.current = index
        setAnswer("")
        setFeedback(null)
        setShowExplanation(false)
        setCurrentExplanation(null)
      }
      setSelectedChallengeIndex((i) => remapTaskIndex(prev, next, i))
      // Every task solved (perhaps on another device, or an answer whose
      // reply was lost): finish, unless the team is reading an explanation,
      // whose "Toliau" finishes it.
      if (firstUnsolved >= 0) setGameFinished(false)
      else if (next.length > 0 && (kept === null || !showExplanationRef.current)) setGameFinished(true)
      toast({ title: "Vedėjas atnaujino užduotis", description: "Matote naujausią jų versiją." })
    } catch {
      // The next poll that still sees a new marker tries again.
    } finally {
      reloadingTasksRef.current = false
    }
  }, [gameCode, toast])

  // Linear mode moves on to the first task not solved yet, so a task added
  // during the activity is reached wherever it sits in the list.
  const goToNextTask = useCallback(() => {
    const list = challengesRef.current
    const next = list.findIndex((c) => !solvedIdsRef.current.has(c.id))
    if (next >= 0) {
      setCurrentIndex(next)
    } else {
      setCurrentIndex(list.length)
      setGameFinished(true)
    }
  }, [])

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
          const updated = payload.new as {
            settings?: GameSettings
            status?: string
            paused_ms?: number | string | null
            paused_at?: string | null
          }
          applyClock({
            time_limit_minutes: updated.settings ? (updated.settings.time_limit_minutes ?? null) : undefined,
            paused_ms: updated.paused_ms,
            paused_at: updated.paused_at,
          })
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
  }, [gameId, gameCode, applyClock])

  // Status polling safety net: paused games may be invisible to anon realtime
  // (RLS), so realtime alone cannot be trusted to deliver pause events.
  // 5 s keeps a teacher's pause visible to participants almost at once;
  // the request is a tiny status read, and it also re-runs when the tab
  // becomes visible again (phones suspend timers in the background).
  useEffect(() => {
    // A team that solved everything keeps polling, so a task added later
    // reaches it; once the facilitator ends the activity, polling stops.
    if (endedByTeacher) return

    // One request at a time: overlapping polls could finish out of order and
    // an older "active" would hide the pause overlay. A hung request is cut
    // off so it cannot block the next polls.
    let inFlight = false
    let disposed = false
    const checkStatus = async () => {
      if (inFlight) return
      inFlight = true
      const startedAt = statusVersionRef.current
      const sentAt = Date.now()
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
        const data = (await res.json()) as {
          status: string | null
          allow_access_requests?: boolean
          time_limit_minutes?: number | null
          paused_ms?: number
          paused_at?: string | null
          now?: string
          tasks_version?: string | null
        }
        if (disposed || !data.status) return
        // Clock correction: the server's time is compared with the middle of
        // the round trip, and only from a quick one, so network delay or a
        // suspended tab is not mistaken for this device's clock being off.
        const receivedAt = Date.now()
        const serverNow = data.now ? Date.parse(data.now) : NaN
        if (Number.isFinite(serverNow) && receivedAt - sentAt < 2000) {
          skewMsRef.current = serverNow - (sentAt + receivedAt) / 2
        }
        if (statusVersionRef.current !== startedAt) return
        applyClock(data)
        setGameStatus(data.status)
        if (typeof data.allow_access_requests === "boolean") setAllowAccessRequests(data.allow_access_requests)
        if (data.status === "finished") {
          setEndedByTeacher(true)
          setGameFinished(true)
        } else if (
          data.tasks_version &&
          tasksLoadedRef.current &&
          data.tasks_version !== tasksVersionRef.current
        ) {
          // Also when the page has no marker yet (its read failed): the
          // reload brings the tasks and the marker.
          void reloadTasks(data.tasks_version)
        }
      } catch {
        // Network hiccup or timeout: the next poll retries
      } finally {
        inFlight = false
      }
    }

    void checkStatus()
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
  }, [gameCode, endedByTeacher, applyClock, reloadTasks])

  function handleStart() {
    const storageKey = `ctf_start_${gameCode}`
    const now = Date.now()
    try {
      localStorage.setItem(storageKey, now.toString())
    } catch {
      // Storage blocked: the server start still anchors the deadline.
    }
    // The server-side start is stamped by the effect that confirms the run.
    setRun({ startedAtMs: now + skewMsRef.current, offsetMs: clock.pausedMs, confirmed: false })
    setGameStarted(true)
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
        // Check if all solved (tasks as they are now, this one included)
        const solvedNow = new Set(solvedIdsRef.current)
        solvedNow.add(challenge.id)
        if (challengesRef.current.every((c) => solvedNow.has(c.id))) {
          setTimeout(() => {
            // A task added in these two seconds keeps the team playing.
            if (!challengesRef.current.every((c) => solvedIdsRef.current.has(c.id))) return
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
    // Close the phone keyboard so the result below the button is visible.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    if (!answer.trim() || !session || !challenges[currentIndex] || timeExpired) return

    setLoading(true)
    setFeedback(null)
    const task = challenges[currentIndex]

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_token: session.session_token,
          challenge_id: task.id,
          answer:
            task.type === "number"
              ? normalizeNumericAnswer(answer)
              : answer.trim(),
          hints_used: openedHintCount(challenges[currentIndex]),
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

      // A reload may have replaced the open task while the answer was on its
      // way: the points still count, but the result belongs to that task,
      // not to the one now on screen.
      if (challengesRef.current[currentIndexRef.current]?.id !== task.id) {
        if (result.is_correct) {
          setTotalPoints((points) => Math.max(points, result.total_points ?? points + result.points_awarded))
          if (challengesRef.current.some((c) => c.id === task.id)) {
            setSolvedIds((prev) => new Set(prev).add(task.id))
          }
        }
        return
      }
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
          next.add(task.id)
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
            goToNextTask()
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
            <AlertTriangle className="h-8 w-8 text-accent-ink" />
          </div>
          <h1 className="text-xl font-bold text-steam-dark mb-2">
            Nepavyko įkelti veiklos
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            Patikrinkite interneto ryšį arba paklauskite vedėjo, ar veikla
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
        <Loader2 className="h-8 w-8 animate-spin text-primary-ink" />
      </div>
    )
  }

  // "Pradėti" pressed, the tasks are on their way (they follow the server's
  // start; the page keeps asking until it has it).
  if (awaitingStart && gameStarted && gameStatus !== "draft") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-4" role="status">
        <Loader2 className="h-8 w-8 animate-spin text-primary-ink" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Ruošiamos užduotys...</p>
      </div>
    )
  }

  // The game was reverted to draft, or has no challenges (e.g. the teacher
  // deleted them mid-game) — an explicit message instead of a forever-spinner.
  if (gameStatus === "draft" || (challenges.length === 0 && !gameFinished && !awaitingStart)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-highlight/10 flex items-center justify-center">
            <Clock className="h-8 w-8 text-highlight-ink" />
          </div>
          <h1 className="text-xl font-bold text-steam-dark mb-2">
            {gameStatus === "draft"
              ? "Veikla dar neprasidėjo"
              : "Veikloje dar nėra užduočių"}
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            {gameStatus === "draft"
              ? "Palaukite, kol vedėjas pradės veiklą, ir bandykite dar kartą."
              : "Paklauskite vedėjo, ar veikla paruošta, ir bandykite dar kartą."}
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
          {/* An announcement sent during the pause reaches the team here too. */}
          {gameId && <AnnouncementBanner gameId={gameId} />}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
            <Clock className="h-10 w-10 text-highlight" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Veikla pristabdyta</h1>
          <p className="text-white/70 mb-6">
            Palaukite, kol vedėjas tęs veiklą. Jūsų taškai išsaugoti.
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
            <AlertTriangle className="h-10 w-10 text-accent-ink" />
          </div>
          <h1 className="text-2xl font-bold text-steam-dark mb-2">
            Laikas baigėsi!
          </h1>
          <p className="text-muted-foreground mb-6">
            Veiklai skirtas laikas baigėsi. Jūsų rezultatai buvo išsaugoti.
          </p>

          <div className="bg-primary/5 rounded-2xl p-6 mb-6">
            <Trophy className="h-8 w-8 text-highlight-ink mx-auto mb-2" />
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
            <Clock className="h-10 w-10 text-primary-ink" />
          </div>

          <h1 className="text-2xl font-bold text-steam-dark mb-2">
            Pasiruošę?
          </h1>
          <p className="text-muted-foreground mb-2">
            Ši veikla turi laiko limitą.
          </p>

          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6">
            <p className="text-lg font-bold text-steam-dark">
              {timeLimitMinutes} min.
            </p>
            <p className="text-sm text-muted-foreground">
              Paspaudus „Pradėti“, laikas pradės skaičiuotis atgal.
            </p>
          </div>

          <div className="space-y-3 text-left mb-6 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary-ink font-bold mt-0.5">•</span>
              <span>Užduočių skaičius: <strong className="text-steam-dark">{taskCount}</strong></span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary-ink font-bold mt-0.5">•</span>
              <span>Pasibaigus laikui, atsakymai nebebus priimami</span>
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
            Pradėti
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
              ? "Veikla baigta!"
              : "Sveikiname! 🎉"}
          </h1>
          <p className="text-muted-foreground mb-4">
            {endedByTeacher && solvedIds.size < challenges.length
              ? `Vedėjas užbaigė veiklą. Išsprendėte ${solvedIds.size} iš ${challenges.length} užduočių.`
              : "Jūs išsprendėte visas užduotis!"}
          </p>

          <div className="bg-primary/5 rounded-2xl p-6 mb-6">
            <Trophy className="h-8 w-8 text-highlight-ink mx-auto mb-2" />
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
                <Star className="h-3 w-3 text-highlight-ink" />
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
                  aria-label={`Liko laiko ${formatTime(remainingSeconds)}`}
                >
                  <Clock className="h-3 w-3" aria-hidden="true" />
                  {formatTime(remainingSeconds)}
                </Badge>
              )}
              {timeLimitMinutes && <TimerAnnouncer seconds={remainingSeconds} />}
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
            key={sheetKey(selectedChallengeIndex !== null ? challenges[selectedChallengeIndex] : undefined)}
            challenge={selectedChallengeIndex !== null ? challenges[selectedChallengeIndex] : null}
            open={selectedChallengeIndex !== null}
            onOpenChange={(open) => { if (!open) setSelectedChallengeIndex(null) }}
            onSubmit={handleFreeSubmit}
            isSolved={selectedChallengeIndex !== null ? solvedIds.has(challenges[selectedChallengeIndex].id) : false}
            onRevealHint={(idx) =>
              selectedChallengeIndex !== null
                ? revealHint(challenges[selectedChallengeIndex].id, idx)
                : Promise.resolve(false)
            }
          />

          <div className="text-center text-sm text-muted-foreground mt-4">
            <span>Komanda: </span>
            <span className="font-medium text-steam-dark">{session.team_name}</span>
            <span className="mx-2">&middot;</span>
            <LeaveTeamButton onLeave={() => { clearPlayerSession(gameCode); router.replace(`/play/${gameCode}`) }} />
          </div>
        </div>
      </div>
    )
  }

  const currentChallenge = challenges[currentIndex]
  const progressValue = (solvedIds.size / challenges.length) * 100
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
              <Star className="h-3 w-3 text-highlight-ink" />
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
                aria-label={`Liko laiko ${formatTime(remainingSeconds)}`}
              >
                <Clock className="h-3 w-3" aria-hidden="true" />
                {formatTime(remainingSeconds)}
              </Badge>
            )}
            {timeLimitMinutes && <TimerAnnouncer seconds={remainingSeconds} />}
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

                {/* Hints: the text arrives when the team opens one */}
                <HintList
                  key={currentChallenge.id}
                  hints={currentChallenge.hints ?? []}
                  penalty={currentChallenge.hint_penalty}
                  points={currentChallenge.points}
                  onReveal={(index) => revealHint(currentChallenge.id, index)}
                />

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
                    <AnswerInput type={currentChallenge.type} value={answer} onChange={setAnswer} />
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
                          <CheckCircle2 className="h-6 w-6 text-primary-ink shrink-0" />
                        ) : (
                          <XCircle className="h-6 w-6 text-accent-ink shrink-0" />
                        )}
                        <div>
                          <p className={`font-medium ${feedback.is_correct ? "text-primary-ink" : "text-accent-ink"}`}>
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
                              <BookOpen className="h-4 w-4 text-secondary-ink" />
                              <p className="text-sm font-semibold text-secondary-ink">
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
                              goToNextTask()
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
          <LeaveTeamButton
            onLeave={() => {
              clearPlayerSession(gameCode)
              router.replace(`/play/${gameCode}`)
            }}
          />
        </div>
      </div>
    </div>
  )
}
