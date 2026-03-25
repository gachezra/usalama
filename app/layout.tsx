import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google"
import "tw-animate-css"
import "leaflet/dist/leaflet.css"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
})

export const metadata: Metadata = {
  title: "USALAMA Protocol",
  description: "National Government Oversight & Citizen Verification Platform",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${jetbrainsMono.variable} ${playfair.variable} antialiased font-sans`}>{children}</body>
    </html>
  )
}
