import type { Metadata } from "next"
import localFont from "next/font/local"
import { Instrument_Serif } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { MotionProvider } from "@/components/shared/motion-provider"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
})

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
})

// Editorial display serif — used for landing hero / section headlines.
// Instrument Serif is a contemporary humanist serif with optical-size feel,
// pairs naturally with Geist Sans (geometric grotesque) on landing pages
// and supports full Latin Extended (LT diacritics ąčęėįšųūž).
const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
})

export const metadata: Metadata = {
  title: "KU STEAM platforma | Interaktyvios pamokos",
  description:
    "Klaipėdos universiteto STEAM metodinio centro platforma partnerių mokyklų mokytojams — interaktyvių pamokų, komandinių veiklų ir užduočių kūrimui.",
  icons: {
    icon: "/icon.svg",
  },
  metadataBase: new URL("https://www.kusteam.app"),
  openGraph: {
    title: "Interaktyvi pamokų kūrimo platforma partnerių mokykloms",
    description:
      "Klaipėdos universiteto STEAM metodinio centro platforma mokytojams — interaktyvių pamokų, komandinių veiklų ir užduočių kūrimui.",
    url: "https://www.kusteam.app",
    siteName: "KU STEAM platforma",
    type: "website",
    locale: "lt_LT",
  },
  twitter: {
    card: "summary_large_image",
    title: "Interaktyvi pamokų kūrimo platforma partnerių mokykloms",
    description:
      "Klaipėdos universiteto STEAM metodinio centro platforma mokytojams — interaktyvių pamokų, komandinių veiklų ir užduočių kūrimui.",
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="lt" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} font-sans antialiased`}
      >
        <MotionProvider>
          {children}
        </MotionProvider>
        <Toaster />
      </body>
    </html>
  )
}
