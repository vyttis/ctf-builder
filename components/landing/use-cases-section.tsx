"use client"

import { SectionWrapper } from "./section-wrapper"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import Image from "next/image"

const useCases = [
  {
    when: "Pamokos pradžioje",
    what: "Žinių patikrinimas",
    body: "Trumpa užduotis padės įvertinti, ar klasė pasiruošusi naujai temai, ar reikia pakartoti ankstesnę medžiagą.",
  },
  {
    when: "Pagrindinė pamoka",
    what: "Komandinė veikla",
    body: "Mokiniai dirba komandose, diskutuoja ir sprendžia užduotis kartu. Mokytojas mato kiekvienos komandos eigą realiu laiku.",
  },
  {
    when: "Projektinė veikla",
    what: "Tyrimo užduotys",
    body: "Etapinė užduotis, kuria mokiniai analizuoja informaciją, kelia hipotezes ir formuluoja išvadas pagal pateiktus duomenis.",
  },
  {
    when: "Integruota pamoka",
    what: "STEAM veikla",
    body: "Du dalykai jungiami į vieną pamoką (pvz., matematika ir fizika) — užduotys kuria natūralų ryšį tarp temų.",
  },
  {
    when: "Kartojimo pamoka",
    what: "Pasiekimų peržiūra",
    body: "Įvairios užduotys padeda mokiniams patiems įvertinti, ką jau supranta, o ką dar reikia pakartoti prieš pasiekimų patikrinimą.",
  },
] as const

export function UseCasesSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      <div className="grid lg:grid-cols-12 gap-y-14 lg:gap-x-12 items-start">
        {/* Left — image with caption */}
        <motion.figure
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-5 lg:sticky lg:top-24"
        >
          <div className="relative rounded-xl overflow-hidden shadow-xl shadow-steam-dark/10 border border-border/30 aspect-[4/5]">
            <Image
              src="/photos/classroom-hands.jpg"
              alt="Mokiniai aktyviai dalyvauja pamokoje"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 480px"
            />
          </div>
          <figcaption className="mt-4 flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
            <span className="numeral-display text-[10px] uppercase tracking-wider text-primary font-semibold shrink-0 mt-0.5">
              Pav. 02
            </span>
            <span>
              Mokiniai sprendžia užduotis komandose pamokoje.
            </span>
          </figcaption>
        </motion.figure>

        {/* Right — narrative use cases */}
        <div className="lg:col-span-7">
          {/* Editorial header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-5">
              <span className="inline-flex h-px w-10 bg-primary" />
              <span className="text-[11px] uppercase tracking-[0.22em] text-primary font-semibold">
                §5 · Pavyzdžiai
              </span>
            </div>
            <h2 className="text-display-sm text-steam-dark leading-[0.98] tracking-tight">
              Penkios{" "}
              <span className="font-display italic text-steam-dark/70">pamokos</span>{" "}
              situacijos.
            </h2>
          </div>

          <div className="space-y-px bg-border/60 border-y border-border/60">
            {useCases.map((item, index) => (
              <motion.article
                key={index}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07, duration: 0.45 }}
                className="grid grid-cols-[auto_1fr] gap-6 bg-white p-6 transition-colors hover:bg-muted/30"
              >
                <div className="text-right shrink-0">
                  <div className="numeral-display font-medium text-xl text-steam-dark/30 tabular-nums">
                    0{index + 1}
                  </div>
                  <div className="font-display italic text-sm text-secondary mt-1 leading-tight whitespace-nowrap">
                    {item.when}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-steam-dark tracking-tight leading-tight mb-2 text-balance">
                    {item.what}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-pretty">
                    {item.body}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
