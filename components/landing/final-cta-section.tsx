"use client"

import { Button } from "@/components/ui/button"
import { Mail, Handshake } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

export function FinalCtaSection() {
  const prefersReduced = useReducedMotion()

  return (
    <motion.section
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="py-20 md:py-24 bg-muted"
    >
      <div className="container mx-auto px-5 max-w-[1140px]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-3xl p-8 sm:p-12 md:p-16 text-white relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-steam-dark via-steam-teal to-steam-blue" />

            {/* Glow accents */}
            <motion.div
              animate={
                prefersReduced
                  ? {}
                  : {
                      scale: [1, 1.2, 1],
                      opacity: [0.15, 0.25, 0.15],
                    }
              }
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -top-20 -right-20 w-64 h-64 bg-primary rounded-full blur-3xl"
              style={{ opacity: 0.15 }}
            />
            <motion.div
              animate={
                prefersReduced
                  ? {}
                  : {
                      scale: [1, 1.15, 1],
                      opacity: [0.1, 0.2, 0.1],
                    }
              }
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
              className="absolute -bottom-20 -left-20 w-56 h-56 bg-secondary rounded-full blur-3xl"
              style={{ opacity: 0.1 }}
            />

            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
                Domina daugiau informacijos?
              </h2>
              <p className="text-white/60 text-[15px] mb-8 max-w-md mx-auto leading-relaxed">
                Jeigu norite sužinoti daugiau apie platformą, partnerystės
                galimybes ar mokytojų mokymus, susisiekite su Klaipėdos
                universiteto STEAM metodiniu centru.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href="mailto:steam@ku.lt">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 gap-2 h-12 text-sm px-8 font-semibold"
                  >
                    <Mail className="h-4 w-4" />
                    Susisiekti su STEAM centru
                  </Button>
                </a>
                <a href="mailto:steam@ku.lt?subject=Domina%20partneryst%C4%97">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-transparent border border-white/20 text-white hover:bg-white/10 gap-2 h-12 text-sm px-8"
                  >
                    <Handshake className="h-4 w-4" />
                    Domina partnerystė
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
