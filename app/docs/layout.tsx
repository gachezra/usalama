import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Documentation — USALAMA Protocol",
  description:
    "Complete documentation for the USALAMA citizen-powered government oversight platform. Guides for citizens, government officials, and developers.",
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
