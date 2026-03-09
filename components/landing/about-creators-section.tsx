"use client"

import { SectionWrapper } from "./section-wrapper"
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export function AboutCreatorsSection() {
  return (
    <SectionWrapper background="white">
      <div className="relative rounded-2xl overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-steam-dark via-steam-teal to-steam-blue" />
        {/* Subtle texture */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(0,210,150,0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(0,140,180,0.08),transparent_50%)]" />

        <div className="relative grid lg:grid-cols-[1fr_300px] gap-8">
          <div className="p-8 sm:p-12 md:p-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl md:text-[36px] font-bold text-white leading-tight tracking-tight"
            >
              Sukurta Klaipėdos universiteto STEAM metodiniame centre
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[15px] text-white/60 mt-4 leading-relaxed max-w-xl"
            >
              Centras dirba su mokytojais, mokiniais ir švietimo bendruomene,
              siekdamas kurti ir taikyti inovatyvius mokymo metodus. Platforma
              vystoma kaip realus įrankis, pritaikytas mokyklų poreikiams.
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
                {
                  src: "/photos/steam-lab.jpg",
                  alt: "STEAM centro laboratorija",
                },
                {
                  src: "/photos/steam-robot.jpg",
                  alt: "Pepper robotas STEAM centre",
                },
                {
                  src: "/photos/activity-vr.jpg",
                  alt: "VR technologijos",
                },
              ].map((photo, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-white/15 shrink-0 group"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="96px"
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
              className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-8 text-sm text-white/60"
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

          {/* Right — decorative image strip, hidden on mobile */}
          <div className="relative hidden lg:block">
            <Image
              src="/photos/classroom-lecture.jpg"
              alt="STEAM centro veikla"
              fill
              className="object-cover opacity-40"
              sizes="300px"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-steam-dark/80" />
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
