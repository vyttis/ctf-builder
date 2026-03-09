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
    text: "Sukurta Klaipėdos universiteto STEAM metodiniame centre",
  },
  {
    icon: Handshake,
    text: "Skirta partnerių mokykloms",
  },
  {
    icon: GraduationCap,
    text: "Taikoma realiose pamokose ir edukacinėse veiklose",
  },
]

export function HeroSection() {
  const prefersReduced = useReducedMotion()

  return (
    <section className="relative overflow-hidden min-h-[90vh] flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-muted to-primary/[0.03]" />
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
            <Button
              variant="ghost"
              className="text-sm text-muted-foreground hover:text-steam-dark"
            >
              Mokytojams
            </Button>
          </Link>
        </nav>

        {/* Hero content */}
        <div className="flex-1 flex items-center pb-12 md:pb-16">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center w-full">
            {/* Left — text */}
            <div>
              {/* KU trust badge */}
              <motion.div
                custom={0}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/8 border border-secondary/15 mb-6"
              >
                <Building2 className="h-3.5 w-3.5 text-secondary" />
                <span className="text-xs font-medium text-secondary">
                  Klaipėdos universiteto STEAM metodinis centras
                </span>
              </motion.div>

              <motion.h1
                custom={1}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="text-3xl sm:text-4xl md:text-[44px] lg:text-[50px] font-extrabold text-steam-dark leading-[1.1] tracking-tight"
              >
                Interaktyvi pamokų kūrimo platforma{" "}
                <span className="text-transparent bg-clip-text gradient-primary">
                  partnerių mokykloms
                </span>
              </motion.h1>

              <motion.p
                custom={2}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="text-base text-muted-foreground mt-5 leading-relaxed max-w-lg"
              >
                Platforma padeda mokytojams kurti įtraukiančias pamokas,
                komandines veiklas ir interaktyvias užduotis, kuriose mokiniai
                mokosi aktyviai dalyvaudami.
              </motion.p>

              <motion.p
                custom={2.5}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="text-sm text-muted-foreground/70 mt-3 leading-relaxed max-w-lg"
              >
                Prieiga suteikiama partnerių mokyklų mokytojams, dalyvaujantiems
                STEAM centro mokymuose, dirbtuvėse ir bendrose veiklose.
              </motion.p>

              {/* CTAs */}
              <motion.div
                custom={3}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="flex flex-col sm:flex-row gap-3 mt-8"
              >
                <a href="mailto:steam@ku.lt">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/15 gap-2 h-12 text-sm px-7 font-semibold"
                  >
                    <Mail className="h-4 w-4" />
                    Susisiekti su STEAM centru
                  </Button>
                </a>
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
                  Kaip veikia platforma
                </Button>
              </motion.div>

              {/* Trust strip */}
              <motion.div
                custom={4}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="flex flex-col gap-2.5 mt-8"
              >
                {trustItems.map((item, i) => {
                  const Icon = item.icon
                  return (
                    <span
                      key={i}
                      className="flex items-center gap-2 text-xs text-muted-foreground/70"
                    >
                      <Icon className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                      {item.text}
                    </span>
                  )
                })}
              </motion.div>
            </div>

            {/* Right — photo grid */}
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="hidden md:block"
            >
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-to-br from-primary/10 via-secondary/5 to-highlight/10 rounded-3xl blur-2xl opacity-60" />

                <div className="relative grid grid-cols-2 gap-3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="relative col-span-2 rounded-2xl overflow-hidden shadow-2xl shadow-steam-dark/10 border border-white/60 aspect-[16/9]"
                  >
                    <Image
                      src="/photos/activity-students.jpg"
                      alt="Mokiniai sprendžia užduotis komandomis"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="relative rounded-2xl overflow-hidden shadow-lg shadow-steam-dark/8 border border-white/60 aspect-[4/3]"
                  >
                    <Image
                      src="/photos/classroom-teacher.jpg"
                      alt="Mokytoja padeda mokiniams klasėje"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="relative rounded-2xl overflow-hidden shadow-lg shadow-steam-dark/8 border border-white/60 aspect-[4/3]"
                  >
                    <Image
                      src="/photos/activity-beavers.jpg"
                      alt="STEAM centro veiklos"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
