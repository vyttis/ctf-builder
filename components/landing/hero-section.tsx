"use client"

import { SteamLogo } from "@/components/steam-logo"
import { Button } from "@/components/ui/button"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import {
  ArrowRight,
  ArrowDown,
  Lock,
  GraduationCap,
  UserX,
  Puzzle,
  Trophy,
  QrCode,
  BarChart3,
  Sparkles,
  Flag,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.5,
      ease: [0, 0, 0.2, 1] as const,
    },
  }),
}

export function HeroSection() {
  const prefersReduced = useReducedMotion()

  return (
    <section className="relative overflow-hidden min-h-[90vh] flex flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#F8FAFB] to-primary/[0.03]" />
      <motion.div
        animate={
          prefersReduced
            ? {}
            : { scale: [1, 1.15, 1], opacity: [0.04, 0.07, 0.04] }
        }
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[700px] h-[700px] bg-primary rounded-full blur-3xl -translate-y-1/3 translate-x-1/4"
        style={{ opacity: 0.04 }}
      />
      <motion.div
        animate={
          prefersReduced
            ? {}
            : { scale: [1, 1.1, 1], opacity: [0.03, 0.06, 0.03] }
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"
        style={{ opacity: 0.03 }}
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
                className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-extrabold text-steam-dark leading-[1.08] tracking-tight"
              >
                Pamoką paverskite{" "}
                <span className="text-transparent bg-clip-text gradient-primary">
                  komandiniu iššūkiu
                </span>
              </motion.h1>

              <motion.p
                custom={1}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="text-base text-muted-foreground mt-5 leading-relaxed max-w-lg"
              >
                Interaktyvi STEAM pamokų platforma, kur mokiniai mokosi
                spręsdami struktūruotas užduotis komandomis — o mokytojas viską
                stebi realiu laiku.
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
                    Pradėti kurti pamoką
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto gap-2 h-12 text-sm px-7 border-border/60"
                  onClick={() => {
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
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

            {/* Right — app mockup */}
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="hidden md:block"
            >
              <div className="relative">
                {/* Glow effect behind device */}
                <div className="absolute -inset-4 bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/10 rounded-3xl blur-2xl opacity-60" />

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

                  {/* Content preview — builder view */}
                  <div className="p-5 space-y-4">
                    {/* Builder header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-semibold text-steam-dark">
                          Jūros tyrinėtojas
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          5 iššūkiai &middot; 3 komandos
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-1 px-2 py-1 bg-primary/8 rounded-lg">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                          <span className="text-[9px] font-semibold text-primary">
                            Aktyvus
                          </span>
                        </div>
                        <div className="h-7 px-2 bg-primary/10 rounded-lg flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-primary" />
                          <span className="text-[9px] font-semibold text-primary">
                            DI
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Challenge cards */}
                    {[
                      {
                        icon: Puzzle,
                        title: "Demografinis detektyvas",
                        points: "200",
                        difficulty: "Vidutinis",
                        diffColor: "bg-highlight/10 text-highlight",
                        color: "bg-primary/8 text-primary",
                      },
                      {
                        icon: Flag,
                        title: "Jūros ekspedicija",
                        points: "150",
                        difficulty: "Lengvas",
                        diffColor: "bg-primary/10 text-primary",
                        color: "bg-secondary/8 text-secondary",
                      },
                      {
                        icon: Trophy,
                        title: "Kodų medžioklė",
                        points: "300",
                        difficulty: "Sunkus",
                        diffColor: "bg-accent/10 text-accent",
                        color: "bg-highlight/8 text-highlight",
                      },
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
                          <div
                            className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-steam-dark">
                              {item.title}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {item.points} taškų
                            </div>
                          </div>
                          <div
                            className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${item.diffColor}`}
                          >
                            {item.difficulty}
                          </div>
                        </motion.div>
                      )
                    })}

                    {/* Mini leaderboard strip */}
                    <div className="rounded-xl border border-border/30 bg-white p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5 mb-2">
                        <BarChart3 className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-[9px] font-medium text-muted-foreground/60 uppercase tracking-wider">
                          Lyderių lentelė
                        </span>
                      </div>
                      {[
                        { name: "Bangų medžiotojai", pct: 85 },
                        { name: "Kodo meistrai", pct: 60 },
                      ].map((team, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-steam-dark w-3">
                            {i + 1}
                          </span>
                          <span className="text-[9px] text-steam-dark w-24 truncate">
                            {team.name}
                          </span>
                          <div className="flex-1 h-1.5 bg-border/20 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary/40"
                              style={{ width: `${team.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating QR badge */}
                <motion.div
                  animate={prefersReduced ? {} : { y: [0, -6, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-lg shadow-steam-dark/10 border border-border/30 p-3 flex items-center gap-2"
                >
                  <QrCode className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-[10px] font-semibold text-steam-dark">
                      QR kodas
                    </div>
                    <div className="text-[9px] text-muted-foreground">
                      Prisijungk akimirksniu
                    </div>
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
