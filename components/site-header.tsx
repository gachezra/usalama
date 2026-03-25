"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 z-[60] py-2 px-6 md:px-12 mb-3 bg-transparent">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group z-[70]">
            <div className="md:w-40 md:h-40 w-16 h-16 relative flex items-center justify-center transition-transform group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="USALAMA Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8 md:gap-12 font-medium text-sm tracking-widest uppercase z-[70]">
            <Link href="/projects" className="hover:text-terracotta transition-colors">Public Registry</Link>
            <Link href="/#how-it-works" className="hover:text-terracotta transition-colors">How it Works</Link>
            <Link href="/#features" className="hover:text-terracotta transition-colors">Features</Link>
            <Link href="/#impact" className="hover:text-terracotta transition-colors">Impact</Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            className="md:hidden z-[70] p-2 text-foreground focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-background/95 backdrop-blur-md transition-all duration-300 md:hidden flex flex-col items-center justify-center space-y-8 font-serif text-2xl tracking-widest uppercase ${
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <Link 
          href="/projects" 
          className="hover:text-terracotta transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          Public Registry
        </Link>
        <Link 
          href="/#how-it-works" 
          className="hover:text-terracotta transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          How it Works
        </Link>
        <Link 
          href="/#features" 
          className="hover:text-terracotta transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          Features
        </Link>
        <Link 
          href="/#impact" 
          className="hover:text-terracotta transition-colors"
          onClick={() => setMobileMenuOpen(false)}
        >
          Impact
        </Link>
      </div>
    </>
  )
}
