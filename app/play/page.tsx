"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { ArrowRight, Gamepad2 } from "lucide-react"

export default function PlayerLandingPage() {
  const [code, setCode] = useState("")
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (code.trim().length >= 6) {
      router.push(`/play/${code.trim().toUpperCase()}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center"
      >
        <img
          src="/illustrations/adventure-start.svg"
          alt=""
          className="w-48 h-48 mx-auto mb-6"
        />

        <h1 className="text-2xl font-bold text-steam-dark mb-2">
          CTF žaidimas
        </h1>
        <p className="text-muted-foreground mb-6">
          Įveskite žaidimo kodą arba nuskaitykite QR kodą
        </p>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-xl">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.toUpperCase().slice(0, 6))
                  }
                  placeholder="KODAS"
                  className="pl-11 h-14 text-center text-2xl tracking-[0.4em] font-mono font-bold bg-white"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <Button
                type="submit"
                disabled={code.trim().length < 6}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/25 gap-2"
              >
                Prisijungti
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground mt-6">
          STEAM LT Klaipėda &middot; CTF Builder
        </p>
      </motion.div>
    </div>
  )
}
