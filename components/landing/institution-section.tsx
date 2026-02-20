"use client"

import { SectionWrapper } from "./section-wrapper"
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"

export function InstitutionSection() {
  return (
    <SectionWrapper background="muted">
      <div className="relative rounded-3xl overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <img
            src="/photos/steam-lab.jpg"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-steam-dark/90 via-steam-dark/80 to-steam-dark/70" />
        </div>

        <div className="relative p-8 sm:p-12 md:p-16">
          <div className="max-w-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl font-bold text-white leading-tight"
            >
              Klaipėdos universiteto STEAM atviros prieigos centras
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[15px] text-white/70 mt-4 leading-relaxed max-w-xl"
            >
              Klaipėdos universiteto metodinis STEAM centras — Baltijos jūros
              regiono tvarios mėlynosios ekonomikos sektoriaus augimą
              populiarinantis centras, kviečiantis moksleivius inovatyviai
              susipažinti su mokslo pagrindais penkių laboratorijų erdvėse.
            </motion.p>

            {/* Photos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex gap-3 mt-8"
            >
              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white/20">
                <img
                  src="/photos/steam-lab.jpg"
                  alt="STEAM centro laboratorija"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white/20">
                <img
                  src="/photos/steam-robot.jpg"
                  alt="Pepper robotas STEAM centre"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            {/* Contact details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-8 text-sm text-white/70"
            >
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Herkaus Manto g. 84, Klaipėda
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" />
                +370 (46) 398 978
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" />
                steam@ku.lt
              </span>
            </motion.div>

            <motion.a
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              href="https://www.ku.lt/steam"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mt-6"
            >
              Sužinoti daugiau apie centrą
              <ExternalLink className="h-3.5 w-3.5" />
            </motion.a>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
