"use client"

import { SteamLogo } from "@/components/steam-logo"
import { Mail, Phone, MapPin } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="py-12 md:py-16 border-t border-border/40 bg-white">
      <div className="container mx-auto px-5 max-w-[1200px]">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-flex hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
              <SteamLogo size="small" />
            </Link>
            <p className="text-xs text-muted-foreground/60 mt-3 leading-relaxed max-w-[200px]">
              Interaktyvių pamokų kūrimo įrankis partnerių mokykloms.
            </p>
          </div>

          {/* About */}
          <div>
            <h4 className="text-sm font-semibold text-steam-dark mb-4">
              Apie įrankį
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="text-sm text-muted-foreground/60 hover:text-steam-dark transition-colors"
                >
                  Kaip veikia
                </button>
              </li>
              <li>
                <button
                  onClick={() =>
                    document
                      .getElementById("access")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="text-sm text-muted-foreground/60 hover:text-steam-dark transition-colors"
                >
                  Kaip suteikiama prieiga
                </button>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="text-sm text-muted-foreground/60 hover:text-steam-dark transition-colors"
                >
                  Prisijungimas mokytojams
                </Link>
              </li>
            </ul>
          </div>

          {/* Institution */}
          <div>
            <h4 className="text-sm font-semibold text-steam-dark mb-4">
              Klaipėdos universitetas
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://www.ku.lt/steam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground/60 hover:text-steam-dark transition-colors"
                >
                  STEAM metodinis centras
                </a>
              </li>
              <li>
                <a
                  href="https://www.ku.lt"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground/60 hover:text-steam-dark transition-colors"
                >
                  Klaipėdos universitetas
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-steam-dark mb-4">
              Kontaktai
            </h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-muted-foreground/60">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <a
                  href="mailto:steam@ku.lt"
                  className="hover:text-steam-dark transition-colors"
                >
                  steam@ku.lt
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground/60">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>+370 (46) 398 978</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-muted-foreground/60">
                <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>Herkaus Manto g. 84, Klaipėda</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/50">
            &copy; {new Date().getFullYear()} Klaipėdos universiteto STEAM
            metodinis centras
          </p>
        </div>
      </div>
    </footer>
  )
}
