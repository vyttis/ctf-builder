"use client"

import { SteamLogo } from "@/components/steam-logo"
import { Button } from "@/components/ui/button"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import {
  ArrowRight,
  ArrowDown,
  GraduationCap,
  UserX,
  Building2,
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
      {/* Background */}
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
                  Klaipėdos universiteto STEAM centras
                </span>
              </motion.div>

              <motion.h1
                custom={1}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold text-steam-dark leading-[1.08] tracking-tight"
              >
                Pamokos, kuriose mokiniai{" "}
                <span className="text-transparent bg-clip-text gradient-primary">
                  sprendžia iššūkius
                </span>
              </motion.h1>

              <motion.p
                custom={2}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="text-base text-muted-foreground mt-5 leading-relaxed max-w-lg"
              >
                Interaktyvi platforma, padedanti mokytojams kurti įtraukiančias
                pamokas ir komandines mokymosi veiklas — o mokinių progresą
                stebėti realiu laiku.
              </motion.p>

              {/* CTAs */}
              <motion.div
                custom={3}
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
                custom={4}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 text-xs text-muted-foreground/70"
              >
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Nemokama mokykloms
                </span>
                <span className="flex items-center gap-1.5">
                  <UserX className="h-3.5 w-3.5" />
                  Be registracijos mokiniams
                </span>
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
                    className="col-span-2 rounded-2xl overflow-hidden shadow-2xl shadow-steam-dark/10 border border-white/60 aspect-[16/9]"
                  >
                    <img
                      src="/photos/activity-students.jpg"
                      alt="Mokiniai sprendžia užduotis komandomis"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="rounded-2xl overflow-hidden shadow-lg shadow-steam-dark/8 border border-white/60 aspect-[4/3]"
                  >
                    <img
                      src="/photos/classroom-teacher.jpg"
                      alt="Mokytoja padeda mokiniams klasėje"
                      className="w-full h-full object-cover"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="rounded-2xl overflow-hidden shadow-lg shadow-steam-dark/8 border border-white/60 aspect-[4/3]"
                  >
                    <img
                      src="/photos/activity-beavers.jpg"
                      alt="STEAM centro veiklos"
                      className="w-full h-full object-cover"
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
