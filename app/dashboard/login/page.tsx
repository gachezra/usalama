"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Fingerprint, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const VALID_USER = "admin"
const VALID_PASS = "usalama123"

export default function AdminLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (username === VALID_USER && password === VALID_PASS) {
      // Store auth in sessionStorage
      sessionStorage.setItem("usalama_auth", "true")
      router.push("/dashboard")
    } else {
      setError("Invalid credentials. Access denied.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B1121] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated grid background */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      {/* Floating particles effect */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-cyan-500/10">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="relative">
              <Shield className="w-10 h-10 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-400/20 blur-xl rounded-full" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">USALAMA</h1>
              <p className="text-xs text-cyan-400 tracking-[0.3em] uppercase">Admin Portal</p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="flex items-center justify-center gap-2 mb-6 py-2 px-4 rounded-full bg-cyan-950/30 border border-cyan-500/20 mx-auto w-fit">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-xs text-cyan-400 font-medium">SECURE TERMINAL</span>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="officialId" className="text-slate-400 text-sm">
                Official ID
              </Label>
              <Input
                id="officialId"
                type="text"
                placeholder="Enter your official ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-12"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="biometricKey" className="text-slate-400 text-sm">
                Biometric Key
              </Label>
              <div className="relative">
                <Input
                  id="biometricKey"
                  type="password"
                  placeholder="Enter biometric key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-12 pr-12"
                  required
                />
                <Fingerprint className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Access Command Center"
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-slate-500 text-xs mt-6">
            Authorized personnel only. All access is monitored and logged.
          </p>
        </div>
      </div>
    </div>
  )
}
