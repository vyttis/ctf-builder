import { SteamLogo } from "@/components/steam-logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Gamepad2,
  QrCode,
  Zap,
  Users,
  Trophy,
  ArrowRight,
  Clock,
  Shield,
  Sparkles,
  Waves,
  Bot,
  FlaskConical,
  Monitor,
  Cog,
  MapPin,
  Phone,
  Mail,
} from "lucide-react"
import Link from "next/link"

const features = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Greitas kūrimas",
    description: "Sukurkite CTF žaidimą per 20 minučių su paruoštais šablonais",
    color: "text-primary bg-primary/10",
  },
  {
    icon: <QrCode className="h-6 w-6" />,
    title: "QR kodas",
    description: "Mokiniai nuskaito QR kodą ir iškart pradeda žaisti",
    color: "text-secondary bg-secondary/10",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Komandinė veikla",
    description: "Mokiniai dirba komandose ir varžosi dėl geriausio rezultato",
    color: "text-accent bg-accent/10",
  },
  {
    icon: <Trophy className="h-6 w-6" />,
    title: "Rezultatai realiu laiku",
    description: "Leaderboard atsinaujina automatiškai — azartas garantuotas",
    color: "text-highlight bg-highlight/10",
  },
]

const labs = [
  {
    icon: <Waves className="h-6 w-6" />,
    name: "Jūrinė laboratorija",
    description:
      "Atveria duris į paslaptingą jūrų pasaulį, leidžia prisiliesti prie mokslinių tyrimų",
    color: "text-secondary bg-secondary/10",
  },
  {
    icon: <Bot className="h-6 w-6" />,
    name: "IT-Robotikos laboratorija",
    description:
      "Didina moksleivių susidomėjimą tiksliais mokslais — robotika, IT, matematika, fizika",
    color: "text-primary bg-primary/10",
  },
  {
    icon: <FlaskConical className="h-6 w-6" />,
    name: "Biologijos-Chemijos laboratorija",
    description:
      "Integruotas fundamentinis ugdymas — biosistemos, genų technologijos ir biotechnologijos",
    color: "text-accent bg-accent/10",
  },
  {
    icon: <Monitor className="h-6 w-6" />,
    name: "Skaitmeninės transformacijos laboratorija",
    description:
      "Pirmoji tokio tipo Lietuvoje — dirbtinis intelektas ir inovacijos susijungia kartu",
    color: "text-highlight bg-highlight/10",
  },
  {
    icon: <Cog className="h-6 w-6" />,
    name: "Fizikos-Inžinerijos laboratorija",
    description:
      "Praktinis fizikos ir inžinerijos pritaikymas realaus pasaulio scenarijuose",
    color: "text-steam-dark bg-steam-dark/10",
  },
]

const steps = [
  {
    number: "01",
    title: "Sukurkite žaidimą",
    description: "Pridėkite pavadinimą, aprašymą ir nustatymus",
  },
  {
    number: "02",
    title: "Pridėkite užduotis",
    description: "Įveskite klausimus, atsakymus ir taškus",
  },
  {
    number: "03",
    title: "Aktyvuokite",
    description: "Gaukite QR kodą ir pasidalinkite su klase",
  },
  {
    number: "04",
    title: "Žaiskite!",
    description: "Stebėkite, kaip mokiniai sprendžia užduotis",
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-primary/3 to-secondary/5" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-highlight/3 rounded-full blur-3xl" />

        <div className="relative container mx-auto px-4 max-w-6xl">
          {/* Nav */}
          <nav className="flex items-center justify-between py-6">
            <SteamLogo />
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-steam-dark">
                  Prisijungti
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20">
                  Pradėti nemokamai
                </Button>
              </Link>
            </div>
          </nav>

          {/* Hero content */}
          <div className="flex flex-col lg:flex-row items-center gap-12 py-16 lg:py-24">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 mb-6">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Nemokama mokykloms
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-steam-dark leading-tight">
                Sukurk{" "}
                <span className="text-transparent bg-clip-text gradient-primary">
                  CTF žaidimą
                </span>
                {" "}savo klasei
              </h1>

              <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto lg:mx-0">
                Capture the Flag platforma mokytojams. Kurkite interaktyvius
                žaidimus, mokiniai nuskaito QR kodą ir pradeda spręsti
                užduotis komandose.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 gap-2 h-13 text-base px-8"
                  >
                    Sukurti žaidimą
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto gap-2 h-13 text-base"
                  >
                    <Clock className="h-4 w-4" />
                    Per 20 minučių
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center gap-4 mt-8 justify-center lg:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>Saugi aplinka</span>
                </div>
                <div className="flex items-center gap-1">
                  <Gamepad2 className="h-4 w-4 text-secondary" />
                  <span>Be registracijos mokiniams</span>
                </div>
              </div>
            </div>

            {/* Hero illustration */}
            <div className="flex-1 max-w-md lg:max-w-lg">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl blur-2xl" />
                <img
                  src="/illustrations/hero-hacker.svg"
                  alt="CTF Builder iliustracija"
                  className="relative w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-steam-dark">
              Kodėl CTF Builder?
            </h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
              Paprastas ir galingas įrankis, sukurtas specialiai mokytojams
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-border/50 bg-white hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-steam-dark mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-[#F8FAFB]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-steam-dark">
              Kaip tai veikia?
            </h2>
            <p className="text-muted-foreground mt-3">
              4 paprasti žingsniai iki interaktyvios pamokos
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-extrabold text-primary">
                    {step.number}
                  </span>
                </div>
                <h3 className="font-semibold text-steam-dark mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute">
                    <ArrowRight className="h-5 w-5 text-border" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About STEAM Center */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-secondary/5 border border-secondary/10 rounded-full px-4 py-1.5 mb-4">
              <MapPin className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">
                Klaipėdos universitetas
              </span>
            </div>
            <h2 className="text-3xl font-bold text-steam-dark">
              STEAM atviros prieigos centras
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Klaipėdos universiteto metodinis STEAM centras — Baltijos jūros
              regiono tvarios mėlynosios ekonomikos sektoriaus augimą
              populiarinantis centras, kviečiantis moksleivius inovatyviai
              susipažinti su mokslo pagrindais 5 laboratorijų erdvėse.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {labs.map((lab, index) => (
              <Card
                key={index}
                className="border-border/50 bg-[#F8FAFB] hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
              >
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${lab.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    {lab.icon}
                  </div>
                  <h3 className="font-semibold text-steam-dark mb-2">
                    {lab.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {lab.description}
                  </p>
                </CardContent>
              </Card>
            ))}

            {/* Contact card */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div>
                  <h3 className="font-semibold text-steam-dark mb-4">
                    Kontaktai
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span>Herkaus Manto g. 84, Klaipėda</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <span>+370 (46) 398 978</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <span>steam@ku.lt</span>
                    </div>
                  </div>
                </div>
                <a
                  href="https://www.ku.lt/steam"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 mt-4"
                >
                  Sužinoti daugiau
                  <ArrowRight className="h-3 w-3" />
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#F8FAFB]">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <div className="bg-gradient-to-br from-steam-dark to-steam-dark/90 rounded-3xl p-10 sm:p-16 text-white relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/20 rounded-full blur-2xl" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Paruošta pradėti?
              </h2>
              <p className="text-white/70 mb-8 max-w-md mx-auto">
                Sukurkite savo pirmąjį CTF žaidimą nemokamai ir paversk
                pamoką nuotykiu.
              </p>
              <Link href="/auth/login">
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 gap-2 h-13 text-base px-8"
                >
                  Sukurti žaidimą dabar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <SteamLogo size="small" />
            <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-muted-foreground">
              <span>Klaipėdos universiteto STEAM centras</span>
              <span className="hidden sm:inline">·</span>
              <span>steam@ku.lt</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/60 text-center mt-4">
            &copy; {new Date().getFullYear()} STEAM LT Klaipėda · CTF Builder
          </p>
        </div>
      </footer>
    </div>
  )
}
