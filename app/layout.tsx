import type { Metadata } from "next"
import localFont from "next/font/local"
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <MotionProvider>
          {children}
        </MotionProvider>
        <Toaster />
      </body>
    </html>
  )
}
