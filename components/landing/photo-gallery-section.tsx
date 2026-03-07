"use client"

import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

const photos = [
  {
    src: "/photos/activity-beavers.jpg",
    alt: "STEAM centro maskotai prie kompiuterių",
    span: "col-span-2 row-span-2",
  },
  {
    src: "/photos/activity-vr.jpg",
    alt: "VR technologijos STEAM centre",
    span: "col-span-1 row-span-1",
  },
  {
    src: "/photos/classroom-lecture.jpg",
    alt: "Interaktyvi paskaita universitete",
    span: "col-span-1 row-span-1",
  },
  {
    src: "/photos/activity-students.jpg",
    alt: "Moksleiviai sprendžia komandines užduotis",
    span: "col-span-1 row-span-1",
  },
  {
    src: "/photos/activity-teachers.jpg",
    alt: "Mokytojai bendradarbiauja STEAM veikloje",
    span: "col-span-1 row-span-1",
  },
  {
    src: "/photos/steam-building.jpg",
    alt: "STEAM Klaipėda centras",
    span: "col-span-2 row-span-1",
  },
]

export function PhotoGallerySection() {
  const prefersReduced = useReducedMotion()

  return (
    <section className="py-16 md:py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-5 max-w-[1140px]">
        <motion.div
          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-steam-dark leading-tight">
            Iš mūsų veiklų
          </h2>
          <p className="text-muted-foreground mt-2 text-[15px]">
            STEAM centro laboratorijose mokiniai ir mokytojai mokosi kartu
          </p>
        </motion.div>

        {/* Masonry-style bento grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[180px]">
          {photos.map((photo, index) => (
            <motion.div
              key={index}
              initial={
                prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.95 }
              }
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
              whileHover={
                prefersReduced
                  ? {}
                  : { scale: 1.02, transition: { duration: 0.2 } }
              }
              className={`${photo.span} rounded-2xl overflow-hidden relative group cursor-default`}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-steam-dark/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <p className="text-white text-xs font-medium drop-shadow-lg">
                  {photo.alt}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
