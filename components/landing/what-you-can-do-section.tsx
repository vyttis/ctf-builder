"use client"

import { SectionWrapper } from "./section-wrapper"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const capabilities = [
  {
    label: "Užduotys",
    title: "Klausimai, iššūkiai, scenarijai",
    body: "Atviro teksto atsakymai, skaitiniai uždaviniai, daugianariai pasirinkimai. Komandinės veiklos ir individualūs sprendimai vienoje vietoje.",
    accent: "primary",
  },
  {
    label: "Pamoka",
    title: "Pamokos eiga per kelias minutes",
    body: "Įvadas, pagrindinės veiklos, diskusija, refleksija. Pritempkite, perkelkite, ištrinkite — kol tilpsta į 45 minutes.",
    accent: "secondary",
  },
  {
    label: "DI",
    title: "Dirbtinis intelektas siūlo, jūs sprendžiate",
    body: "AI generuoja idėjas, klausimus, užuominas pagal LT BUP. Visada redaguojate. Niekada nepateikiama be jūsų akivaizdos.",
    accent: "highlight",
  },
  {
    label: "Realtime",
    title: "Matote, ką klasė daro — dabar",
    body: "Atsakymai matomi akimirksniu. Kas išsprendė, kas užstrigo, kuris klausimas buvo per sunkus. Reaguokite iškart.",
    accent: "accent",
  },
  {
    label: "Komandos",
    title: "Bendradarbiavimas, ne konkurencija",
    body: "Komandos ar individualus darbas. Be paskyrų, be el. pašto. Vienas QR kodas — visa klasė viduje.",
    accent: "secondary",
  },
  {
    label: "Refleksija",
    title: "Po pamokos — analizė",
    body: "Kurios užduotys buvo per sudėtingos. Kur klasė užstrigo. Ką verta dar kartą aptarti. Tikra pedagoginė refleksija.",
    accent: "primary",
  },
] as const

const ACCENT: Record<string, { num: string; bar: string; tag: string }> = {
  primary: { num: "text-primary", bar: "bg-primary", tag: "text-primary" },
  secondary: { num: "text-secondary", bar: "bg-secondary", tag: "text-secondary" },
  highlight: { num: "text-highlight", bar: "bg-highlight", tag: "text-highlight" },
  accent: { num: "text-accent", bar: "bg-accent", tag: "text-accent" },
}

export function WhatYouCanDoSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted">
      {/* Editorial header */}
      <div className="max-w-3xl mb-16 md:mb-24">
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-flex h-px w-10 bg-steam-dark/40" />
          <span className="text-[11px] uppercase tracking-[0.22em] text-steam-dark/60 font-semibold">
            §3 · Galimybės
          </span>
        </div>
        <h2 className="text-display-sm md:text-display-md text-steam-dark leading-[0.98] tracking-tight">
          Šešios{" "}
          <span className="font-display italic text-steam-dark/70">paprastos</span>{" "}
          galimybės.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mt-6 max-w-2xl leading-relaxed text-pretty">
          Vienoje platformoje, vienoje sesijoje, vienam mokytojui. Be papildomos infrastruktūros,
          be IT pagalbos, be mokymų savaitgaliais.
        </p>
      </div>

      {/* Cards grid — asymmetric, editorial */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/60 rounded-2xl overflow-hidden border border-border/60">
        {capabilities.map((item, index) => {
          const colors = ACCENT[item.accent]
          return (
            <motion.article
              key={index}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.5 }}
              className="group relative bg-white p-7 lg:p-8 transition-colors hover:bg-muted/30"
            >
              <div className="flex items-center gap-2 mb-5">
                <span className={`h-px w-6 ${colors.bar}`} />
                <span className={`text-[10px] uppercase tracking-[0.22em] font-bold ${colors.tag}`}>
                  {item.label}
                </span>
              </div>
              <div className="flex items-start gap-4">
                <span className={`numeral-display font-medium text-2xl ${colors.num} tabular-nums shrink-0 mt-0.5`}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-steam-dark text-lg leading-tight text-balance mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed text-pretty">
                    {item.body}
                  </p>
                </div>
              </div>
            </motion.article>
          )
        })}
      </div>
    </SectionWrapper>
  )
}
