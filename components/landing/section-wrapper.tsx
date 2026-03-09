"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface SectionWrapperProps {
  children: React.ReactNode
  className?: string
  id?: string
  background?: "white" | "muted" | "dark"
}

export function SectionWrapper({
  children,
  className,
  id,
  background = "white",
}: SectionWrapperProps) {
  const prefersReduced = useReducedMotion()

  const bgClasses = {
    white: "bg-white",
    muted: "bg-muted",
    dark: "bg-steam-dark text-white",
  }

  return (
    <motion.section
      id={id}
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn("py-14 md:py-[4.5rem]", bgClasses[background], className)}
    >
      <div className="container mx-auto px-5 max-w-[1140px]">
        {children}
      </div>
    </motion.section>
  )
}
