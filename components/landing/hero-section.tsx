"use client"

import { SteamLogo } from "@/components/steam-logo"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowDown, Lock, GraduationCap, UserX, Puzzle, Trophy, QrCode } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0, 0, 0.2, 1] as const },
  }),
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F8FAFB] to-primary/[0.03]" />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.07, 0.04] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[700px] h-[700px] bg-primary rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], opacity: [0.03, 0.06, 0.03] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"
      />

      <div className="relative container mx-auto px-5 max-w-[1140px] flex-1 flex flex-col">
        {/* Navigation */}
        <nav className="flex items-center justify-between py-5">
          <SteamLogo />
          <Link href="/auth/login">
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm h-9 px-5 text-sm">
              Prisijungti
            </Button>
          </Link>
        </nav>

        {/* Hero content — two columns */}
        <div className="flex-1 flex items-center pb-12 md:pb-16">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center w-full">
            {/* Left — text */}
            <div>
              <motion.h1
                custom={0}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="text-3xl sm:text-4xl md:text-[44px] font-extrabold text-steam-dark leading-[1.12] tracking-tight"
              >
                Interaktyvių STEAM pamokų{" "}
                <span className="text-transparent bg-clip-text gradient-primary">
                  kūrimo platforma
                </span>
              </motion.h1>

              <motion.p
                custom={1}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="text-[15px] text-muted-foreground mt-5 leading-relaxed max-w-lg"
              >
                CTF formatas leidžia pamoką paversti struktūruotu komandiniu
                iššūkiu, kuriame mokiniai aktyviai sprendžia užduotis,
                bendradarbiauja ir mokosi per patirtį.
              </motion.p>

              {/* CTAs */}
              <motion.div
                custom={2}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="flex flex-col sm:flex-row gap-3 mt-8"
              >
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/15 gap-2 h-12 text-sm px-7 font-semibold"
                  >
                    Prisijungti prie platformos
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto gap-2 h-12 text-sm px-7 border-border/60"
                  onClick={() => {
                    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  <ArrowDown className="h-4 w-4" />
                  Kaip tai veikia?
                </Button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 text-xs text-muted-foreground/70"
              >
                <span className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  STEAM centro dalyviams
                </span>
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Nemokama
                </span>
                <span className="flex items-center gap-1.5">
                  <UserX className="h-3.5 w-3.5" />
                  Be registracijos mokiniams
                </span>
              </motion.div>
            </div>

            {/* Right — app mockup placeholder */}
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="hidden md:block"
            >
              <div className="relative">
                {/* Device frame */}
                <div className="relative bg-white rounded-2xl shadow-2xl shadow-steam-dark/10 border border-border/40 overflow-hidden">
                  {/* Top bar */}
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-[#F8FAFB]">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-accent/40" />
                      <div className="w-3 h-3 rounded-full bg-highlight/40" />
                      <div className="w-3 h-3 rounded-full bg-primary/40" />
                    </div>
                    <div className="flex-1 mx-6">
                      <div className="bg-white rounded-md h-6 flex items-center justify-center text-[10px] text-muted-foreground/50 font-mono border border-border/30">
                        ctf-builder.vercel.app
                      </div>
                    </div>
                  </div>

                  {/* Content preview */}
                  <div className="p-5 space-y-4">
                    {/* Mini dashboard header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="h-3 w-32 bg-steam-dark/10 rounded-full" />
                        <div className="h-2 w-20 bg-muted-foreground/10 rounded-full mt-2" />
                      </div>
                      <div className="h-8 w-24 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-[10px] font-semibold text-primary">+ Naujas</span>
                      </div>
                    </div>

                    {/* Challenge cards */}
                    {[
                      { icon: Puzzle, title: "Demografinis detektyvas", points: "200", color: "bg-primary/8 text-primary" },
                      { icon: Trophy, title: "Jūros tyrinėtojas", points: "150", color: "bg-secondary/8 text-secondary" },
                      { icon: QrCode, title: "Kodų medžioklė", points: "300", color: "bg-highlight/8 text-highlight" },
                    ].map((item, i) => {
                      const Icon = item.icon
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + i * 0.15 }}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFB] border border-border/30"
                        >
                          <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-medium text-steam-dark">{item.title}</div>
                            <div className="text-[10px] text-muted-foreground">{item.points} taškų</div>
                          </div>
                          <div className="w-12 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-[9px] font-semibold text-primary">Aktyvus</span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>

                {/* Floating QR badge */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg shadow-steam-dark/10 border border-border/30 p-3 flex items-center gap-2"
                >
                  <QrCode className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-[10px] font-semibold text-steam-dark">QR kodas</div>
                    <div className="text-[9px] text-muted-foreground">Prisijungk akimirksniu</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
