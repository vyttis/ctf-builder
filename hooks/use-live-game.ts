"use client"

import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface LiveTeam {
  id: string
  name: string
  total_points: number
  current_challenge_index: number
  joined_at: string
}

export type LiveConnectionState = "connecting" | "live" | "degraded"

interface UseLiveGameResult {
  teams: LiveTeam[]
  // Unique correct solves per team (current_challenge_index only advances in
  // linear path mode, so free-mode counts must come from submissions)
  solvedCounts: Map<string, number>
  lastSubmissions: Map<string, string>
  connectionState: LiveConnectionState
  retry: () => void
}

// Shared realtime data layer for the teacher live views (dashboard control
// center and projector board): teams + solved counts + last activity, with
// realtime subscriptions and a polling fallback when the channel degrades.
export function useLiveGame(gameId: string): UseLiveGameResult {
  const [teams, setTeams] = useState<LiveTeam[]>([])
  const [solvedSets, setSolvedSets] = useState<Map<string, Set<string>>>(new Map())
  const [lastSubmissions, setLastSubmissions] = useState<Map<string, string>>(new Map())
  const [connectionState, setConnectionState] = useState<LiveConnectionState>("connecting")
  const [retryNonce, setRetryNonce] = useState(0)

  const retry = useCallback(() => setRetryNonce((n) => n + 1), [])

  const fetchInitialData = useCallback(async () => {
    const supabase = createClient()

    const { data: teamsData, error } = await supabase
      .from("teams")
      .select("id, name, total_points, current_challenge_index, joined_at")
      .eq("game_id", gameId)
      .order("total_points", { ascending: false })

    if (error) throw error
    if (!teamsData) return

    setTeams(teamsData)

    const teamIds = teamsData.map((t) => t.id)
    if (teamIds.length === 0) return

    const { data: subs } = await supabase
      .from("submissions")
      .select("id, team_id, challenge_id, is_correct, attempted_at")
      .in("team_id", teamIds)
      .order("attempted_at", { ascending: false })

    if (subs) {
      const latestMap = new Map<string, string>()
      const solvedMap = new Map<string, Set<string>>()
      for (const sub of subs) {
        if (!latestMap.has(sub.team_id)) {
          latestMap.set(sub.team_id, sub.attempted_at)
        }
        if (sub.is_correct) {
          if (!solvedMap.has(sub.team_id)) solvedMap.set(sub.team_id, new Set())
          solvedMap.get(sub.team_id)!.add(sub.challenge_id)
        }
      }
      setLastSubmissions(latestMap)
      setSolvedSets(solvedMap)
    }
  }, [gameId])

  useEffect(() => {
    const supabase = createClient()
    let pollInterval: NodeJS.Timeout | null = null
    let cancelled = false

    function startPolling() {
      if (pollInterval) return
      pollInterval = setInterval(() => {
        fetchInitialData().catch(() => {})
      }, 30000)
    }

    function stopPolling() {
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
    }

    fetchInitialData()
      .then(() => {
        if (!cancelled) setConnectionState((s) => (s === "connecting" ? "live" : s))
      })
      .catch(() => {
        if (!cancelled) {
          setConnectionState("degraded")
          startPolling()
        }
      })

    const handleChannelStatus = (status: string) => {
      if (cancelled) return
      if (status === "SUBSCRIBED") {
        setConnectionState("live")
        stopPolling()
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setConnectionState("degraded")
        startPolling()
      }
    }

    const teamChannel = supabase
      .channel(`live_game_teams_${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTeam = payload.new as LiveTeam
            setTeams((prev) =>
              [...prev.filter((t) => t.id !== newTeam.id), newTeam].sort(
                (a, b) => b.total_points - a.total_points
              )
            )
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as LiveTeam
            setTeams((prev) =>
              prev
                .map((t) => (t.id === updated.id ? updated : t))
                .sort((a, b) => b.total_points - a.total_points)
            )
          } else if (payload.eventType === "DELETE") {
            const old = payload.old as { id: string }
            setTeams((prev) => prev.filter((t) => t.id !== old.id))
          }
        }
      )
      .subscribe(handleChannelStatus)

    const submissionChannel = supabase
      .channel(`live_game_subs_${gameId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        async (payload) => {
          const sub = payload.new as {
            team_id: string
            challenge_id: string
            is_correct: boolean
            attempted_at: string
          }

          // The submissions table has no game_id — verify membership
          const { data: team } = await supabase
            .from("teams")
            .select("game_id")
            .eq("id", sub.team_id)
            .single()

          if (team?.game_id !== gameId) return

          setLastSubmissions((prev) => {
            const next = new Map(prev)
            next.set(sub.team_id, sub.attempted_at)
            return next
          })

          if (sub.is_correct) {
            setSolvedSets((prev) => {
              const next = new Map(prev)
              const solved = new Set(next.get(sub.team_id) ?? [])
              solved.add(sub.challenge_id)
              next.set(sub.team_id, solved)
              return next
            })
          }
        }
      )
      .subscribe(handleChannelStatus)

    return () => {
      cancelled = true
      supabase.removeChannel(teamChannel)
      supabase.removeChannel(submissionChannel)
      stopPolling()
    }
  }, [gameId, fetchInitialData, retryNonce])

  const solvedCounts = new Map<string, number>()
  solvedSets.forEach((set, teamId) => solvedCounts.set(teamId, set.size))

  return { teams, solvedCounts, lastSubmissions, connectionState, retry }
}
