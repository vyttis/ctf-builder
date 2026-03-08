"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Megaphone, Send, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Announcement {
  id: string
  message: string
  created_at: string
}

interface AnnouncementPanelProps {
  gameId: string
}

const MAX_CHARS = 500

function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHours = Math.floor(diffMin / 60)

  if (diffSec < 60) return "ką tik"
  if (diffMin < 60) return `prieš ${diffMin} min.`
  if (diffHours < 24) return `prieš ${diffHours} val.`
  return new Date(timestamp).toLocaleDateString("lt-LT")
}

export function AnnouncementPanel({ gameId }: AnnouncementPanelProps) {
  const { toast } = useToast()
  const [message, setMessage] = useState("")
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [sending, setSending] = useState(false)

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch(`/api/games/${gameId}/announcements`)
      if (res.ok) {
        const data = await res.json()
        setAnnouncements(data)
      }
    } catch {
      // Silently fail on fetch error
    }
  }, [gameId])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  async function handleSend() {
    const trimmed = message.trim()
    if (!trimmed || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/games/${gameId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      })

      if (res.ok) {
        const created = await res.json()
        setAnnouncements((prev) => [created, ...prev])
        setMessage("")
      }
    } catch {
      toast({
        title: "Klaida",
        description: "Nepavyko išsiųsti pranešimo. Bandykite dar kartą.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card className="border-border/50 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-[#008CB4]" />
          Pranešimai
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input area */}
        <div className="space-y-2">
          <Textarea
            placeholder="Rašykite pranešimą komandoms..."
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            rows={3}
            className="resize-none text-sm"
          />
          <div className="flex items-center justify-between">
            <span
              className={`text-xs ${
                message.length >= MAX_CHARS
                  ? "text-[#FA2864]"
                  : "text-muted-foreground"
              }`}
            >
              {message.length}/{MAX_CHARS}
            </span>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="bg-[#008CB4] hover:bg-[#008CB4]/90"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Siųsti
            </Button>
          </div>
        </div>

        {/* Announcements list */}
        {announcements.length > 0 && (
          <div className="border-t border-border/40 pt-3 space-y-3 max-h-[300px] overflow-y-auto">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-2.5 text-sm group"
              >
                <Megaphone className="h-3.5 w-3.5 text-[#008CB4]/50 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[#00323C] leading-snug break-words">
                    {a.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {formatRelativeTime(a.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
