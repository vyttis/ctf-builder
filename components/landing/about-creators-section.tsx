"use client"

import { SectionWrapper } from "./section-wrapper"
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import Image from "next/image"

const PHOTOS = [
  { src: "/photos/steam-lab.jpg", alt: "STEAM centro laboratorija", caption: "Laboratorija" },
  { src: "/photos/steam-robot.jpg", alt: "Pepper robotas", caption: "Pepper" },
  { src: "/photos/activity-vr.jpg", alt: "VR technologijos", caption: "VR / AR" },
] as const

export function AboutCreatorsSection() {
  const prefersReduced = useReducedMotion()

  return (
    <SectionWrapper background="white">
      {/* Editorial header */}
      <div className="max-w-3xl mb-14">
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-flex h-px w-10 bg-steam-dark/40" />
          <span className="text-[11px] uppercase tracking-[0.22em] text-steam-dark/60 font-semibold">
            §9 · Apie kūrėjus
          </span>
        </div>
        <motion.h2
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-display-sm md:text-display-md text-steam-dark leading-[0.98] tracking-tight"
        >
          Iš Klaipėdos —{" "}
          <span className="font-display italic text-steam-dark/70">visiems</span>.
        </motion.h2>
        <motion.p
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-base md:text-lg text-muted-foreground mt-6 max-w-2xl leading-relaxed text-pretty"
        >
          Klaipėdos universiteto STEAM metodinis centras dirba su mokytojais, mokiniais
          ir švietimo bendruomene jau šešerius metus. Šis įrankis — iš to darbo,
          ne iš startup&rsquo;o.
        </motion.p>
      </div>

      {/* Photo strip + contact, editorial composition */}
      <div className="grid lg:grid-cols-12 gap-y-10 lg:gap-x-10">
        {/* Photo strip */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="lg:col-span-7 grid grid-cols-3 gap-3"
        >
          {PHOTOS.map((photo, i) => (
            <figure key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-border/40 group">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 33vw, 240px"
              />
              <figcaption className="absolute bottom-3 left-3 text-[10px] uppercase tracking-wider text-white font-bold drop-shadow-sm">
                {photo.caption}
              </figcaption>
            </figure>
          ))}
        </motion.div>

        {/* Contact panel */}
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-5"
        >
          <dl className="space-y-6 border-l-2 border-steam-dark/15 pl-6">
            {[
              { icon: MapPin, label: "Vieta", value: "Herkaus Manto g. 84, Klaipėda" },
              { icon: Mail, label: "El. paštas", value: "steam@ku.lt", href: "mailto:steam@ku.lt" },
              { icon: Phone, label: "Telefonas", value: "+370 (46) 398 978", href: "tel:+37046398978" },
            ].map((item, i) => {
              const Icon = item.icon
              const content = (
                <div className="flex items-start gap-3">
                  <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 font-semibold mb-0.5">
                      {item.label}
                    </dt>
                    <dd className="text-sm md:text-base text-steam-dark font-medium">
                      {item.value}
                    </dd>
                  </div>
                </div>
              )
              return item.href ? (
                <a key={i} href={item.href} className="block hover:opacity-70 transition-opacity">
                  {content}
                </a>
              ) : (
                <div key={i}>{content}</div>
              )
            })}
          </dl>

          <a
            href="https://www.ku.lt/steam"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 mt-10 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sužinoti daugiau apie centrą
            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </motion.div>
      </div>
    </SectionWrapper>
  )
}
