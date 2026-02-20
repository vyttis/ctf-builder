"use client"

import { SectionWrapper } from "./section-wrapper"
import { SectionHeader } from "./section-header"
import { Pencil, Settings, QrCode, BarChart3, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

const steps = [
  {
    number: "01",
    icon: Pencil,
    title: "Sukuriate temą ir užduotis",
    description: "Pasirinkite pamokos temą ir sukurkite klausimus pagal savo dalyką.",
    color: "bg-primary/10 text-primary",
  },
  {
    number: "02",
    icon: Settings,
    title: "Nustatote atsakymus ir taškų sistemą",
    description: "Kiekvienai užduočiai priskiriate teisingą atsakymą ir taškus.",
    color: "bg-secondary/10 text-secondary",
  },
  {
    number: "03",
    icon: QrCode,
    title: "Pasidalinate QR kodu su mokiniais",
    description: "Mokiniai nuskaito kodą telefonu ir iškart prisijungia prie žaidimo.",
    color: "bg-highlight/10 text-highlight",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Stebite progresą realiu laiku",
    description: "Matote, kaip komandos sprendžia užduotis ir renkasi taškus.",
    color: "bg-accent/10 text-accent",
  },
]

export function HowItWorksSection() {
  return (
    <SectionWrapper background="white" id="how-it-works">
      <SectionHeader
        title="Keturi žingsniai iki interaktyvios pamokos"
        align="center"
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-4">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              className="relative"
            >
              {/* Connector arrow for desktop */}
              {index < steps.length - 1 && (
                <div className="hidden lg:flex absolute top-10 -right-2 z-10 text-border/60">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}

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
    </SectionWrapper>
  )
}
