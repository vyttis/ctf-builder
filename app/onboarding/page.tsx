"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SteamLogo } from "@/components/steam-logo"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { User, School, Phone, ArrowRight, Loader2 } from "lucide-react"

export default function OnboardingPage() {
  const [fullName, setFullName] = useState("")
  const [school, setSchool] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          school: school.trim(),
          phone: phone.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Nepavyko išsaugoti")
      }

      toast({
        title: "Sveiki atvykę!",
        description: "Jūsų profilis sėkmingai sukurtas.",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error: unknown) {
      toast({
        title: "Klaida",
        description:
          error instanceof Error ? error.message : "Bandykite dar kartą",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-white via-white to-primary/5">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="flex justify-center mb-8">
          <SteamLogo size="large" />
        </div>

        <Card className="border-0 shadow-2xl shadow-primary/10 bg-white/80 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <User className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-steam-dark">
              Užbaikite registraciją
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Užpildykite savo profilį, kad galėtumėte pradėti
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="text-steam-dark font-medium"
                >
                  Vardas Pavardė
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jonas Jonaitis"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12 bg-white border-border/50 focus:border-primary focus:ring-primary/20"
                    required
                    minLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="school"
                  className="text-steam-dark font-medium"
                >
                  Mokykla
                </Label>
                <div className="relative">
                  <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="school"
                    type="text"
                    placeholder="Klaipėdos licėjus"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="pl-10 h-12 bg-white border-border/50 focus:border-primary focus:ring-primary/20"
                    required
                    minLength={2}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="phone"
                  className="text-steam-dark font-medium"
                >
                  Telefono numeris
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+370 600 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-12 bg-white border-border/50 focus:border-primary focus:ring-primary/20"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !fullName || !school || !phone}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 mt-2"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Pradėti naudotis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          CTF Builder &middot; STEAM LT Klaipėda
        </p>
      </motion.div>
    </div>
  )
}
