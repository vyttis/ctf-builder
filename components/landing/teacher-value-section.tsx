"use client"

import { SectionWrapper } from "./section-wrapper"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const stats = [
  {
    metric: "20 min",
    label: "Pasiruošimas pamokai",
    detail: "Vietoj dviejų valandų prie kompiuterio. Šeštadienio vakaras lieka šeimai.",
  },
  {
    metric: "0",
    label: "Mokinių paskyrų",
    detail: "Niekas neregistruojasi, neprisimena slaptažodžių. QR kodas — ir klasė viduje.",
  },
  {
    metric: "100%",
    label: "Mokytojo kontrolė",
    detail: "Dirbtinis intelektas siūlo, jūs pasirenkate. Niekada nieko nepateikiama be jūsų patvirtinimo.",
  },
  {
    metric: "Visa",
    label: "Klasės eiga matoma",
    detail: "Realiu laiku — kas užstrigo, kas pasiekė, kuri komanda artėja prie pabaigos.",
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
          <span className="font-display italic text-steam-dark/70">apčiuopiami</span>{" "}
          dalykai.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground mt-6 max-w-2xl leading-relaxed text-pretty">
          Ne pažadai, ne marketingo blizgesys — konkretūs skaičiai ir konkretūs minutės.
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
