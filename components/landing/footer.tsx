import { SteamLogo } from "@/components/steam-logo"

export function Footer() {
  return (
    <footer className="py-8 border-t border-border/40 bg-white">
      <div className="container mx-auto px-5 max-w-[1140px]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <SteamLogo size="small" />
          <p className="text-xs text-muted-foreground/60">
            &copy; {new Date().getFullYear()} Klaipėdos universiteto STEAM
            centras
          </p>
        </div>
      </div>
    </footer>
  )
}
