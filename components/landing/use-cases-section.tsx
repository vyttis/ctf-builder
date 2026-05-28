"use client"

import { SectionWrapper } from "./section-wrapper"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import Image from "next/image"

const useCases = [
  {
    when: "Pirmadienio rytą",
    what: "Greitas žinių patikrinimas",
    body: "5 minučių užduotis — ar klasė suprato penktadienio temą. Atsakymai akimirksniu, žinote, ar vesti naują temą, ar grįžti.",
  },
  {
    when: "Visą pamoką",
    what: "Komandinis iššūkis",
    body: "5 komandos × 6 užduotys × 45 minutės. Mokiniai diskutuoja, ginčijasi, bendradarbiauja. Mokytojas mato kiekvieną žingsnį.",
  },
  {
    when: "Projektinę savaitę",
    what: "Tyrimo scenarijus",
    body: "Etapinė užduotis — mokiniai analizuoja, ieško informacijos, formuluoja išvadas. Kaip pirmieji moksliniai tyrimai mokykloje.",
  },
  {
    when: "STEAM dieną",
    what: "Integruota veikla",
    body: "Matematika su biologija. Fizika su technologijomis. Du dalykai jungiasi natūraliai — kaip realiame pasaulyje.",
  },
  {
    when: "Prieš atostogas",
    what: "Pasiekimų peržiūra",
    body: "Mažas turnyras klasėje. Pasitikrina, kas išmokta. Atostogos prasideda su žaidimu, ne stresu.",
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
              <span className="font-display italic">&bdquo;Kai mokinys spaudžia atsakymą, mokytojas nustoja vesti monologą.&ldquo;</span>
              {" "}— V. Bagdonienė, 7-os kl. matematika
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
              <span className="font-display italic text-steam-dark/70">tikros</span>{" "}
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
