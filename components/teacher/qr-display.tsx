"use client"

import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  { ssr: false, loading: () => <div className="animate-pulse bg-muted rounded" style={{ width: 200, height: 200 }} /> }
)
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Check, Download, Maximize2 } from "lucide-react"
import { useState, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

interface QRDisplayProps {
  gameCode: string
  size?: number
}

/**
 * Build the player URL for a game code.
 *
 * The teacher is on the `app.*` subdomain. The QR code must take students
 * to the `play.*` subdomain — otherwise middleware sees an unauthenticated
 * user on a teacher subdomain and redirects them to /auth/login (a
 * student-blocking dead end).
 *
 * The path always keeps the `/play/<code>` shape because that matches the
 * Next.js route `app/play/[gameCode]/page.tsx`, regardless of subdomain.
 *
 * Priority:
 *   1. NEXT_PUBLIC_PLAY_URL (configured per environment in Vercel)
 *   2. Swap `app.` → `play.` in window.location.origin
 *   3. Same-origin (localhost dev, no subdomain split)
 */
function getPlayUrl(gameCode: string): string {
  const configured = process.env.NEXT_PUBLIC_PLAY_URL?.replace(/\/$/, "")
  if (configured) {
    return `${configured}/play/${gameCode}`
  }

  if (typeof window !== "undefined") {
    const origin = window.location.origin
    // app.kusteam.app → play.kusteam.app, app.localhost:3000 → play.localhost:3000
    const playOrigin = /\/\/app\./.test(origin)
      ? origin.replace(/\/\/app\./, "//play.")
      : origin
    return `${playOrigin}/play/${gameCode}`
  }
  return `/play/${gameCode}`
}

export function QRDisplay({ gameCode, size = 200 }: QRDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const playUrl = getPlayUrl(gameCode)

  function handleCopy() {
    navigator.clipboard.writeText(playUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg")
    if (!svg) return

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const padding = 40
    const qrSize = size + padding * 2
    const totalHeight = qrSize + 60
    canvas.width = qrSize
    canvas.height = totalHeight

    // White background
    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, qrSize, totalHeight)

    // Draw QR from SVG
    const svgData = new XMLSerializer().serializeToString(svg)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size)

      // Draw game code below
      ctx.fillStyle = "#00323C"
      ctx.font = "bold 24px monospace"
      ctx.textAlign = "center"
      ctx.fillText(gameCode, qrSize / 2, qrSize + 35)

      const link = document.createElement("a")
      link.download = `ctf-${gameCode}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    }
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }, [gameCode, size])

  return (
    <>
      <Card className="border-border/50 bg-white">
        <CardContent className="flex flex-col items-center p-6">
          {/* QR Code */}
          <div ref={qrRef} className="bg-white p-4 rounded-xl shadow-inner border border-border/30">
            <QRCodeSVG
              value={playUrl}
              size={size}
              level="H"
              includeMargin={false}
              fgColor="#00323C"
            />
          </div>

          {/* Game code */}
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Žaidimo kodas</p>
            <p className="text-2xl font-mono font-bold text-steam-dark tracking-widest">
              {gameCode}
            </p>
          </div>

          {/* URL and actions */}
          <div className="mt-4 w-full space-y-2">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
              <code className="text-xs text-muted-foreground flex-1 truncate">
                {playUrl}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 h-7 w-7 p-0"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex-1 gap-1.5 text-xs"
              >
                <Download className="h-3.5 w-3.5" />
                Atsisiųsti PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFullscreen(true)}
                className="flex-1 gap-1.5 text-xs"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Rodyti ekrane
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fullscreen QR dialog for projecting in classroom */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-md sm:max-w-lg flex flex-col items-center py-12">
          <DialogTitle className="sr-only">QR kodas: {gameCode}</DialogTitle>
          <QRCodeSVG
            value={playUrl}
            size={300}
            level="H"
            includeMargin={false}
            fgColor="#00323C"
          />
          <p className="text-4xl font-mono font-bold text-steam-dark tracking-[0.3em] mt-6">
            {gameCode}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Nuskaitykite QR kodą arba įveskite kodą adresu
          </p>
          <code className="text-xs text-muted-foreground mt-1">
            {playUrl}
          </code>
        </DialogContent>
      </Dialog>
    </>
  )
}
