"use client"

import { SectionWrapper } from "./section-wrapper"
import { Button } from "@/components/ui/button"
import { Mail, ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const steps = [
  {
    number: "01",
    title: "Partnerystė su STEAM centru",
    body: "Įrankis prieinamas mokykloms, priklausančioms Klaipėdos universiteto STEAM metodinio centro partnerių tinklui.",
    accent: "secondary",
  },
  {
    number: "02",
    title: "Praktiniai mokymai",
    body: "Prieš pradedant naudoti įrankį, mokytojai dalyvauja praktiniuose mokymuose ir dirbtuvėse kartu su STEAM centro komanda.",
    accent: "primary",
  },
  {
    number: "03",
    title: "Asmeninė prieiga",
    body: "Po mokymų mokytojui suteikiama asmeninė paskyra. Pamokas kuriate savarankiškai, be papildomų leidimų ar administracinių procedūrų.",
    accent: "highlight",
  },
] as const

const ACCENT_CLASS: Record<string, string> = {
  primary: "text-primary",
  secondary: "text-secondary",
  highlight: "text-highlight",
}

export function AccessSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted" id="access">
      <div className="grid lg:grid-cols-12 gap-y-14 lg:gap-x-14 items-start">
        {/* Left — process */}
        <div className="lg:col-span-7">
          {/* Editorial header */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex h-px w-10 bg-highlight" />
              <span className="text-[11px] uppercase tracking-[0.22em] text-highlight font-semibold">
                §8 · Prieiga
              </span>
            </div>
            <h2 className="text-display-sm md:text-display-md text-steam-dark leading-[0.98] tracking-tight">
              Trys{" "}
              <span className="font-display italic text-steam-dark/70">žingsniai</span>
              <br />
              iki paskyros.
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mt-6 max-w-xl leading-relaxed text-pretty">
              Pradinis kelias trumpas: partnerystė, praktiniai mokymai ir asmeninės
              prieigos suteikimas. Visa kita — savarankiškas darbas pamokose.
            </p>
          </div>

          <ol className="space-y-px bg-border/60 border-y border-border/60">
            {steps.map((step) => (
              <motion.li
                key={step.number}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-[auto_1fr] gap-6 bg-muted/30 px-2 py-6 sm:px-6"
              >
                <div className={`numeral-display font-medium text-3xl tabular-nums shrink-0 ${ACCENT_CLASS[step.accent]}`}>
                  {step.number}
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-bold text-steam-dark tracking-tight leading-tight mb-2 text-balance">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl text-pretty">
                    {step.body}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* Right — contact card, editorial */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="lg:col-span-5 lg:sticky lg:top-24"
        >
          <div className="relative p-8 md:p-10 rounded-2xl bg-steam-dark text-white overflow-hidden">
            {/* Decorative geometric lines */}
            <div className="absolute inset-0 construction-lines opacity-30 mix-blend-overlay" />
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-primary/20 blur-3xl" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex h-px w-8 bg-primary/60" />
                <span className="text-[11px] uppercase tracking-[0.22em] text-primary font-semibold">
                  Susisiekti
                </span>
              </div>

              <h3 className="text-3xl font-bold tracking-tight leading-tight mb-4">
                Svarstote{" "}
                <span className="font-display italic text-primary">partnerystę</span>?
              </h3>
              <p className="text-sm text-white/75 leading-relaxed mb-7 max-w-xs">
                Parašykite STEAM metodiniam centrui — pasikalbėsime apie jūsų mokyklos
                poreikius ir tolesnius žingsnius.
              </p>

              <a href="mailto:steam@ku.lt" className="inline-block">
                <Button
                  className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 h-11 px-6"
                >
                  <Mail className="h-4 w-4" />
                  steam@ku.lt
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
