"use client"

import { SteamLogo } from "@/components/steam-logo"
import { Button } from "@/components/ui/button"
import { ArrowRight, ArrowDown, Lock, GraduationCap, UserX } from "lucide-react"
import Link from "next/link"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-[#F8FAFB] to-white" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary/[0.03] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative container mx-auto px-5 max-w-[1140px]">
        {/* Navigation */}
        <nav className="flex items-center justify-between py-5">
          <SteamLogo />
          <Link href="/auth/login">
            <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm h-9 px-5 text-sm">
              Prisijungti
            </Button>
          </Link>
        </nav>

        {/* Hero content */}
        <div className="pt-16 pb-20 md:pt-24 md:pb-28 max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold text-steam-dark leading-[1.15] tracking-tight">
            Interaktyvių STEAM pamokų{" "}
            <span className="text-transparent bg-clip-text gradient-primary">
              kūrimo platforma
            </span>
          </h1>

          <p className="text-[15px] text-muted-foreground mt-5 leading-relaxed max-w-lg mx-auto">
            Skirta Klaipėdos universiteto metodinio STEAM centro
            bendruomenės mokytojams.
          </p>

          <p className="text-sm text-muted-foreground/80 mt-3 leading-relaxed max-w-xl mx-auto">
            CTF formatas leidžia pamoką paversti struktūruotu komandiniu
            iššūkiu, kuriame mokiniai aktyviai sprendžia užduotis,
            bendradarbiauja ir mokosi per patirtį.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
            <Link href="/auth/login">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/15 gap-2 h-12 text-sm px-7 font-semibold"
              >
                Prisijungti prie platformos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto gap-2 h-12 text-sm px-7 border-border/60"
              onClick={() => {
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
              }}
            >
              <ArrowDown className="h-4 w-4" />
              Sužinoti, kaip tai veikia
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-xs text-muted-foreground/70">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Prieiga tik STEAM centro dalyviams
            </span>
            <span className="flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" />
              Nemokama mokykloms
            </span>
            <span className="flex items-center gap-1.5">
              <UserX className="h-3.5 w-3.5" />
              Be registracijos mokiniams
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
