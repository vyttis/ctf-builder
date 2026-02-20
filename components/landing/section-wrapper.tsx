"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

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
  const bgClasses = {
    white: "bg-white",
    muted: "bg-[#F8FAFB]",
    dark: "bg-steam-dark text-white",
  }

  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn("py-20 md:py-24", bgClasses[background], className)}
    >
      <div className="container mx-auto px-5 max-w-[1140px]">
        {children}
      </div>
    </motion.section>
  )
}
