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
      "Mokytojas pasirenka dalyką, temą, klasę ar planuojamą veiklos formatą.",
    color: "bg-primary/10 text-primary",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Užduočių kūrimas",
    description:
      "Mokytojas kuria turinį rankiniu būdu arba pasitelkia dirbtinio intelekto pagalbą.",
    color: "bg-highlight/10 text-highlight",
  },
  {
    number: "03",
    icon: Layout,
    title: "Pamokos eiga",
    description:
      "Užduotys išdėstomos į nuoseklią struktūrą, kurią galima koreguoti pagal klasės poreikius.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    number: "04",
    icon: Smartphone,
    title: "Mokiniai jungiasi",
    description:
      "Mokiniai prisijungia naudodami telefonus ar kompiuterius ir sprendžia užduotis individualiai arba komandomis.",
    color: "bg-accent/10 text-accent",
  },
  {
    number: "05",
    icon: BarChart3,
    title: "Progresas ir rezultatai",
    description:
      "Pamokos eiga ir atsakymai matomi realiu laiku, todėl mokytojas gali greitai reaguoti.",
    color: "bg-primary/10 text-primary",
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
        d="M 100 55 C 160 55, 160 55, 300 55 C 340 55, 340 55, 500 55 C 540 55, 540 55, 700 55 C 740 55, 740 55, 900 55"
        stroke="url(#connectorGrad)"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      {[200, 400, 600, 800].map((cx) => (
        <circle
          key={cx}
          cx={cx}
          cy={55}
          r={3}
          fill="hsl(195 100% 35% / 0.2)"
        />
      ))}
    </svg>
  )
}

export function HowItWorksSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="muted" id="how-it-works">
      <SectionHeader
        title="Kaip veikia platforma"
        subtitle="Nuo temos pasirinkimo iki pamokos stebėjimo — per kelias minutes."
        align="center"
      />

      <div className="relative">
        <StepConnectorSVG />
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-3">
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
                  duration: 0.8,
                  ease: [0, 0, 0.2, 1],
                }}
                className="relative"
              >
                <div className="text-center p-4 md:p-3 rounded-2xl hover:bg-white/60 transition-colors">
                  <div
                    className={`w-14 h-14 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4 relative`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-steam-dark text-white text-[10px] font-bold flex items-center justify-center">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="font-semibold text-steam-dark text-[14px] mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[190px] mx-auto">
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
