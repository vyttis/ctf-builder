"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Mail, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export function FinalCtaSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="py-20 md:py-24 bg-white"
    >
      <div className="container mx-auto px-5 max-w-[1140px]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-steam-dark via-steam-dark to-[#004D55] rounded-3xl p-8 sm:p-12 md:p-16 text-white relative overflow-hidden">
            {/* Animated glow accents */}
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-20 -right-20 w-64 h-64 bg-primary rounded-full blur-3xl"
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-20 -left-20 w-56 h-56 bg-secondary rounded-full blur-3xl"
            />

            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-6"
              >
                <Sparkles className="h-6 w-6 text-primary" />
              </motion.div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
                Prisijunkite prie STEAM bendruomenės platformos
              </h2>
              <p className="text-white/60 text-[15px] mb-8 max-w-md mx-auto leading-relaxed">
                Jei dalyvavote STEAM centro veiklose, galite prisijungti ir
                pradėti kurti interaktyvias pamokas.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/30 gap-2 h-12 text-sm px-8 font-semibold"
                  >
                    Prisijungti
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="mailto:steam@ku.lt">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-transparent border border-white/20 text-white hover:bg-white/10 gap-2 h-12 text-sm px-8"
                  >
                    <Mail className="h-4 w-4" />
                    Susisiekti su centru
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
