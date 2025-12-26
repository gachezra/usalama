import Link from "next/link"
import { Shield, Camera, Database, ArrowRight, CheckCircle, Users, Building2, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

const stats = [
  { value: "KSH 2.3T", label: "Lost to corruption annually", subtext: "Auditor General Report" },
  { value: "47", label: "Counties covered", subtext: "Nationwide reach" },
  { value: "50K+", label: "Citizens verifying", subtext: "And growing daily" },
  { value: "KSH 50", label: "Per verification", subtext: "Instant M-Pesa payout" },
]

const features = [
  {
    icon: Camera,
    title: "Photo Verification",
    description:
      "Citizens photograph government projects. Our AI compares against official specifications to verify completion.",
  },
  {
    icon: Database,
    title: "Blockchain Ledger",
    description:
      "Every verification is permanently recorded on-chain. Immutable evidence that cannot be tampered with.",
  },
  {
    icon: Smartphone,
    title: "Instant Payouts",
    description: "Verified photos earn KSH 50 instantly via M-Pesa. No delays, no middlemen, direct to your phone.",
  },
]

const steps = [
  { step: "01", title: "Get a Task", description: "Receive a verification task for a project near you" },
  { step: "02", title: "Take a Photo", description: "Capture the current state of the infrastructure" },
  { step: "03", title: "Get Paid", description: "Receive KSH 50 via M-Pesa within seconds" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-7 h-7 text-foreground" />
            <span className="text-lg font-bold tracking-tight">USALAMA</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How it Works
            </Link>
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#impact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Impact
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-8">
              <div className="w-2 h-2 bg-[#16a34a] rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground">Trusted by 47 Counties</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 text-balance">
              Fight corruption.
              <br />
              <span className="text-[#16a34a]">Get paid.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-pretty">
              USALAMA turns every Kenyan into a government watchdog. Verify infrastructure projects with your phone,
              earn instant M-Pesa payouts, and help build a transparent nation.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/verify">
                <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background h-14 px-8 text-base">
                  Start Verifying Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="h-14 px-8 text-base bg-transparent">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x divide-border border border-border rounded-2xl bg-card p-6 md:p-0">
            {stats.map((stat, i) => (
              <div key={i} className="text-center md:py-8 md:px-6">
                <p className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">{stat.subtext}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-[#16a34a] mb-3">HOW IT WORKS</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">Three steps to transparency</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-card border border-border rounded-2xl p-8 h-full">
                  <span className="text-6xl font-bold text-border">{item.step}</span>
                  <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-6 w-8 h-8 text-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-[#16a34a] mb-3">FEATURES</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground text-balance">Built for accountability</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="group">
                <div className="bg-card border border-border rounded-2xl p-8 h-full hover:border-foreground/20 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-[#16a34a]/10 transition-colors">
                    <feature.icon className="w-6 h-6 text-foreground group-hover:text-[#16a34a] transition-colors" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-24 px-6 bg-foreground text-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-medium text-[#16a34a] mb-3">THE IMPACT</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-balance">
                Every photo counts towards a better Kenya
              </h2>
              <p className="text-background/70 text-lg mb-8 leading-relaxed">
                When citizens verify, corruption has nowhere to hide. USALAMA creates an unbreakable chain of evidence
                that holds contractors and officials accountable.
              </p>
              <div className="space-y-4">
                {[
                  "Real-time project monitoring across all 47 counties",
                  "Immutable blockchain records for legal proceedings",
                  "Direct economic empowerment through verification rewards",
                  "Transparent dashboard for government oversight",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#16a34a] flex-shrink-0 mt-0.5" />
                    <span className="text-background/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background/10 rounded-2xl p-6">
                <Users className="w-8 h-8 text-[#16a34a] mb-4" />
                <p className="text-3xl font-bold">50,000+</p>
                <p className="text-background/60 text-sm">Active verifiers</p>
              </div>
              <div className="bg-background/10 rounded-2xl p-6">
                <Building2 className="w-8 h-8 text-[#16a34a] mb-4" />
                <p className="text-3xl font-bold">12,847</p>
                <p className="text-background/60 text-sm">Projects verified</p>
              </div>
              <div className="bg-background/10 rounded-2xl p-6 col-span-2">
                <Database className="w-8 h-8 text-[#16a34a] mb-4" />
                <p className="text-3xl font-bold">KSH 4.2B</p>
                <p className="text-background/60 text-sm">In suspicious contracts flagged for investigation</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            Ready to make a difference?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of Kenyans who are turning their smartphones into tools for transparency.
          </p>
          <Link href="/verify">
            <Button size="lg" className="bg-[#16a34a] hover:bg-[#15803d] text-white h-14 px-10 text-base">
              Start Verifying & Earn
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-foreground" />
            <span className="font-semibold">USALAMA Protocol</span>
          </div>
          <p className="text-sm text-muted-foreground">A citizen-powered government oversight initiative.</p>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Admin Portal
            </Link>
            <Link href="/verify" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Verify Projects
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
