"use client"

import { SectionWrapper } from "./section-wrapper"
import { Flag, Users, BarChart3, Puzzle } from "lucide-react"
import { motion } from "framer-motion"

const features = [
  {
    icon: Puzzle,
    text: "Užduotys pateikiamos kaip iššūkiai",
  },
  {
    icon: Flag,
    text: `Atsakymas \u2014 \u201Eflag\u201C, kur\u012F reikia surasti`,
  },
  {
    icon: Users,
    text: "Galima dirbti komandomis",
  },
  {
    icon: BarChart3,
    text: "Rezultatai matomi realiu laiku",
  },
]

export function CtfExplanationSection() {
  return (
    <SectionWrapper background="muted">
      <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
        {/* Left — text */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-steam-dark leading-tight mb-4">
            CTF — struktūruotas iššūkis mokymuisi
          </h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-8">
            CTF (Capture The Flag) — tai problemų sprendimo metodas, kai mokiniai
            sprendžia temines užduotis ir už teisingus atsakymus gauna taškus.
            Edukacijoje tai tampa aiškiai struktūruotu, komandiniu mokymosi
            formatu.
          </p>

          <div className="space-y-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="flex items-center gap-3.5"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-steam-dark leading-relaxed">
                    {feature.text}
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Right — illustration photo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="rounded-2xl overflow-hidden shadow-xl shadow-steam-dark/5">
            <img
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=700&h=500&fit=crop"
              alt="Komandinis darbas klasėje"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Decorative accent */}
          <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-primary/10 rounded-2xl -z-10" />
          <div className="absolute -top-3 -left-3 w-16 h-16 bg-secondary/10 rounded-xl -z-10" />
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
