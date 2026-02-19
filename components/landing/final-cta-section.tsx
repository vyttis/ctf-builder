import { Button } from "@/components/ui/button"
import { ArrowRight, Mail } from "lucide-react"
import Link from "next/link"

export function FinalCtaSection() {
  return (
    <section className="py-20 md:py-24 bg-white">
      <div className="container mx-auto px-5 max-w-[1140px]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-steam-dark to-steam-dark/95 rounded-2xl p-8 sm:p-12 text-white relative overflow-hidden">
            {/* Subtle glow accents */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/15 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-secondary/10 rounded-full blur-3xl" />

            <div className="relative">
              <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">
                Prisijunkite prie STEAM bendruomenės platformos
              </h2>
              <p className="text-white/60 text-[15px] mb-8 max-w-md mx-auto leading-relaxed">
                Jei dalyvavote STEAM centro veiklose, galite prisijungti ir
                pradėti kurti interaktyvias pamokas.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 gap-2 h-11 text-sm px-7 font-semibold"
                  >
                    Prisijungti
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="mailto:steam@ku.lt">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-transparent border border-white/20 text-white hover:bg-white/10 gap-2 h-11 text-sm px-7"
                  >
                    <Mail className="h-4 w-4" />
                    Susisiekti su centru
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
