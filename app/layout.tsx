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

// Canonical public address of the classroom; .vercel.app hosts are
// infrastructure only and never appear in metadata or shared links.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pamokos.kusteam.app"
const DESCRIPTION =
  "KU STEAM AI LAB platforma, kurioje vedėjai kuria ir veda interaktyvias veiklas, o dalyviai prie jų prisijungia su kodu."

export const metadata: Metadata = {
  title: "KU STEAM CLASSROOM | Interaktyvios pamokos",
  description: DESCRIPTION,
  icons: {
    icon: "/icon.svg",
  },
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  openGraph: {
    title: "KU STEAM CLASSROOM",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "KU STEAM AI LAB",
    type: "website",
    locale: "lt_LT",
  },
  twitter: {
    card: "summary_large_image",
    title: "KU STEAM CLASSROOM",
    description: DESCRIPTION,
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
