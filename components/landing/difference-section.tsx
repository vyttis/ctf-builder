"use client"

import { SectionWrapper } from "./section-wrapper"
import { Check, X } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const rows = [
  {
    label: "Formatas",
    quiz: "Greiti klausimai su laikmačiu",
    platform: "Struktūruota pamoka su lanksčia eiga",
  },
  {
    label: "Darbo būdas",
    quiz: "Individualus žaidimas",
    platform: "Komandinis darbas ir bendradarbiavimas",
  },
  {
    label: "Atsakymai",
    quiz: "Tik pasirinkimas iš variantų",
    platform: "Tekstas, skaičius arba pasirinkimas",
  },
  {
    label: "Užuominos",
    quiz: "Neteikiamos",
    platform: "Progresinės užuominos su taškų sistema",
  },
  {
    label: "Stebėjimas",
    quiz: "Rezultatai matomi po pabaigos",
    platform: "Eiga matoma realiu laiku per pamoką",
  },
  {
    label: "Užduočių kūrimas",
    quiz: "Visi klausimai rašomi ranka",
    platform: "Dirbtinis intelektas teikia siūlymus mokytojui",
  },
] as const

export function DifferenceSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      {/* Editorial header */}
      <div className="max-w-3xl mb-16">
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-flex h-px w-10 bg-accent" />
          <span className="text-[11px] uppercase tracking-[0.22em] text-accent font-semibold">
            §7 · Skirtumas
          </span>
        </div>
        <h2 className="text-display-sm md:text-display-md text-steam-dark leading-[0.98] tracking-tight">
          Daugiau{" "}
          <span className="font-display italic text-steam-dark/70">nei testų</span>{" "}
          programa.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mt-6 max-w-2xl leading-relaxed text-pretty">
          Testų įrankiai pateikia klausimus ir surenka atsakymus. Šis įrankis padeda
          sukurti visą pamoką — su aiškia struktūra, komandiniu darbu ir refleksija.
        </p>
      </div>

      {/* Comparison table — editorial, two-column with vs. */}
      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="grid md:grid-cols-2 gap-px bg-border/60 rounded-2xl overflow-hidden border border-border/60 max-w-5xl"
      >
        {/* Quiz column */}
        <div className="bg-muted/30 p-8 md:p-10">
          <div className="flex items-center gap-2 mb-1">
            <X className="h-4 w-4 text-muted-foreground" strokeWidth={2.5} />
            <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted-foreground">
              Testų įrankis
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-display italic text-muted-foreground/80 leading-tight mb-7">
            Surenka atsakymus
          </h3>
          <dl className="space-y-4">
            {rows.map((row) => (
              <div key={row.label} className="border-t border-border/40 pt-3">
                <dt className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold mb-1">
                  {row.label}
                </dt>
                <dd className="text-sm text-muted-foreground leading-snug">
                  {row.quiz}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Platform column */}
        <div className="bg-primary/[0.03] p-8 md:p-10 relative">
          <div className="absolute top-8 right-8 md:right-10 numeral-display font-display italic text-5xl text-primary/15">
            vs.
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
            <span className="text-[11px] uppercase tracking-[0.18em] font-bold text-primary">
              Šis įrankis
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-steam-dark leading-tight mb-7">
            Padeda sukurti pamoką
          </h3>
          <dl className="space-y-4">
            {rows.map((row) => (
              <div key={row.label} className="border-t border-primary/15 pt-3">
                <dt className="text-[10px] uppercase tracking-wider text-primary/80 font-bold mb-1">
                  {row.label}
                </dt>
                <dd className="text-sm font-medium text-steam-dark leading-snug">
                  {row.platform}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </motion.div>
    </SectionWrapper>
  )
}
