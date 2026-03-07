"use client"

import { SectionWrapper } from "./section-wrapper"
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"

export function InstitutionSection() {
  return (
    <SectionWrapper background="white">
      <div className="relative rounded-3xl overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00323C] via-[#004D5C] to-[#008CB4]" />

        <div className="relative p-8 sm:p-12 md:p-16">
          <div className="max-w-2xl">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl font-bold text-white leading-tight"
            >
              Sukurta Klaipėdos universitete
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[15px] text-white/70 mt-4 leading-relaxed max-w-xl"
            >
              Platforma kuriama Klaipėdos universiteto STEAM metodiniame centre.
              Centras dirba su mokytojais ir mokiniais, kurdamas bei testuodamas
              inovatyvius mokymo metodus.
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="text-[15px] text-white/70 mt-3 leading-relaxed max-w-xl"
            >
              Ši platforma yra viena iš priemonių, padedančių mokykloms
              taikyti aktyvaus mokymosi principus kasdienėse pamokose.
            </motion.p>

            {/* Activity photos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex gap-3 mt-8"
            >
              {[
                { src: "/photos/steam-lab.jpg", alt: "STEAM centro laboratorija" },
                { src: "/photos/steam-robot.jpg", alt: "Pepper robotas STEAM centre" },
                { src: "/photos/activity-vr.jpg", alt: "VR technologijos" },
                { src: "/photos/activity-teachers.jpg", alt: "Mokytojų veiklos" },
              ].map((photo, i) => (
                <div
                  key={i}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-white/20 shrink-0 group"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
              ))}
            </motion.div>

            {/* Contact */}
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
