"use client"

import { SteamLogo } from "@/components/steam-logo"
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-white border-t border-border/40">
      <div className="container mx-auto px-5 max-w-[1200px] py-16 md:py-20">
        {/* Top: oversized signature */}
        <div className="mb-16 md:mb-24">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-flex h-px w-10 bg-steam-dark/30" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-steam-dark/50 font-semibold">
              KU STEAM
            </span>
          </div>
          <p className="text-3xl md:text-5xl font-display italic text-steam-dark/85 leading-[1.1] max-w-3xl text-pretty">
            &bdquo;Mokomės kartu su mokytojais — tam, kad mokiniai mokytųsi kartu su mumis.&ldquo;
          </p>
        </div>

        {/* Bottom grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-12 gap-y-10 lg:gap-x-8 pt-10 border-t border-border/50">
          {/* Brand */}
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="inline-flex hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              <SteamLogo size="small" />
            </Link>
            <p className="text-sm text-muted-foreground/80 mt-4 leading-relaxed max-w-xs">
              Interaktyvių pamokų įrankis Klaipėdos universiteto STEAM metodinio centro
              partnerių mokyklų tinklui.
            </p>
          </div>

          {/* Navigate */}
          <div className="lg:col-span-2">
            <h4 className="text-[10px] uppercase tracking-[0.22em] font-bold text-steam-dark/60 mb-4">
              Apie įrankį
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() =>
                    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="text-sm text-steam-dark hover:text-primary transition-colors"
                >
                  Kaip veikia
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    document.getElementById("access")?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="text-sm text-steam-dark hover:text-primary transition-colors"
                >
                  Prieiga
                </button>
              </li>
              <li>
                <Link href="/auth/login" className="text-sm text-steam-dark hover:text-primary transition-colors">
                  Prisijungimas
                </Link>
              </li>
            </ul>
          </div>

          {/* Institution */}
          <div className="lg:col-span-3">
            <h4 className="text-[10px] uppercase tracking-[0.22em] font-bold text-steam-dark/60 mb-4">
              Institucija
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://www.ku.lt/steam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-sm text-steam-dark hover:text-primary transition-colors"
                >
                  STEAM metodinis centras
                  <ArrowUpRight className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.ku.lt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1.5 text-sm text-steam-dark hover:text-primary transition-colors"
                >
                  Klaipėdos universitetas
                  <ArrowUpRight className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h4 className="text-[10px] uppercase tracking-[0.22em] font-bold text-steam-dark/60 mb-4">
              Kontaktai
            </h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:steam@ku.lt"
                  className="flex items-center gap-2 text-sm text-steam-dark hover:text-primary transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                  steam@ku.lt
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                +370 (46) 398 978
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                Herkaus Manto g. 84
                <br />
                Klaipėda
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar — colophon */}
        <div className="pt-8 mt-12 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/70 font-mono">
            © {new Date().getFullYear()} Klaipėdos universitetas. Sukurta su rūpesčiu Klaipėdoje.
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-semibold">
            kusteam.app · v1.0
          </p>
        </div>
      </div>
    </footer>
  )
}
