"use client"

import { SteamLogo } from "@/components/steam-logo"
import { Button } from "@/components/ui/button"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import {
  ArrowDown,
  Building2,
  GraduationCap,
  Handshake,
  Mail,
} from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import Image from "next/image"

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

const trustItems = [
  {
    icon: Building2,
    text: "Klaipėdos universiteto STEAM centras",
  },
  {
    icon: Handshake,
    text: "Skirta partnerių mokykloms",
  },
  {
    icon: GraduationCap,
    text: "Taikoma realiose pamokose",
  },
]

export function HeroSection() {
  const prefersReduced = useReducedMotion()

  return (
    <section className="relative overflow-hidden">
      {/* Background — full bleed dark */}
      <div className="absolute inset-0 bg-gradient-to-br from-steam-dark via-[#003845] to-steam-dark" />
      {/* Subtle glow accents */}
      <motion.div
        animate={
          prefersReduced
            ? {}
            : { scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }
        }
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4"
        style={{ opacity: 0.12 }}
      />
      <motion.div
        animate={
          prefersReduced
            ? {}
            : { scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }
        }
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4"
        style={{ opacity: 0.08 }}
      />

      <div className="relative">
        {/* Navigation */}
        <nav className="container mx-auto px-5 max-w-[1200px] flex items-center justify-between py-5">
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
            <SteamLogo className="[&_text]:fill-white [&_line]:opacity-90" />
          </Link>
          <Link href="/auth/login">
            <Button
              variant="outline"
              size="sm"
              className="text-sm text-white/70 hover:text-white hover:border-white/40 border-white/20 bg-white/5 hover:bg-white/10"
            >
              Mokytojams
            </Button>
          </Link>
        </nav>

        {/* Hero content */}
        <div className="container mx-auto px-5 max-w-[1200px] pt-12 md:pt-20 pb-20 md:pb-28">
          <div className="grid lg:grid-cols-[1fr_520px] gap-10 lg:gap-16 items-center">
            {/* Left — text */}
            <div>
              {/* KU trust badge */}
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/[0.06] border border-white/10 mb-7"
              >
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-white/70">
                  Klaipėdos universiteto STEAM centras
                </span>
              </motion.div>

              <motion.h1
                custom={1}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-extrabold text-white leading-[1.08] tracking-tight"
              >
                Pamokos, kurios{" "}
                <br className="hidden sm:block" />
                įtraukia{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-steam-cyan">
                  visą klasę
                </span>
              </motion.h1>

              <motion.p
                custom={2}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="text-base md:text-lg text-white/50 mt-5 leading-relaxed max-w-[520px]"
              >
                KU STEAM centro komanda sukūrė įrankį, kuriuo mokytojai
                parengia interaktyvias pamokas su komandinėmis užduotimis,
                iššūkiais ir diskusijomis. Prieiga suteikiama partnerių mokyklų
                mokytojams po mokymų ir praktinių veiklų.
              </motion.p>

              {/* CTAs */}
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="flex flex-col sm:flex-row gap-3 mt-9"
              >
                <a href="mailto:steam@ku.lt">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 gap-2 h-12 text-sm px-8 font-semibold"
                  >
                    <Mail className="h-4 w-4" />
                    Susisiekti su STEAM centru
                  </Button>
                </a>
                <Button
                  size="lg"
                  variant="ghost"
                  className="w-full sm:w-auto gap-2 h-12 text-sm px-8 text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => {
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }}
                >
                  <ArrowDown className="h-4 w-4" />
                  Kaip tai veikia
                </Button>
              </motion.div>

              {/* Trust strip */}
              <motion.div
                custom={4}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="flex flex-wrap gap-x-6 gap-y-2 mt-10 pt-8 border-t border-white/10"
              >
                {trustItems.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <span
                      key={i}
                      className="flex items-center gap-2 text-[13px] text-white/40 font-medium"
                    >
                      <Icon className="h-4 w-4 text-primary/70 shrink-0" />
                      {item.text}
                    </span>
                  )
                })}
              </motion.div>
            </div>

            {/* Right — hero visual */}
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Glow behind images */}
                <div className="absolute -inset-8 bg-gradient-to-br from-primary/20 via-secondary/10 to-highlight/15 rounded-3xl blur-3xl opacity-50" />

                {/* Main hero image — dominant */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/30 border border-white/10 aspect-[4/3]"
                >
                  <Image
                    src="/photos/activity-students.jpg"
                    alt="Mokiniai sprendžia užduotis komandomis"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 520px"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-steam-dark/30 via-transparent to-transparent" />
                </motion.div>

                {/* Secondary support image — overlapping bottom-left */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  className="absolute -bottom-6 -left-8 w-[200px] rounded-xl overflow-hidden shadow-xl shadow-black/20 border-2 border-white/15 aspect-[4/3]"
                >
                  <Image
                    src="/photos/classroom-teacher.jpg"
                    alt="Mokytoja padeda mokiniams klasėje"
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </motion.div>

                {/* Floating badge — top right */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                  className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl shadow-black/15 px-4 py-3 border border-border/30"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-steam-dark leading-none">3 komandos</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">sprendžia užduotis</div>
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
