"use client"

import { SectionWrapper } from "./section-wrapper"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const steps = [
  {
    number: "01",
    title: "Pasirinkite temą",
    description:
      "Dalykas, klasė, pamokos tipas — viskas iš LT bendrojo ugdymo programos. Sistema žino, ko galima tikėtis 3-oje klasėje ir ko — 11-oje.",
    accent: "primary",
  },
  {
    number: "02",
    title: "Kurkite užduotis",
    description:
      "Rašykite patys arba dirbtinis intelektas pasiūlys. Visada redaguojate, niekada nepasiduodate.",
    accent: "highlight",
  },
  {
    number: "03",
    title: "Sudėliokite pamokos eigą",
    description:
      "Įvadas → veiklos → diskusija → refleksija. Pritempkite, perkelkite, ištrinkite, kol jaučiasi tinkamai.",
    accent: "secondary",
  },
  {
    number: "04",
    title: "Mokiniai prisijungia",
    description:
      "QR kodas arba 6 simbolių slaptažodis. Be paskyrų, be el. pašto. Per 10 sekundžių nuo telefono iki pirmos užduoties.",
    accent: "accent",
  },
  {
    number: "05",
    title: "Stebėkite ir reaguokite",
    description:
      "Atsakymai matomi realiu laiku. Pristabdykite žaidimą, kai reikia paaiškinti. Pratęskite laiką, kai matote, kad neužteks.",
    accent: "primary",
  },
] as const

const ACCENT_COLOR: Record<string, { numeral: string; line: string; tick: string }> = {
  primary: {
    numeral: "text-primary/15",
    line: "bg-primary",
    tick: "bg-primary",
  },
  highlight: {
    numeral: "text-highlight/20",
    line: "bg-highlight",
    tick: "bg-highlight",
  },
  secondary: {
    numeral: "text-secondary/15",
    line: "bg-secondary",
    tick: "bg-secondary",
  },
  accent: {
    numeral: "text-accent/15",
    line: "bg-accent",
    tick: "bg-accent",
  },
}

export function HowItWorksSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white" id="how-it-works">
      {/* Editorial header */}
      <div className="max-w-3xl mb-20 md:mb-28">
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-flex h-px w-10 bg-steam-dark/40" />
          <span className="text-[11px] uppercase tracking-[0.22em] text-steam-dark/60 font-semibold">
            §1 · Eiga
          </span>
        </div>
        <h2 className="text-display-sm md:text-display-md text-steam-dark leading-[0.98] tracking-tight">
          Penki žingsniai{" "}
          <span className="font-display italic text-steam-dark/70">nuo idėjos</span>{" "}
          iki klasės.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mt-6 max-w-2xl leading-relaxed text-pretty">
          Nereikalauja IT specialisto. Nereikalauja papildomo mokymo. Vienas mokytojas,
          vienas vakaras, viena pamoka — pasiruošusi.
        </p>
      </div>

      {/* Steps — editorial timeline, asymmetric */}
      <ol className="relative space-y-12 md:space-y-16">
        {steps.map((step, index) => {
          const colors = ACCENT_COLOR[step.accent]
          const isEven = index % 2 === 0

          return (
            <motion.li
              key={step.number}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative grid md:grid-cols-12 gap-y-3 md:gap-x-8 items-start"
            >
              {/* Big numeral — display serif, takes 4 cols on md+ */}
              <div className={`md:col-span-4 ${isEven ? "md:order-1" : "md:order-2 md:text-right"}`}>
                <div
                  className={`numeral-display font-medium ${colors.numeral}`}
                  style={{ fontSize: "clamp(5rem, 12vw, 9rem)", lineHeight: "0.85" }}
                  aria-hidden
                >
                  {step.number}
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`h-px w-12 ${colors.line}`} />
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-steam-dark">
                    Žingsnis {step.number}
                  </span>
                </div>
              </div>

              {/* Content — 8 cols on md+ */}
              <div className={`md:col-span-8 ${isEven ? "md:order-2" : "md:order-1"}`}>
                <h3 className="text-2xl md:text-3xl font-bold text-steam-dark tracking-tight mb-3 text-balance">
                  {step.title}
                </h3>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl text-pretty">
                  {step.description}
                </p>
              </div>
            </motion.li>
          )
        })}
      </ol>
    </SectionWrapper>
  )
}
