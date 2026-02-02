"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Shield,
  LayoutDashboard,
  ScanSearch,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/scanner", icon: ScanSearch, label: "AI Scanner" },
  { href: "/dashboard/ledger", icon: Database, label: "Ledger" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (pathname === "/dashboard/login") {
      setChecking(false)
      return
    }

    const auth = sessionStorage.getItem("usalama_auth")
    if (auth === "true") {
      setIsAuthenticated(true)
    } else {
      router.push("/dashboard/login")
    }
    setChecking(false)
  }, [pathname, router])

  const handleLogout = () => {
    sessionStorage.removeItem("usalama_auth")
    router.push("/dashboard/login")
  }

  if (pathname === "/dashboard/login") {
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="dark min-h-screen bg-[#0B1121] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-cyan-400 animate-pulse" />
          <span className="text-slate-400">Verifying access...</span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="dark min-h-screen bg-[#0B1121] flex">
      {/* Sidebar */}
      <aside
        className={cn(
          "relative flex flex-col border-r border-slate-800 bg-[#0F172A]/50 transition-all duration-300",
          collapsed ? "w-20" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-slate-800">
          <div className="relative flex-shrink-0">
            <Shield className="w-8 h-8 text-cyan-400" />
            <div className="absolute inset-0 bg-cyan-400/20 blur-lg rounded-full" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-white tracking-tight">USALAMA</h1>
              <p className="text-[10px] text-cyan-400 tracking-[0.2em] uppercase">Protocol</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50",
                )}
              >
                <item.icon
                  className={cn("w-5 h-5 flex-shrink-0", isActive && "drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]")}
                />
                {!collapsed && <span className="font-medium">{item.label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 w-full",
              collapsed && "justify-center",
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
