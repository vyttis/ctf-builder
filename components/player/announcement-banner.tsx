"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { motion, AnimatePresence } from "framer-motion"
import { Megaphone, X } from "lucide-react"

interface AnnouncementItem {
  id: string
  message: string
  created_at: string
}

interface AnnouncementBannerProps {
  gameId: string
}

const AUTO_DISMISS_MS = 15000
// On mount, show the latest announcement if it's still fresh — students who
// reload or join late would otherwise never see it (realtime only delivers
// INSERTs that happen while subscribed).
const RECENT_WINDOW_MS = 2 * 60 * 1000

export function AnnouncementBanner({ gameId }: AnnouncementBannerProps) {
  const [activeAnnouncement, setActiveAnnouncement] =
    useState<AnnouncementItem | null>(null)

  const dismiss = useCallback(() => {
    setActiveAnnouncement((current) => {
      // Remember the dismissal across remounts (e.g. leaderboard round-trip)
      if (current) {
        try {
          sessionStorage.setItem(`ctf_seen_announcement_${gameId}`, current.id)
        } catch {
          // Storage unavailable — worst case the banner reappears
        }
      }
      return null
    })
  }, [gameId])

  // Initial fetch: latest recent announcement (missed while not subscribed)
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function fetchLatest() {
      const { data } = await supabase
        .from("announcements")
        .select("id, message, created_at")
        .eq("game_id", gameId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled || !data) return
      let dismissedId: string | null = null
      try {
        dismissedId = sessionStorage.getItem(`ctf_seen_announcement_${gameId}`)
      } catch {
        // Storage unavailable
      }
      const age = Date.now() - new Date(data.created_at).getTime()
      if (age < RECENT_WINDOW_MS && data.id !== dismissedId) {
        setActiveAnnouncement(data)
      }
    }

    fetchLatest()
    return () => {
      cancelled = true
    }
  }, [gameId])

  // Auto-dismiss timer
  useEffect(() => {
    if (!activeAnnouncement) return

    const timer = setTimeout(dismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [activeAnnouncement, dismiss])

  // Subscribe to realtime announcements
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`player_announcements_${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "announcements",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const announcement = payload.new as AnnouncementItem
          setActiveAnnouncement(announcement)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gameId])

  return (
    <AnimatePresence>
      {activeAnnouncement && (
        <motion.div
          key={activeAnnouncement.id}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="sticky top-2 z-50 mb-3"
        >
          {/* In-flow (sticky) instead of fixed: a fixed banner covered the
              header row — game code, points and the countdown timer — for the
              whole 15s on mobile */}
          <div className="bg-steam-blue text-white shadow-lg rounded-xl">
            <div className="max-w-2xl mx-auto px-4 py-3 flex items-start gap-3">
              <Megaphone className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="flex-1 text-sm font-medium leading-snug">
                {activeAnnouncement.message}
              </p>
              <button
                onClick={dismiss}
                className="shrink-0 rounded-md p-1 hover:bg-white/20 transition-colors"
                aria-label="Uždaryti"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
