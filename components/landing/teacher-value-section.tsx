"use client"

import { SectionWrapper } from "./section-wrapper"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const stats = [
  {
    metric: "Greičiau",
    label: "Pamokos paruošimas",
    detail: "Standartinė pamoka paruošiama per kelias minutes, ne kelias valandas. Dirbtinis intelektas padeda ten, kur užtrunka daugiausia laiko.",
  },
  {
    metric: "Be",
    label: "Mokinių registracijos",
    detail: "Mokiniai prisijungia per QR kodą — be paskyrų, elektroninio pašto ar slaptažodžių. Tinka pradinukams, gimnazistams ir tarp jų.",
  },
  {
    metric: "100 %",
    label: "Mokytojo sprendimas",
    detail: "Dirbtinis intelektas teikia pasiūlymus, bet galutinį užduočių turinį visada peržiūri ir patvirtina pedagogas.",
  },
  {
    metric: "Reali",
    label: "Pamokos eiga",
    detail: "Komandų progresas ir mokinių atsakymai matomi realiu laiku — galima reaguoti dar pamokos metu.",
  },
] as const

export function TeacherValueSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted">
      {/* Editorial header */}
      <div className="max-w-3xl mb-16 md:mb-20">
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-flex h-px w-10 bg-steam-dark/40" />
          <span className="text-[11px] uppercase tracking-[0.22em] text-steam-dark/60 font-semibold">
            §6 · Mokytojui
          </span>
        </div>
        <h2 className="text-display-sm md:text-display-md text-steam-dark leading-[0.98] tracking-tight">
          Keturi{" "}
          <span className="font-display italic text-steam-dark/70">aiškūs</span>{" "}
          principai.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mt-6 max-w-2xl leading-relaxed text-pretty">
          Kuo įrankis naudingas mokytojo darbe — pristatome paprastai ir aiškiai.
        </p>
      </div>

      {/* Stats grid — editorial numeric */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-y-12 lg:gap-x-8 max-w-6xl">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="relative pl-6 border-l-2 border-steam-dark/15"
          >
            <div className="numeral-display font-medium text-5xl lg:text-6xl text-steam-dark leading-none tabular-nums">
              {stat.metric}
            </div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-primary font-bold mt-3">
              {stat.label}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mt-2 max-w-xs text-pretty">
              {stat.detail}
            </p>
          </motion.div>
        ))}
      </div>
    </SectionWrapper>
  )
}
