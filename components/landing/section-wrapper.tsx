import { cn } from "@/lib/utils"

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
    <section id={id} className={cn("py-20 md:py-24", bgClasses[background], className)}>
      <div className="container mx-auto px-5 max-w-[1140px]">
        {children}
      </div>
    </section>
  )
}
