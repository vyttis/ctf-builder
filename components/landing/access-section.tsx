"use client"

import { SectionWrapper } from "./section-wrapper"
import { Handshake, GraduationCap, KeyRound, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const steps = [
  {
    number: "01",
    icon: Handshake,
    title: "Bendradarbiavimas su STEAM centru",
    description:
      "Prieiga teikiama mokykloms, kurios bendradarbiauja su Klaipėdos universiteto STEAM centru.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    number: "02",
    icon: GraduationCap,
    title: "Dalyvavimas mokymuose ir dirbtuvėse",
    description:
      "Prieš pradedant dirbti, mokytojai susipažįsta su įrankiu praktiniuose mokymuose ir dirbtuvėse.",
    color: "bg-primary/10 text-primary",
  },
  {
    number: "03",
    icon: KeyRound,
    title: "Prieigos suteikimas",
    description:
      "Po mokymų mokytojams suteikiama asmeninė prieiga ir galimybė kurti veiklas savarankiškai.",
    color: "bg-highlight/10 text-highlight",
  },
]

export function AccessSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted" id="access">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left — steps */}
        <div>
          <motion.span
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-semibold text-highlight uppercase tracking-widest mb-3"
          >
            Prieiga
          </motion.span>
          <motion.h2
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-[36px] font-bold text-steam-dark leading-tight tracking-tight mb-10"
          >
            Kaip gauti prieigą
          </motion.h2>

          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={index}
                  initial={
                    prefersReduced ? { opacity: 1 } : { opacity: 0, x: -20 }
                  }
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.5 }}
                  className="flex gap-5 items-start"
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-steam-dark text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                      {step.number}
                    </span>
                    {index < steps.length - 1 && (
                      <div className="absolute top-14 left-1/2 -translate-x-1/2 w-px h-8 bg-border/40" />
                    )}
                  </div>
                  <div className="pt-1">
                    <h3 className="font-semibold text-steam-dark text-base mb-1.5">
                      {step.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Right — contact card */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="p-8 md:p-10 rounded-2xl bg-white border border-border/50 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mb-6">
              <Mail className="h-6 w-6 text-secondary" />
            </div>
            <h3 className="text-lg font-bold text-steam-dark mb-3">
              Norite pradėti?
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Jeigu jūsų mokykla nori prisijungti prie partnerių tinklo arba
              tiesiog norite sužinoti daugiau — parašykite STEAM centrui.
            </p>
            <a href="mailto:steam@ku.lt">
              <Button
                className="gap-2 bg-secondary hover:bg-secondary/90 text-white shadow-sm"
              >
                <Mail className="h-4 w-4" />
                Susisiekti su STEAM centru
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
