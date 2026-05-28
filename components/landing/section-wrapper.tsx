"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface SectionWrapperProps {
  children: React.ReactNode
  className?: string
  id?: string
  background?: "white" | "muted" | "dark" | "paper"
  size?: "default" | "wide"
}

export function SectionWrapper({
  children,
  className,
  id,
  background = "white",
  size = "default",
}: SectionWrapperProps) {
  const prefersReduced = useReducedMotion()

  const bgClasses = {
    white: "bg-white",
    muted: "bg-muted/40",
    dark: "bg-steam-dark text-white",
    paper: "bg-[#FAFAF7] relative",
  }

  return (
    <motion.section
      id={id}
      initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={cn("py-20 md:py-32", bgClasses[background], className)}
    >
      <div className={cn("container mx-auto px-5", size === "wide" ? "max-w-[1320px]" : "max-w-[1200px]")}>
        {children}
      </div>
    </motion.section>
  )
}
