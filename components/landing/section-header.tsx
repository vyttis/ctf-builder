import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  subtitle?: string
  align?: "left" | "center"
  className?: string
}

export function SectionHeader({
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-10 md:mb-14",
        align === "center" && "text-center",
        className
      )}
    >
      <h2 className="text-2xl sm:text-3xl md:text-[36px] font-bold text-steam-dark leading-tight tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "text-muted-foreground mt-3 max-w-2xl leading-relaxed text-[15px] md:text-base",
            align === "center" && "mx-auto"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
