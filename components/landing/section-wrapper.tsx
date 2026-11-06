import { cn } from "@/lib/utils"

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
  const bgClasses = {
    white: "bg-white",
    muted: "bg-muted/40",
    dark: "bg-steam-dark text-white",
    paper: "bg-[#FAFAF7] relative",
  }

  return (
    <section
      id={id}
      className={cn("reveal py-20 md:py-32", bgClasses[background], className)}
    >
      <div className={cn("container mx-auto px-5", size === "wide" ? "max-w-[1320px]" : "max-w-[1200px]")}>
        {children}
      </div>
    </section>
  )
}
