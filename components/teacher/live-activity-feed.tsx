"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion, AnimatePresence } from "framer-motion"
import {
  Activity,
  CheckCircle2,
  XCircle,
  UserPlus,
  Zap,
} from "lucide-react"

interface ActivityEvent {
  id: string
  type: "submission_correct" | "submission_wrong" | "team_joined"
  team_name: string
  challenge_title?: string
  points?: number
  timestamp: string
}

interface LiveActivityFeedProps {
  gameId: string
}

export function LiveActivityFeed({ gameId }: LiveActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [teamCount, setTeamCount] = useState(0)
  const maxEvents = 50
  const initialLoadDone = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    // Load recent activity on mount
    async function loadRecent() {
      // Get team count
      const { count } = await supabase
        .from("teams")
        .select("*", { count: "exact", head: true })
        .eq("game_id", gameId)

      setTeamCount(count || 0)

      // Get teams for this game, then fetch their submissions
      const { data: teams } = await supabase
        .from("teams")
        .select("id, name")
        .eq("game_id", gameId)

      if (!teams || teams.length === 0) {
        initialLoadDone.current = true
        return
      }

      const teamMap = new Map(teams.map(t => [t.id, t.name]))
      const teamIds = teams.map(t => t.id)

      const { data: subs } = await supabase
        .from("submissions")
        .select("id, team_id, challenge_id, is_correct, points_awarded, attempted_at")
        .in("team_id", teamIds)
        .order("attempted_at", { ascending: false })
        .limit(15)

      const { data: challenges } = await supabase
        .from("challenges")
        .select("id, title")
        .eq("game_id", gameId)

      const challengeMap = new Map((challenges || []).map(c => [c.id, c.title]))

      if (subs) {
        const recentEvents: ActivityEvent[] = subs.map(s => ({
          id: s.id,
          type: s.is_correct ? "submission_correct" : "submission_wrong",
          team_name: teamMap.get(s.team_id) || "—",
          challenge_title: challengeMap.get(s.challenge_id) || "—",
          points: s.points_awarded,
          timestamp: s.attempted_at,
        }))
        setEvents(recentEvents)
      }

      initialLoadDone.current = true
    }

    loadRecent()

    // Subscribe to new submissions
    const submissionChannel = supabase
      .channel(`activity_submissions_${gameId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        async (payload) => {
          const sub = payload.new as {
            id: string
            team_id: string
            challenge_id: string
            is_correct: boolean
            points_awarded: number
            attempted_at: string
          }

          // Fetch team name
          const { data: team } = await supabase
            .from("teams")
            .select("name, game_id")
            .eq("id", sub.team_id)
            .single()

          if (!team || team.game_id !== gameId) return

          // Fetch challenge title
          const { data: challenge } = await supabase
            .from("challenges")
            .select("title")
            .eq("id", sub.challenge_id)
            .single()

          const event: ActivityEvent = {
            id: sub.id,
            type: sub.is_correct ? "submission_correct" : "submission_wrong",
            team_name: team.name,
            challenge_title: challenge?.title || "—",
            points: sub.points_awarded,
            timestamp: sub.attempted_at,
          }

          setEvents(prev => [event, ...prev].slice(0, maxEvents))
        }
      )
      .subscribe()

    // Subscribe to new team joins
    const teamChannel = supabase
      .channel(`activity_teams_${gameId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "teams", filter: `game_id=eq.${gameId}` },
        (payload) => {
          const team = payload.new as { id: string; name: string; joined_at: string }

          const event: ActivityEvent = {
            id: `join_${team.id}`,
            type: "team_joined",
            team_name: team.name,
            timestamp: team.joined_at,
          }

          setEvents(prev => [event, ...prev].slice(0, maxEvents))
          setTeamCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(submissionChannel)
      supabase.removeChannel(teamChannel)
    }
  }, [gameId])

  function formatTimestamp(ts: string) {
    const date = new Date(ts)
    return date.toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  function getIcon(type: ActivityEvent["type"]) {
    switch (type) {
      case "submission_correct":
        return <CheckCircle2 className="h-4 w-4 text-primary" />
      case "submission_wrong":
        return <XCircle className="h-4 w-4 text-accent" />
      case "team_joined":
        return <UserPlus className="h-4 w-4 text-secondary" />
    }
  }

  function getMessage(event: ActivityEvent) {
    switch (event.type) {
      case "submission_correct":
        return (
          <>
            <span className="font-medium text-steam-dark">{event.team_name}</span>
            {" "}išsprendė{" "}
            <span className="font-medium">{event.challenge_title}</span>
            {event.points ? (
              <Badge variant="outline" className="ml-1.5 text-[10px] py-0 px-1.5 text-primary border-primary/30">
                +{event.points} tšk.
              </Badge>
            ) : null}
          </>
        )
      case "submission_wrong":
        return (
          <>
            <span className="font-medium text-steam-dark">{event.team_name}</span>
            {" "}neteisingai atsakė į{" "}
            <span className="font-medium">{event.challenge_title}</span>
          </>
        )
      case "team_joined":
        return (
          <>
            <span className="font-medium text-steam-dark">{event.team_name}</span>
            {" "}prisijungė prie žaidimo
          </>
        )
    }
  }

  return (
    <Card className="border-border/50 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Gyva veikla
          </span>
          <Badge variant="secondary" className="gap-1 text-xs font-normal">
            <Zap className="h-3 w-3" />
            {teamCount} komandų
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>Laukiama veiklos...</p>
            <p className="text-xs mt-1">Čia matysite komandų veiksmus realiu laiku</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            <AnimatePresence initial={false}>
              {events.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2.5 py-2 px-2 rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="mt-0.5 shrink-0">{getIcon(event.type)}</div>
                  <div className="flex-1 min-w-0 text-sm text-muted-foreground leading-snug">
                    {getMessage(event)}
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 tabular-nums mt-0.5">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
