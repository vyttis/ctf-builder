"use client"

import { SectionWrapper } from "./section-wrapper"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const capabilities = [
  {
    label: "Užduotys",
    title: "Klausimai, iššūkiai, scenarijai",
    body: "Atviro teksto, skaitinio atsakymo ir pasirinkimo užduotys. Tinka tiek individualiam, tiek komandiniam darbui.",
    accent: "primary",
  },
  {
    label: "Pamoka",
    title: "Aiški pamokos struktūra",
    body: "Įvadas, pagrindinės veiklos, diskusija, refleksija — vienoje vietoje. Užduotis lengvai perdėliojate pagal pamokos laiką.",
    accent: "secondary",
  },
  {
    label: "DI",
    title: "Dirbtinis intelektas — mokytojo pagalbininkas",
    body: "Dirbtinis intelektas siūlo užduočių idėjas pagal LT BUP. Galutinį turinį visada peržiūri ir patvirtina mokytojas.",
    accent: "highlight",
  },
  {
    label: "Realtime",
    title: "Pamokos eiga realiu laiku",
    body: "Komandų progresas, mokinių atsakymai ir sudėtingos vietos matomi iškart. Galite reaguoti per pamoką, o ne po jos.",
    accent: "accent",
  },
  {
    label: "Komandos",
    title: "Komandinis arba individualus darbas",
    body: "Mokiniai prisijungia per QR kodą — be paskyrų ar elektroninio pašto. Vienas kodas — visa klasė platformoje.",
    accent: "secondary",
  },
  {
    label: "Refleksija",
    title: "Pedagoginė pamokos analizė",
    body: "Po pamokos matote, kurios užduotys buvo sudėtingiausios ir kuriose temose mokiniams reikia papildomo paaiškinimo.",
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
          <span className="font-display italic text-steam-dark/70">esminės</span>{" "}
          galimybės.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mt-6 max-w-2xl leading-relaxed text-pretty">
          Visi pagrindiniai pamokos kūrimo įrankiai vienoje platformoje. Mokytojas
          paruošia ir veda pamoką savarankiškai, be papildomos technikos.
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
