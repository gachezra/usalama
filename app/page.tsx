import Link from "next/link"
import Image from "next/image"
import { Shield, Camera, Database, ArrowRight, Check, Users, Building2, Smartphone } from "lucide-react"

import SiteHeader from "@/components/site-header"

const stats = [
  { value: "KSH 2.3T", label: "Lost to corruption annually" },
  { value: "47", label: "Counties covered" },
  { value: "50K+", label: "Citizens verifying" },
  { value: "KSH 50", label: "Per verification" },
]

const features = [
  {
    icon: Camera,
    title: "Photo Verification",
    description: "Citizens photograph government projects. Our system compares against official specifications to verify completion.",
  },
  {
    icon: Database,
    title: "Blockchain Ledger",
    description: "Every verification is permanently recorded on-chain. Immutable evidence that cannot be tampered with.",
  },
  {
    icon: Smartphone,
    title: "Instant Payouts",
    description: "Verified photos earn KSH 50 instantly via M-Pesa. No delays, no middlemen, direct to your phone.",
  },
]

const steps = [
  { step: "01", title: "Get a Task", description: "Receive a verification task for a project near you." },
  { step: "02", title: "Take a Photo", description: "Capture the current state of the scheduled infrastructure." },
  { step: "03", title: "Get Paid", description: "Receive KSH 50 via M-Pesa within seconds of approval." },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-terracotta/20 selection:text-terracotta font-sans tracking-wide">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-32 px-6 kenyan-pattern min-h-[90vh] flex flex-col justify-center">
        <div className="max-w-7xl mx-auto w-full relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-[1px] bg-terracotta" />
              <span className="text-sm tracking-widest uppercase font-medium text-terracotta">A Citizen Initiative</span>
            </div>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-normal leading-[0.9] text-foreground mb-8">
              Fight <br />
              <span className="italic text-terracotta">corruption.</span><br />
              Get paid.
            </h1>

            <p className="text-xl md:text-2xl text-foreground/80 max-w-2xl leading-relaxed font-light mb-16">
              USALAMA turns every Kenyan into a government watchdog. Verify infrastructure projects with your phone, 
              earn instant M-Pesa payouts, and help build a transparent nation.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-8">
              <Link href="/projects" className="group flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border border-foreground flex items-center justify-center group-hover:bg-foreground group-hover:text-sand transition-all duration-300">
                  <ArrowRight className="w-6 h-6" strokeWidth={1} />
                </div>
                <span className="text-lg font-serif italic tracking-wide group-hover:text-terracotta transition-colors">View Active Projects</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative Circle Motif */}
        <div className="absolute right-0 bottom-0 translate-x-1/3 translate-y-1/3 w-96 h-96 rounded-full border border-terracotta/20 pointer-events-none" />
        <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-[500px] h-[500px] rounded-full border border-forest/10 pointer-events-none" />
      </section>

      <div className="kenyan-border w-full opacity-80" />

      {/* Stats Divider Section */}
      <section className="py-24 px-6 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col">
                <p className="text-4xl md:text-5xl font-serif text-terracotta mb-4">{stat.value}</p>
                <div className="h-[1px] w-12 bg-border mb-4" />
                <p className="text-sm uppercase tracking-widest text-foreground/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-8">
            <div className="lg:col-span-4 flex flex-col justify-between">
              <div>
                <h2 className="text-5xl font-serif mb-6 leading-tight">Three steps to<br />transparency.</h2>
                <div className="w-12 h-[1px] bg-terracotta mb-8" />
                <p className="text-lg text-foreground/70 font-light leading-relaxed">
                  We've streamlined the process of accountability. A minimal effort from you creates an immutable record for the nation.
                </p>
              </div>
              
              <div className="hidden lg:block">
                <div className="w-32 h-32 rounded-full border border-forest/20 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-forest/5" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-1" />

            <div className="lg:col-span-7">
              <div className="space-y-0">
                {steps.map((item, i) => (
                  <div key={i} className="group relative border-t border-border py-12 first:border-0 lg:first:pt-0">
                    <div className="grid md:grid-cols-12 gap-6 items-start">
                      <div className="md:col-span-3">
                        <span className="text-5xl font-serif text-terracotta/30 group-hover:text-terracotta transition-colors duration-500">{item.step}</span>
                      </div>
                      <div className="md:col-span-9">
                        <h3 className="text-2xl font-serif mb-4">{item.title}</h3>
                        <p className="text-foreground/70 font-light leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="border-t border-border" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6 bg-forest text-sand kenyan-pattern">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-serif mb-24 max-w-2xl leading-tight">Built for<br /><span className="italic text-terracotta">accountability.</span></h2>

          <div className="grid md:grid-cols-3 gap-16 md:gap-12">
            {features.map((feature, i) => (
              <div key={i} className="flex flex-col">
                <div className="mb-8 p-4 bg-sand/5 rounded-full w-max">
                  <feature.icon className="w-6 h-6 text-terracotta" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-serif mb-6">{feature.title}</h3>
                <p className="text-sand/70 font-light leading-relaxed leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-[1px] bg-maasai" />
                <span className="text-sm tracking-widest uppercase font-medium text-maasai">The Impact</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-serif mb-10 leading-tight">
                Every photo counts towards a better Kenya.
              </h2>
              <p className="text-foreground/70 text-lg mb-12 font-light leading-relaxed">
                When citizens verify, corruption has nowhere to hide. USALAMA creates an unbreakable chain of evidence
                that holds contractors and officials accountable.
              </p>
              <div className="space-y-6">
                {[
                  "Real-time project monitoring across all 47 counties",
                  "Immutable blockchain records for legal proceedings",
                  "Direct economic empowerment through verification rewards",
                  "Transparent dashboard for government oversight",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <Check className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-foreground/80 font-light">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-[4/5] bg-sand border border-border p-10 flex flex-col justify-between kenyan-pattern relative z-10">
                <div className="space-y-12">
                  <div>
                    <Users className="w-8 h-8 text-maasai mb-6" strokeWidth={1} />
                    <p className="text-5xl font-serif mb-2">50,000+</p>
                    <p className="text-foreground/60 text-sm uppercase tracking-widest">Active verifiers</p>
                  </div>
                  <div>
                    <Building2 className="w-8 h-8 text-maasai mb-6" strokeWidth={1} />
                    <p className="text-5xl font-serif mb-2">12,847</p>
                    <p className="text-foreground/60 text-sm uppercase tracking-widest">Projects verified</p>
                  </div>
                  <div>
                    <Database className="w-8 h-8 text-maasai mb-6" strokeWidth={1} />
                    <p className="text-5xl font-serif text-maasai mb-2">KSH 4.2B</p>
                    <p className="text-foreground/60 text-sm uppercase tracking-widest leading-relaxed">Flagged for investigation</p>
                  </div>
                </div>
              </div>
              {/* Offset decorative block */}
              <div className="absolute top-8 -right-8 bottom-8 w-full bg-forest/5 -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-6 text-center border-t border-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-serif mb-8 leading-tight">
            Ready to make a <br/><span className="italic text-terracotta">difference?</span>
          </h2>
          <p className="text-xl text-foreground/70 font-light mb-16 max-w-2xl mx-auto leading-relaxed">
            Join thousands of Kenyans who are turning their smartphones into tools for transparency and national progress.
          </p>
          <Link href="/projects" className="inline-flex items-center gap-6 group">
            <span className="text-xl font-serif italic tracking-wide group-hover:text-terracotta transition-colors">View Active Projects</span>
            <div className="w-16 h-16 rounded-full border border-foreground flex items-center justify-center group-hover:bg-foreground group-hover:text-sand transition-all duration-300">
              <ArrowRight className="w-6 h-6" strokeWidth={1} />
            </div>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 kenyan-pattern border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="USALAMA" width={24} height={24} className="object-contain" />
            <span className="font-serif tracking-widest uppercase text-sm">USALAMA Protocol</span>
          </div>
          <p className="text-sm text-foreground/60 font-light">A citizen-powered government oversight initiative.</p>
          <div className="flex items-center gap-8 font-medium text-xs tracking-widest uppercase">
            <Link href="/dashboard" className="hover:text-terracotta transition-colors">Admin Portal</Link>
            <Link href="/projects" className="hover:text-terracotta transition-colors">Public Registry</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
