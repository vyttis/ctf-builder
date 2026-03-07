"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { Pencil, Settings, QrCode, BarChart3 } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const steps = [
  {
    number: "01",
    icon: Pencil,
    title: "Sukurkite žaidimą ir pridėkite užduotis",
    description: "Pasirinkite pamokos temą, pridėkite iššūkius ir leiskite DI sugeneruoti užduotis už jus.",
    color: "bg-primary/10 text-primary",
  },
  {
    number: "02",
    icon: Settings,
    title: "Nustatykite atsakymus, taškus ir užuominas",
    description: "Kiekvienai užduočiai priskiriate teisingą atsakymą, taškus ir progresinias užuominas.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    number: "03",
    icon: QrCode,
    title: "Pasidalinkite QR kodu su mokiniais",
    description: "Mokiniai nuskaito kodą telefonu ir per sekundes prisijungia prie žaidimo.",
    color: "bg-highlight/10 text-highlight",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Stebėkite progresą ir rezultatus realiu laiku",
    description: "Matote, kaip komandos sprendžia užduotis, renkasi taškus ir naudoja užuominas.",
    color: "bg-accent/10 text-accent",
  },
]

function StepConnectorSVG() {
  return (
    <svg
      className="hidden lg:block absolute top-0 left-0 w-full h-full pointer-events-none"
      viewBox="0 0 1000 120"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="connectorGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="hsl(160 100% 41% / 0.15)" />
          <stop offset="50%" stopColor="hsl(195 100% 35% / 0.15)" />
          <stop offset="100%" stopColor="hsl(348 95% 57% / 0.15)" />
        </linearGradient>
      </defs>
      <path
        d="M 125 55 C 200 55, 200 55, 375 55 C 450 55, 450 55, 625 55 C 700 55, 700 55, 875 55"
        stroke="url(#connectorGrad)"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      {/* Dots at connection points */}
      {[250, 500, 750].map((cx) => (
        <circle key={cx} cx={cx} cy={55} r={3} fill="hsl(195 100% 35% / 0.2)" />
      ))}
    </svg>
  )
}

export function HowItWorksSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white" id="how-it-works">
      <SectionHeader
        title="Nuo idėjos iki pamokos — per 10 minučių"
        align="center"
      />

      <div className="relative">
        <StepConnectorSVG />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={index}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12, duration: 0.8, ease: [0, 0, 0.2, 1] }}
                className="relative"
              >
                <div className="text-center p-4 md:p-5 rounded-2xl hover:bg-[#F8FAFB] transition-colors">
                  <div className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4 relative`}>
                    <Icon className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-steam-dark text-white text-[10px] font-bold flex items-center justify-center">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="font-semibold text-steam-dark text-[15px] mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px] mx-auto">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </SectionWrapper>
  )
}
