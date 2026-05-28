"use client"

import { Button } from "@/components/ui/button"
import { Mail, Handshake, ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

export function FinalCtaSection() {
  const prefersReduced = useReducedMotion()

  return (
    <motion.section
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative py-20 md:py-32 bg-steam-dark overflow-hidden"
    >
      {/* Background — construction lines + glow */}
      <div className="absolute inset-0 construction-lines opacity-50 mix-blend-overlay" />
      <motion.div
        animate={prefersReduced ? {} : { scale: [1, 1.12, 1], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 right-0 w-[700px] h-[700px] bg-primary rounded-full blur-[140px] -translate-y-1/3 translate-x-1/4"
        style={{ opacity: 0.14 }}
      />
      <motion.div
        animate={prefersReduced ? {} : { scale: [1, 1.08, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4"
        style={{ opacity: 0.08 }}
      />

      <div className="container mx-auto px-5 max-w-[1200px] relative">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex h-px w-10 bg-primary/60" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-primary font-semibold">
              §10 · Pradėti
            </span>
          </div>

          <h2 className="text-display-md md:text-display-lg text-white leading-[0.95] tracking-tight mb-7">
            <span className="font-extrabold">Pamoka</span>{" "}
            <span className="font-display italic text-white/75">prasideda</span>{" "}
            <span className="font-extrabold">vakar.</span>
          </h2>

          <p className="text-base md:text-lg text-white/70 max-w-2xl leading-relaxed text-pretty mb-10">
            Vieną el. laišką STEAM metodiniam centrui — atsakysime per dvi darbo dienas.
            Be pardavimų skambučių, be reklamų, be ko nors kito, ko nepaprašėte.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <a href="mailto:steam@ku.lt">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 gap-2 h-12 text-sm px-7 font-semibold"
              >
                <Mail className="h-4 w-4" />
                steam@ku.lt
                <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
              </Button>
            </a>
            <a href="mailto:steam@ku.lt?subject=Domina%20partneryst%C4%97">
              <Button
                size="lg"
                variant="ghost"
                className="w-full sm:w-auto gap-2 h-12 text-sm px-6 text-white/85 hover:text-white hover:bg-white/10 border border-white/15"
              >
                <Handshake className="h-4 w-4" />
                Domina partnerystė
              </Button>
            </a>
          </div>

          {/* Editorial footer fragment */}
          <div className="grid sm:grid-cols-3 gap-y-6 sm:gap-x-8 mt-16 pt-10 border-t border-white/10">
            {[
              { num: "2026", label: "Pradžia" },
              { num: "6", label: "Mokyklos" },
              { num: "40+", label: "Mokytojai" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="numeral-display text-3xl font-medium text-white tabular-nums">
                  {stat.num}
                </div>
                <div className="text-[11px] uppercase tracking-wider text-white/50 mt-1.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  )
}
