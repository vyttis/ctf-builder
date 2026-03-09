"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { Pencil, Sparkles, Layout, Smartphone, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const steps = [
  {
    number: "01",
    icon: Pencil,
    title: "Tema ir veiklos tipas",
    description:
      "Pasirenkamas dalykas, tema, klasė ir veiklos formatas.",
    color: "bg-primary/10 text-primary",
    ring: "ring-primary/20",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Užduočių kūrimas",
    description:
      "Turinys kuriamas rankiniu būdu arba pasitelkiant DI pagalbą — abu variantai dera tarpusavyje.",
    color: "bg-highlight/10 text-highlight",
    ring: "ring-highlight/20",
  },
  {
    number: "03",
    icon: Layout,
    title: "Pamokos eiga",
    description:
      "Užduotys sudėliojamos į nuoseklią eigą ir koreguojamos pagal klasės poreikius.",
    color: "bg-secondary/10 text-secondary",
    ring: "ring-secondary/20",
  },
  {
    number: "04",
    icon: Smartphone,
    title: "Mokiniai jungiasi",
    description:
      "Per telefonus ar kompiuterius mokiniai jungiasi ir sprendžia užduotis — po vieną arba komandomis.",
    color: "bg-accent/10 text-accent",
    ring: "ring-accent/20",
  },
  {
    number: "05",
    icon: BarChart3,
    title: "Progresas ir rezultatai",
    description:
      "Visa eiga ir atsakymai matomi realiu laiku — galima reaguoti iš karto.",
    color: "bg-primary/10 text-primary",
    ring: "ring-primary/20",
  },
]

export function HowItWorksSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white" id="how-it-works">
      <SectionHeader
        title="Penki žingsniai iki pamokos"
        subtitle="Nuo temos pasirinkimo iki pamokos stebėjimo — per kelias minutes."
        align="center"
      />

      <div className="relative">
        {/* Connector line — desktop */}
        <div className="hidden lg:block absolute top-[34px] left-[10%] right-[10%] h-px bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20" />

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-5">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={index}
                initial={
                  prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }
                }
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.5,
                  ease: [0, 0, 0.2, 1],
                }}
                className="relative text-center"
              >
                <div className="relative inline-flex flex-col items-center">
                  <div
                    className={`w-[68px] h-[68px] rounded-2xl ${step.color} ring-4 ${step.ring} flex items-center justify-center mx-auto mb-5 relative bg-white`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-steam-dark text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                      {step.number}
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold text-steam-dark text-[15px] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px] mx-auto">
                  {step.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </SectionWrapper>
  )
}
