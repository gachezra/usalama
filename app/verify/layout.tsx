import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verify Project - USALAMA",
  description: "Verify government projects and earn rewards",
}

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
