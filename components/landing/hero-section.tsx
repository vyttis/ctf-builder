"use client"

import { SteamLogo } from "@/components/steam-logo"
import { Button } from "@/components/ui/button"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { ArrowUpRight, Check, LogIn, Mail, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { useRef, useState } from "react"

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
}

// Interactive demo: a single question that lets the visitor experience the
// flow before clicking any CTA. Demonstrates product feel in <3 clicks.
const DEMO_OPTIONS = [
  { id: "a", label: "Vilnius", correct: false },
  { id: "b", label: "Kaunas", correct: false },
  { id: "c", label: "Klaipėda", correct: true },
  { id: "d", label: "Šiauliai", correct: false },
] as const

export function HeroSection() {
  const prefersReduced = useReducedMotion()
  const containerRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  })
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -80])

  const [picked, setPicked] = useState<string | null>(null)
  const correctPicked = picked === "c"

  return (
    <section ref={containerRef} className="relative overflow-hidden">
      {/* Background — full bleed dark, with construction-line texture */}
      <div className="absolute inset-0 bg-gradient-to-br from-steam-dark via-[#003845] to-steam-dark" />
      <div className="absolute inset-0 construction-lines opacity-50 mix-blend-overlay" />

      {/* Subtle glow accents */}
      <motion.div
        animate={prefersReduced ? {} : { scale: [1, 1.12, 1], opacity: [0.1, 0.16, 0.1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[760px] h-[760px] bg-primary rounded-full blur-[130px] -translate-y-1/3 translate-x-1/4"
        style={{ opacity: 0.12 }}
      />
      <motion.div
        animate={prefersReduced ? {} : { scale: [1, 1.08, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2.5 }}
        className="absolute bottom-0 left-0 w-[560px] h-[560px] bg-secondary rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4"
        style={{ opacity: 0.08 }}
      />

      <div className="relative">
        {/* Navigation */}
        <nav className="container mx-auto px-5 max-w-[1240px] flex items-center justify-between py-5">
          <Link
            href="/"
            className="flex items-center hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
          >
            <SteamLogo className="[&_text]:fill-white [&_line]:opacity-90" />
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            <span className="hidden md:inline text-xs text-white/65 font-medium">
              Partnerių mokyklų mokytojams
            </span>
            <Link
              href="/auth/login"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] backdrop-blur-sm pl-4 pr-3.5 py-2 text-sm text-white/85 hover:text-white hover:border-white/30 hover:bg-white/[0.08] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <LogIn className="h-3.5 w-3.5 text-primary/80 group-hover:text-primary transition-colors" />
              <span className="font-medium">Prisijungti</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>
          </div>
        </nav>

        {/* Hero content — asymmetric editorial grid */}
        <motion.div
          style={{ y: parallaxY }}
          className="container mx-auto px-5 max-w-[1240px] pt-10 md:pt-16 pb-24 md:pb-32"
        >
          <div className="grid lg:grid-cols-12 gap-y-12 lg:gap-x-10 items-start">
            {/* Left — text (7 cols) */}
            <div className="lg:col-span-7 lg:pt-6">
              {/* Eyebrow */}
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={reveal}
                className="flex items-center gap-3 mb-7"
              >
                <span className="inline-flex h-px w-10 bg-primary/60" />
                <span className="text-[11px] uppercase tracking-[0.22em] text-primary font-semibold">
                  Klaipėdos universiteto STEAM centras
                </span>
              </motion.div>

              {/* Editorial headline — display serif + sans mix */}
              <motion.h1
                custom={1}
                initial="hidden"
                animate="visible"
                variants={reveal}
                className="text-display-md md:text-display-lg text-white leading-[0.95] tracking-tight"
              >
                <span className="font-extrabold">Pamoka,</span>{" "}
                <span className="font-display italic text-white/90">kuri</span>{" "}
                <span className="font-extrabold">įtraukia</span>
                <br />
                <span className="font-extrabold">visą</span>{" "}
                <span className="relative inline-block">
                  <span className="font-display italic text-primary">klasę</span>
                  <span
                    aria-hidden
                    className="absolute left-0 right-0 -bottom-1 h-[5px] bg-primary/60 rounded-full draw-underline"
                  />
                </span>
                <span className="text-white/40">.</span>
              </motion.h1>

              <motion.p
                custom={2}
                initial="hidden"
                animate="visible"
                variants={reveal}
                className="text-base md:text-lg text-white/75 mt-7 leading-relaxed max-w-[580px] text-pretty"
              >
                Mokytojo įrankis, kuris pamoką paverčia žaidimu — komandinės užduotys,
                iššūkiai, akimirksniu matomi atsakymai. Pritaikyta{" "}
                <span className="text-white font-medium">Lietuvos bendrojo ugdymo programai</span>,
                24 dalykams, 1–12 klasėms.
              </motion.p>

              {/* CTAs */}
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={reveal}
                className="flex flex-col sm:flex-row gap-3 mt-9"
              >
                <a href="mailto:steam@ku.lt">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 gap-2 h-12 text-sm px-7 font-semibold"
                  >
                    <Mail className="h-4 w-4" />
                    Susisiekti su STEAM centru
                  </Button>
                </a>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full sm:w-auto gap-2 h-12 text-sm px-6 text-white/85 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  Kaip tai veikia
                  <ArrowUpRight className="h-4 w-4 rotate-90" />
                </Button>
              </motion.div>

              {/* Numerical proof strip — typographic over icons */}
              <motion.div
                custom={4}
                initial="hidden"
                animate="visible"
                variants={reveal}
                className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10 max-w-[560px]"
              >
                {[
                  { num: "24", label: "BUP dalykai" },
                  { num: "1–12", label: "klasių spektras" },
                  { num: "5+", label: "veiklos tipai" },
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="numeral-display text-3xl md:text-4xl font-medium text-white">
                      {stat.num}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-white/55 mt-1.5">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — interactive mini-demo (5 cols) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5 lg:pt-4"
            >
              <div className="relative">
                {/* Glow behind card */}
                <div className="absolute -inset-8 bg-gradient-to-br from-primary/20 via-secondary/10 to-highlight/15 rounded-3xl blur-3xl opacity-40" />

                {/* Demo "phone" mock — what students see */}
                <motion.div
                  animate={prefersReduced ? {} : { y: [0, -6, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative rounded-[28px] bg-white shadow-2xl shadow-black/30 border border-white/20 overflow-hidden"
                >
                  {/* Mock device header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-muted/50 border-b border-border/40">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-accent/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-highlight/60" />
                      <span className="w-2.5 h-2.5 rounded-full bg-primary/60" />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground tracking-wider">
                      pamoka.live • 8 kl. geografija
                    </span>
                  </div>

                  {/* Card content — looks like a real challenge */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-primary font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        Užduotis 3 iš 5
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        150 tšk.
                      </span>
                    </div>

                    <h3 className="text-display-xs text-steam-dark font-extrabold leading-tight mb-1">
                      Kuriame mieste{" "}
                      <span className="font-display italic font-normal">įsikūręs</span>{" "}
                      STEAM centras?
                    </h3>
                    <p className="text-xs text-muted-foreground mb-5">
                      Vienas iš didžiausių Lietuvos uostamiesčių.
                    </p>

                    <div className="space-y-2">
                      {DEMO_OPTIONS.map((opt) => {
                        const isPicked = picked === opt.id
                        const showResult = picked !== null && isPicked
                        return (
                          <button
                            key={opt.id}
                            onClick={() => !picked && setPicked(opt.id)}
                            disabled={picked !== null && !isPicked}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all ${
                              showResult && opt.correct
                                ? "border-primary bg-primary/10 text-primary"
                                : showResult && !opt.correct
                                  ? "border-accent bg-accent/10 text-accent"
                                  : picked && !isPicked
                                    ? "border-border bg-white text-muted-foreground opacity-50"
                                    : "border-border bg-white text-steam-dark hover:border-primary/40 hover:bg-primary/[0.03]"
                            }`}
                          >
                            <span
                              className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center text-[11px] font-bold uppercase ${
                                showResult && opt.correct
                                  ? "border-primary bg-primary text-white"
                                  : showResult && !opt.correct
                                    ? "border-accent bg-accent text-white"
                                    : "border-border text-muted-foreground"
                              }`}
                            >
                              {showResult && opt.correct ? <Check className="h-3.5 w-3.5" /> : opt.id.toUpperCase()}
                            </span>
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>

                    {picked && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 px-4 py-3 rounded-lg text-xs ${
                          correctPicked
                            ? "bg-primary/10 border border-primary/20 text-primary"
                            : "bg-accent/10 border border-accent/20 text-accent"
                        }`}
                      >
                        {correctPicked ? (
                          <>
                            <strong>Teisingai!</strong> Klaipėdoje veikia KU STEAM centras —
                            čia ir gimsta ši platforma.
                          </>
                        ) : (
                          <>
                            <strong>Beveik.</strong> KU STEAM centras yra Klaipėdoje.{" "}
                            <button
                              onClick={() => setPicked(null)}
                              className="underline hover:no-underline"
                            >
                              Bandyti dar
                            </button>
                            .
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Floating editorial tag — "try it" hint */}
                <motion.div
                  initial={{ opacity: 0, rotate: -6, scale: 0.9 }}
                  animate={{ opacity: 1, rotate: -6, scale: 1 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  className="absolute -top-5 -left-6 bg-highlight text-steam-dark rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-lg shadow-highlight/30 flex items-center gap-1.5"
                >
                  <Sparkles className="h-3 w-3" />
                  Spauskite
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Marquee credentials strip — bottom of hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="border-t border-white/10 overflow-hidden"
        >
          <div className="flex animate-marquee whitespace-nowrap py-4 text-[12px] text-white/40 [animation-play-state:running] hover:[animation-play-state:paused]">
            {[...Array(2)].map((_, dup) => (
              <div key={dup} className="flex items-center shrink-0">
                {[
                  "Klaipėdos universitetas",
                  "STEAM metodinis centras",
                  "Bendrojo ugdymo programa",
                  "Atviro kodo Lietuvai",
                  "Klaipėdos universitetas",
                  "STEAM metodinis centras",
                  "Bendrojo ugdymo programa",
                  "Atviro kodo Lietuvai",
                ].map((item, i) => (
                  <span key={`${dup}-${i}`} className="flex items-center">
                    <span className="px-8 font-medium tracking-wider">{item}</span>
                    <span className="text-white/15">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
