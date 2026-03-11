"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Shield,
  ArrowRight,
  Camera,
  Database,
  Brain,
  Terminal,
  Layers,
  CheckCircle,
  AlertTriangle,
  Monitor,
  Users,
  BookOpen,
  Smartphone,
  Lock,
  FileText,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const NAV_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "how-it-works", label: "How It Works" },
  { id: "citizen-guide", label: "Citizen Guide" },
  { id: "dashboard-guide", label: "Dashboard Guide" },
  { id: "developer-setup", label: "Developer Setup" },
  { id: "api-reference", label: "API Reference" },
  { id: "architecture", label: "Architecture" },
]

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-secondary border border-border rounded-xl p-4 overflow-x-auto font-mono text-sm text-foreground leading-relaxed">
      <code>{children}</code>
    </pre>
  )
}

function SectionHeading({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-10">
      <p className="text-sm font-semibold text-[#16a34a] uppercase tracking-wider mb-2">{label}</p>
      <h2 className="text-3xl font-bold text-foreground">{title}</h2>
    </div>
  )
}

function Divider() {
  return <hr className="border-border my-16" />
}

function Badge({ children, variant = "default" }: { children: string; variant?: "default" | "low" | "medium" | "high" | "critical" }) {
  const styles = {
    default: "bg-secondary text-foreground",
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-orange-100 text-orange-800",
    critical: "bg-red-100 text-red-800",
  }
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", styles[variant])}>
      {children}
    </span>
  )
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview")

  useEffect(() => {
    const observers: IntersectionObserver[] = []

    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { rootMargin: "-10% 0px -75% 0px" },
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-[90rem] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-foreground" />
            <span className="text-lg font-bold tracking-tight">USALAMA</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/docs" className="text-sm text-foreground font-medium">
              Docs
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Admin Login
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="sm" className="bg-[#16a34a] hover:bg-[#15803d] text-white">
                Start Verifying
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-16 flex max-w-[90rem] mx-auto">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col sticky top-16 h-[calc(100vh-4rem)] w-64 flex-shrink-0 border-r border-border overflow-y-auto py-10 px-5">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-5 px-3">
            Documentation
          </p>
          <nav className="space-y-0.5">
            {NAV_SECTIONS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                  activeSection === id
                    ? "bg-secondary text-foreground font-medium border-l-2 border-[#16a34a] pl-[calc(0.75rem-2px)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                )}
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="mt-auto pt-8 px-3 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">Quick access</p>
            <div className="space-y-2">
              <Link
                href="/verify"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#16a34a] transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Verify a project
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-[#16a34a] transition-colors"
              >
                <Monitor className="w-3.5 h-3.5" />
                Admin dashboard
              </Link>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 px-8 md:px-14 py-14">
          {/* ── OVERVIEW ─────────────────────────────────────── */}
          <section id="overview" className="scroll-mt-20">
            <div className="mb-3">
              <p className="text-sm font-semibold text-[#16a34a] uppercase tracking-wider mb-2">Introduction</p>
              <h1 className="text-4xl font-bold text-foreground mb-4">USALAMA Documentation</h1>
              <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
                USALAMA is a citizen-powered government oversight platform built to fight corruption in Kenya's public
                infrastructure. This documentation covers everything you need — whether you're a citizen, government
                official, or developer.
              </p>
            </div>

            {/* Pillars */}
            <div className="grid grid-cols-3 gap-4 mt-10 mb-12">
              {[
                { letter: "U", word: "Uwazi", meaning: "Transparency", desc: "Every shilling is traceable" },
                { letter: "S", word: "Usalama", meaning: "Security", desc: "Immutable, tamper-proof records" },
                { letter: "A", word: "Amani", meaning: "Peace", desc: "Accountability that builds trust" },
              ].map(({ letter, word, meaning, desc }) => (
                <div key={letter} className="bg-card border border-border rounded-2xl p-6">
                  <span className="text-3xl font-bold text-[#16a34a]">{letter}</span>
                  <p className="text-foreground font-semibold mt-2">
                    {word} <span className="text-muted-foreground font-normal">· {meaning}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                </div>
              ))}
            </div>

            {/* Quick access cards */}
            <h3 className="text-lg font-semibold text-foreground mb-5">Jump to a guide</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Smartphone,
                  title: "Citizen Guide",
                  desc: "How to verify projects and earn M-Pesa payouts",
                  href: "#citizen-guide",
                  audience: "For citizens",
                },
                {
                  icon: Monitor,
                  title: "Dashboard Guide",
                  desc: "How to use the government oversight dashboard",
                  href: "#dashboard-guide",
                  audience: "For officials",
                },
                {
                  icon: Terminal,
                  title: "Developer Setup",
                  desc: "Run the full stack locally in minutes",
                  href: "#developer-setup",
                  audience: "For developers",
                },
                {
                  icon: FileText,
                  title: "API Reference",
                  desc: "Backend endpoints for the ForensicBrain engine",
                  href: "#api-reference",
                  audience: "For developers",
                },
              ].map(({ icon: Icon, title, desc, href, audience }) => (
                <a
                  key={title}
                  href={href}
                  className="group bg-card border border-border rounded-2xl p-6 hover:border-foreground/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center group-hover:bg-[#16a34a]/10 transition-colors">
                      <Icon className="w-5 h-5 text-foreground group-hover:text-[#16a34a] transition-colors" />
                    </div>
                    <span className="text-xs text-muted-foreground">{audience}</span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">{title}</h4>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </a>
              ))}
            </div>
          </section>

          <Divider />

          {/* ── HOW IT WORKS ─────────────────────────────────── */}
          <section id="how-it-works" className="scroll-mt-20">
            <SectionHeading label="Overview" title="How USALAMA works" />

            <p className="text-muted-foreground mb-10 max-w-2xl">
              USALAMA combines citizen-sourced evidence with AI-powered document analysis to create an unbreakable
              accountability loop. Here's the end-to-end flow:
            </p>

            <div className="space-y-4">
              {[
                {
                  step: "01",
                  icon: FileText,
                  title: "Project registered",
                  desc: "A government official registers a public infrastructure project — road, school, hospital — with its contractor details and total budget.",
                },
                {
                  step: "02",
                  icon: Database,
                  title: "Tender documents uploaded",
                  desc: "Procurement documents (Bills of Quantities, specifications, tender notices) are uploaded as PDFs. Each document is SHA-256 hashed on arrival, creating a tamper-proof fingerprint.",
                },
                {
                  step: "03",
                  icon: Brain,
                  title: "ForensicBrain analyses",
                  desc: "The AI engine cross-references all uploaded documents, detects price anomalies, flags suspicious contract terms, and generates a risk score from 0 to 100.",
                },
                {
                  step: "04",
                  icon: Camera,
                  title: "Citizens verify on the ground",
                  desc: "Citizens near the project site receive verification tasks. They photograph the actual physical progress. Photos are compared against the official specification claims.",
                },
                {
                  step: "05",
                  icon: Shield,
                  title: "Immutable record sealed",
                  desc: "All verdicts, photos, and AI analyses are written to the audit ledger. These records cannot be altered — providing a legal-grade evidence chain for investigations.",
                },
              ].map(({ step, icon: Icon, title, desc }, i, arr) => (
                <div key={step} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-foreground" />
                    </div>
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
                  </div>
                  <div className="pb-8">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">{step}</span>
                      <h4 className="font-semibold text-foreground">{title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Divider />

          {/* ── CITIZEN GUIDE ────────────────────────────────── */}
          <section id="citizen-guide" className="scroll-mt-20">
            <SectionHeading label="For citizens" title="Citizen verification guide" />

            <p className="text-muted-foreground mb-10 max-w-2xl">
              Any Kenyan with a smartphone can participate. You don't need to create an account — just visit{" "}
              <Link href="/verify" className="text-[#16a34a] hover:underline underline-offset-4">
                /verify
              </Link>{" "}
              and start.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-6">How to verify a project</h3>

            <div className="space-y-5 mb-12">
              {[
                {
                  step: "1",
                  title: "Open the verification page",
                  desc: 'Go to usalama.ke/verify on your phone browser. Tap "Start Verifying" and you\'ll see a list of projects near you that need photos.',
                },
                {
                  step: "2",
                  title: "Select a project task",
                  desc: "Each task tells you the project name, county, and what type of infrastructure it is. Pick one you can physically reach.",
                },
                {
                  step: "3",
                  title: "Take your photo",
                  desc: "Photograph the infrastructure as it stands today. Make sure the structure is clearly visible. Multiple angles are better. Avoid covering the structure.",
                },
                {
                  step: "4",
                  title: "Submit and get paid",
                  desc: "Submit your photo. Our system validates it within seconds. If approved, KSH 50 is sent directly to your M-Pesa. No registration. No waiting.",
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex gap-4 p-5 bg-card border border-border rounded-2xl">
                  <span className="text-2xl font-bold text-[#16a34a] flex-shrink-0 w-8">{step}</span>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">{title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mb-12">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">What qualifies</h4>
                </div>
                <ul className="space-y-2">
                  {[
                    "Clear, in-focus photo of the infrastructure",
                    "Photo taken at the actual project site",
                    "Structure visible and identifiable",
                    "Taken within the last 7 days",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-green-800">
                      <CheckCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-900">What gets rejected</h4>
                </div>
                <ul className="space-y-2">
                  {[
                    "Blurry or obscured photos",
                    "Photos taken from a different location",
                    "Screenshots or downloaded images",
                    "Duplicate submissions for the same task",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-red-800">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-secondary border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="w-5 h-5 text-[#16a34a]" />
                <h4 className="font-semibold text-foreground">M-Pesa payout details</h4>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <span className="text-foreground font-medium">Amount:</span> KSH 50 per approved verification
                </li>
                <li>
                  <span className="text-foreground font-medium">Speed:</span> Sent within seconds of approval
                </li>
                <li>
                  <span className="text-foreground font-medium">Method:</span> Direct to your registered M-Pesa number
                </li>
                <li>
                  <span className="text-foreground font-medium">Limit:</span> One payout per project per citizen
                </li>
              </ul>
            </div>
          </section>

          <Divider />

          {/* ── DASHBOARD GUIDE ──────────────────────────────── */}
          <section id="dashboard-guide" className="scroll-mt-20">
            <SectionHeading label="For government officials" title="Dashboard guide" />

            <p className="text-muted-foreground mb-10 max-w-2xl">
              The USALAMA dashboard is a real-time command center for oversight officials. Access it at{" "}
              <Link href="/dashboard" className="text-[#16a34a] hover:underline underline-offset-4">
                /dashboard
              </Link>
              .
            </p>

            <div className="bg-secondary border border-border rounded-2xl p-5 mb-10 flex items-start gap-4">
              <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Admin credentials (default)</p>
                <p className="text-sm text-muted-foreground">
                  Username: <code className="font-mono bg-background px-1 py-0.5 rounded text-xs">admin</code> &nbsp;
                  Password: <code className="font-mono bg-background px-1 py-0.5 rounded text-xs">usalama123</code>
                </p>
                <p className="text-xs text-muted-foreground mt-1">Change these before any production deployment.</p>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-6">Dashboard sections</h3>

            <div className="space-y-4 mb-12">
              {[
                {
                  icon: Monitor,
                  name: "Overview",
                  path: "/dashboard",
                  desc: "The command center. Live national project map across all 47 counties, system status, key metrics (active audits, citizen reports, verified projects), and a real-time verification feed.",
                },
                {
                  icon: FileText,
                  name: "Projects",
                  path: "/dashboard/projects",
                  desc: "Full list of registered infrastructure projects. Filter by county, status, or risk level. Click any project to see its documents, AI verdict, and citizen verifications.",
                },
                {
                  icon: Brain,
                  name: "AI Scanner",
                  path: "/dashboard/scanner",
                  desc: "Upload tender PDFs and run forensic analysis. The ForensicBrain classifies each document, detects anomalies, and produces a structured verdict with evidence.",
                },
                {
                  icon: Database,
                  name: "Ledger",
                  path: "/dashboard/ledger",
                  desc: "The immutable audit trail. Every AI analysis, citizen verification, and risk flag is permanently recorded here with timestamps and SHA-256 document hashes.",
                },
              ].map(({ icon: Icon, name, path, desc }) => (
                <div key={name} className="flex gap-4 p-5 bg-card border border-border rounded-2xl">
                  <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-foreground">{name}</h4>
                      <code className="text-xs font-mono text-muted-foreground">{path}</code>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-5">Understanding risk levels</h3>

            <p className="text-sm text-muted-foreground mb-5">
              The ForensicBrain assigns every project a risk score from 0–100. Scores map to four levels:
            </p>

            <div className="overflow-hidden border border-border rounded-2xl mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Level</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Score range</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Meaning</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-5 py-3">
                      <Badge variant="low">LOW</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground font-mono">0 – 24</td>
                    <td className="px-5 py-3 text-muted-foreground">No significant anomalies detected</td>
                    <td className="px-5 py-3 text-muted-foreground">Monitor normally</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3">
                      <Badge variant="medium">MEDIUM</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground font-mono">25 – 49</td>
                    <td className="px-5 py-3 text-muted-foreground">Minor discrepancies in documents</td>
                    <td className="px-5 py-3 text-muted-foreground">Review flagged items</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3">
                      <Badge variant="high">HIGH</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground font-mono">50 – 74</td>
                    <td className="px-5 py-3 text-muted-foreground">Significant anomalies, price inflation likely</td>
                    <td className="px-5 py-3 text-muted-foreground">Escalate for investigation</td>
                  </tr>
                  <tr>
                    <td className="px-5 py-3">
                      <Badge variant="critical">CRITICAL</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground font-mono">75 – 100</td>
                    <td className="px-5 py-3 text-muted-foreground">Strong evidence of fraud — project auto-flagged</td>
                    <td className="px-5 py-3 text-muted-foreground">Immediate suspension</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <Divider />

          {/* ── DEVELOPER SETUP ──────────────────────────────── */}
          <section id="developer-setup" className="scroll-mt-20">
            <SectionHeading label="For developers" title="Local development setup" />

            <p className="text-muted-foreground mb-10 max-w-2xl">
              The USALAMA stack runs fully locally — no external APIs required. The AI model runs on your machine via
              Ollama.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-5">Prerequisites</h3>

            <div className="overflow-hidden border border-border rounded-2xl mb-10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Tool</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Version</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Docker Desktop", "Latest", "Runs the PostgreSQL database"],
                    ["Node.js", "18+", "Next.js frontend"],
                    ["Python", "3.10+", "FastAPI backend"],
                    ["Ollama", "Latest", "Local LLM inference (Llama 3.2 3b)"],
                  ].map(([tool, version, purpose]) => (
                    <tr key={tool}>
                      <td className="px-5 py-3 font-medium text-foreground font-mono">{tool}</td>
                      <td className="px-5 py-3 text-muted-foreground">{version}</td>
                      <td className="px-5 py-3 text-muted-foreground">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-6">Step-by-step setup</h3>

            <div className="space-y-8">
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">1. Start the database</p>
                <CodeBlock>{`docker compose up -d`}</CodeBlock>
                <p className="text-xs text-muted-foreground mt-2">
                  Starts PostgreSQL 16 with pgvector on port 5432.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3">2. Set up the backend</p>
                <CodeBlock>{`cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate      # Mac / Linux
# venv\\Scripts\\activate       # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment (no edits needed for default Docker setup)
cp .env.example .env

# Run database migrations
alembic upgrade head

# Start the FastAPI server
uvicorn app.main:app --reload`}</CodeBlock>
                <p className="text-xs text-muted-foreground mt-2">
                  API will be available at{" "}
                  <code className="font-mono bg-secondary px-1 py-0.5 rounded">http://localhost:8000</code>
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3">3. Start the frontend</p>
                <CodeBlock>{`# From the project root (open a new terminal)
npm install
npm run dev`}</CodeBlock>
                <p className="text-xs text-muted-foreground mt-2">
                  Frontend at{" "}
                  <code className="font-mono bg-secondary px-1 py-0.5 rounded">http://localhost:3000</code>
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-3">4. Pull the AI model</p>
                <CodeBlock>{`ollama pull llama3.2:3b
ollama serve &`}</CodeBlock>
                <p className="text-xs text-muted-foreground mt-2">
                  Required to run AI Scanner audits. The model (~2 GB) only needs to be downloaded once.
                </p>
              </div>
            </div>

            <div className="mt-8 bg-secondary border border-border rounded-2xl p-5">
              <p className="text-sm font-semibold text-foreground mb-2">Default credentials</p>
              <p className="text-sm text-muted-foreground">
                Dashboard:{" "}
                <code className="font-mono bg-background px-1 py-0.5 rounded text-xs">http://localhost:3000/dashboard/login</code>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Username: <code className="font-mono bg-background px-1 py-0.5 rounded text-xs">admin</code> &nbsp;
                Password: <code className="font-mono bg-background px-1 py-0.5 rounded text-xs">usalama123</code>
              </p>
            </div>
          </section>

          <Divider />

          {/* ── API REFERENCE ────────────────────────────────── */}
          <section id="api-reference" className="scroll-mt-20">
            <SectionHeading label="For developers" title="API reference" />

            <p className="text-muted-foreground mb-3 max-w-2xl">
              The USALAMA backend exposes a REST API built with FastAPI. All project and forensic operations go through
              this API.
            </p>

            <div className="mb-10">
              <p className="text-sm text-muted-foreground mb-2">Base URL</p>
              <CodeBlock>{`http://localhost:8000`}</CodeBlock>
              <p className="text-xs text-muted-foreground mt-2">
                Interactive Swagger docs are available at{" "}
                <code className="font-mono bg-secondary px-1 py-0.5 rounded">http://localhost:8000/docs</code> when the
                backend is running.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-6">Endpoints</h3>

            <div className="space-y-4">
              {[
                {
                  method: "GET",
                  path: "/health",
                  summary: "Health check",
                  desc: "Returns system status and database connectivity. Use this to verify the backend is running correctly before making other requests.",
                },
                {
                  method: "GET",
                  path: "/api/v1/projects/",
                  summary: "List projects",
                  desc: "Returns all registered projects. Supports optional query parameters: county (string), status_filter (PLANNED | ACTIVE | COMPLETED | STALLED | FLAGGED), skip (int), and limit (int, default 50).",
                },
                {
                  method: "POST",
                  path: "/api/v1/projects/",
                  summary: "Create project",
                  desc: "Registers a new infrastructure project. Requires title, county, contractor_name, and total_budget in the request body. Returns the created project with a generated UUID.",
                },
                {
                  method: "GET",
                  path: "/api/v1/projects/{id}",
                  summary: "Get project detail",
                  desc: "Returns full project details including all uploaded documents and the latest AI forensic verdict (if an audit has been run).",
                },
                {
                  method: "POST",
                  path: "/api/v1/projects/{id}/upload",
                  summary: "Upload document",
                  desc: "Accepts a multipart PDF file upload. The document is automatically parsed, SHA-256 hashed, classified by the ForensicBrain (SPECIFICATION, BOQ, TENDER, or OTHER), and associated with the project.",
                },
                {
                  method: "POST",
                  path: "/api/v1/projects/{id}/audit",
                  summary: "Run forensic audit",
                  desc: "Triggers a full AI forensic analysis across all documents for the project. The ForensicBrain cross-references documents, detects anomalies, and returns a ForensicVerdict with a risk score (0–100) and a list of corruption flags. Updates the project's risk level in the database.",
                },
              ].map(({ method, path, summary, desc }) => (
                <div key={path} className="border border-border rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3 bg-secondary border-b border-border">
                    <span
                      className={cn(
                        "text-xs font-bold font-mono px-2 py-0.5 rounded",
                        method === "GET"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700",
                      )}
                    >
                      {method}
                    </span>
                    <code className="text-sm font-mono text-foreground">{path}</code>
                    <span className="text-sm text-muted-foreground ml-auto">{summary}</span>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Divider />

          {/* ── ARCHITECTURE ─────────────────────────────────── */}
          <section id="architecture" className="scroll-mt-20">
            <SectionHeading label="Technical overview" title="Architecture" />

            <p className="text-muted-foreground mb-10 max-w-2xl">
              USALAMA is a full-stack platform with data sovereignty at its core — no data leaves the local environment.
              All AI inference runs on your own hardware.
            </p>

            <h3 className="text-xl font-semibold text-foreground mb-5">Tech stack</h3>

            <div className="overflow-hidden border border-border rounded-2xl mb-12">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Layer</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Technology</th>
                    <th className="text-left px-5 py-3 font-semibold text-foreground">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ["Frontend", "Next.js 15 + TypeScript", "App Router, React 19, Tailwind CSS 4"],
                    ["UI components", "Radix UI + Lucide", "Accessible component primitives and icons"],
                    ["Maps", "Leaflet + React-Leaflet", "Geospatial project mapping"],
                    ["Backend", "FastAPI (Python)", "Async REST API, Pydantic validation"],
                    ["Database", "PostgreSQL 16 + pgvector", "Projects, documents, audit logs, verifications"],
                    ["ORM", "SQLAlchemy 2.0 (async)", "Database access with asyncpg driver"],
                    ["Migrations", "Alembic", "Schema version control"],
                    ["AI inference", "Ollama + Llama 3.2 3b", "Local LLM for forensic document analysis"],
                    ["Document parsing", "pdfplumber", "Text and table extraction from PDFs"],
                    ["Dev database", "Docker Compose", "Containerised PostgreSQL for local development"],
                  ].map(([layer, tech, purpose]) => (
                    <tr key={layer}>
                      <td className="px-5 py-3 font-medium text-foreground">{layer}</td>
                      <td className="px-5 py-3 font-mono text-sm text-muted-foreground">{tech}</td>
                      <td className="px-5 py-3 text-muted-foreground">{purpose}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-5">Document analysis pipeline</h3>

            <div className="flex flex-col gap-3 mb-12">
              {[
                { label: "PDF upload", desc: "File received via multipart form POST" },
                { label: "Extraction", desc: "pdfplumber extracts text and tables as Markdown" },
                { label: "Hashing", desc: "SHA-256 hash computed — tamper fingerprint sealed" },
                { label: "Classification", desc: "ForensicBrain classifies document type (SPECIFICATION, BOQ, TENDER, OTHER)" },
                { label: "Storage", desc: "File and metadata written to PostgreSQL with hash" },
                { label: "Forensic audit", desc: "LLM cross-references all project documents, detects anomalies" },
                { label: "Verdict", desc: "Risk score + structured flags returned and stored in audit log" },
              ].map(({ label, desc }, i, arr) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0 text-xs font-mono text-muted-foreground">
                      {i + 1}
                    </div>
                    {i < arr.length - 1 && <div className="w-px h-5 bg-border" />}
                  </div>
                  <div className="pb-1">
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                    <span className="text-sm text-muted-foreground"> — {desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lock className="w-5 h-5 text-[#16a34a]" />
                  <h4 className="font-semibold text-foreground">Data sovereignty</h4>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  All AI inference runs locally via Ollama. No document content, citizen data, or analysis results is
                  ever sent to an external API. The Sovereign Stack design means sensitive procurement data stays within
                  the government's own infrastructure.
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="w-5 h-5 text-[#16a34a]" />
                  <h4 className="font-semibold text-foreground">Database schema</h4>
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  <li>
                    <span className="font-mono text-foreground">projects</span> — central entity, risk score, status
                  </li>
                  <li>
                    <span className="font-mono text-foreground">documents</span> — PDFs with SHA-256 hash and type
                  </li>
                  <li>
                    <span className="font-mono text-foreground">audit_logs</span> — AI verdicts with timestamps
                  </li>
                  <li>
                    <span className="font-mono text-foreground">verifications</span> — citizen photo submissions
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Footer spacer */}
          <div className="h-24" />

          {/* Page footer */}
          <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-foreground" />
              <span className="text-sm font-semibold">USALAMA Protocol</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/verify" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Verify Projects
              </Link>
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Admin Portal
              </Link>
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
