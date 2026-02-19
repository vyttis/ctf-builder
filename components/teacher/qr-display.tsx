"use client"

import { QRCodeSVG } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

interface QRDisplayProps {
  gameCode: string
  size?: number
}

export function QRDisplay({ gameCode, size = 200 }: QRDisplayProps) {
  const [copied, setCopied] = useState(false)

  const playUrl =
    process.env.NODE_ENV === "development"
      ? `http://localhost:3000/play/${gameCode}`
      : `https://ctfbuilder.com/play/${gameCode}`

  function handleCopy() {
    navigator.clipboard.writeText(playUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-border/50 bg-white">
      <CardContent className="flex flex-col items-center p-6">
        {/* QR Code */}
        <div className="bg-white p-4 rounded-xl shadow-inner border border-border/30">
          <QRCodeSVG
            value={playUrl}
            size={size}
            level="M"
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
        </div>
      </CardContent>
    </Card>
  )
}
