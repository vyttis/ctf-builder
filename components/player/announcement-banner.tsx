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

export function AnnouncementBanner({ gameId }: AnnouncementBannerProps) {
  const [activeAnnouncement, setActiveAnnouncement] =
    useState<AnnouncementItem | null>(null)

  const dismiss = useCallback(() => {
    setActiveAnnouncement(null)
  }, [])

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
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className="bg-steam-blue text-white shadow-lg">
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
