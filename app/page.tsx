import Link from "next/link";
import {
  ArrowRight, Zap, Shield, BarChart3, Users, Star, TrendingUp, Brain,
  CheckCircle2, ChevronDown, Target, MessageSquare, FileText, Briefcase,
  Award, Globe, Building2, Sparkles, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ──────────── NAV ──────────── */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6 max-w-7xl">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <span className="font-bold text-lg">StartupMinds</span>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5 hidden sm:block">AI Fundraising Platform</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</Link>
            <Link href="#health-score" className="text-muted-foreground hover:text-foreground transition-colors">Health Score</Link>
            <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link href="/login">Sign In</Link></Button>
            <Button size="sm" asChild className="shadow-sm">
              <Link href="/register">Get Started Free <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ──────────── HERO ──────────── */}
      <section className="relative overflow-hidden px-6 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-primary/5 blur-3xl" />
        </div>

        <Badge variant="secondary" className="mb-6 gap-1.5 text-xs px-3 py-1">
          <Star className="h-3 w-3 text-amber-500" />
          India&apos;s AI-First Startup-Investor Platform
        </Badge>

        <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl md:text-[68px] font-extrabold tracking-tight leading-[1.1] mb-6">
          Raise Capital{" "}
          <span className="text-primary">Smarter.</span>{" "}
          <br className="hidden md:block" />
          Invest{" "}
          <span className="text-primary">with Confidence.</span>
        </h1>

        <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
          StartupMinds combines AI-powered pitch analysis, smart investor matching, and
          expert reviews to connect the right founders with the right capital — faster
          than ever before.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="text-base px-8 h-12 shadow-md" asChild>
            <Link href="/register?role=founder">
              Pitch Your Startup <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
            <Link href="/register?role=investor">I&apos;m an Investor</Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          No upfront fees · KYC-verified network · AI-scored pitches
        </p>
      </section>

      {/* ──────────── SOCIAL PROOF ──────────── */}
      <section className="border-y bg-muted/40 py-14">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "2,400+", label: "Startups Onboarded", icon: Building2 },
              { value: "850+", label: "Verified Investors", icon: Shield },
              { value: "₹1,200Cr+", label: "Deals Facilitated", icon: TrendingUp },
              { value: "94%", label: "Satisfaction Rate", icon: Award },
            ].map((s) => (
              <div key={s.label}>
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 mb-3">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-black text-primary mb-1">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── FEATURES ──────────── */}
      <section id="features" className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-3 text-xs">Platform Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything fundraising needs under one roof
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From AI pitch analysis to deal room collaboration, StartupMinds provides
              the complete infrastructure for modern startup fundraising.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: "AI Pitch Analysis",
                desc: "Gemini AI scores every pitch across multiple dimensions — clarity, traction, team, and market opportunity — before investors ever see it.",
                badge: "AI-Powered",
              },
              {
                icon: BarChart3,
                title: "Startup Health Score™",
                desc: "Real-time health scoring across 8 business dimensions to benchmark your startup against peers and surface areas to improve.",
                badge: "Proprietary",
              },
              {
                icon: Target,
                title: "Smart Investor Matching",
                desc: "AI-driven compatibility matching connects founders with investors who actually align with their sector, stage, and thesis.",
                badge: "AI-Powered",
              },
              {
                icon: Shield,
                title: "Verified Ecosystem",
                desc: "Every investor is KYC-verified and every startup is screened. You're always working with serious, credible counterparts.",
                badge: "Trust & Safety",
              },
              {
                icon: Briefcase,
                title: "Private Deal Rooms",
                desc: "Secure collaboration spaces with milestone tracking, document signing, and structured term sheet management.",
                badge: "Enterprise",
              },
              {
                icon: FileText,
                title: "Expert Pitch Reviews",
                desc: "Human expert reviewers provide structured feedback on every submitted pitch, giving founders actionable improvements.",
                badge: "Expert Network",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-xl border bg-card p-6 hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="absolute top-4 right-4">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{feature.badge}</span>
                </div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-base mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── HOW IT WORKS ──────────── */}
      <section id="how-it-works" className="py-24 px-6 bg-muted/30 border-y">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <Badge variant="secondary" className="mb-3 text-xs">Simple Process</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How StartupMinds works</h2>
            <p className="text-muted-foreground text-lg">
              From signup to funded in as little as 90 days
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            {/* For Founders */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                </div>
                <span className="font-bold text-base">For Founders</span>
              </div>
              <div className="space-y-5">
                {[
                  { step: "1", title: "Create your startup profile", desc: "Add your team, product, traction, and upload your pitch deck" },
                  { step: "2", title: "AI scores your pitch", desc: "Gemini AI analyzes your pitch and generates a Health Score™" },
                  { step: "3", title: "Expert review + feedback", desc: "Our reviewer network provides structured, actionable feedback" },
                  { step: "4", title: "Get matched with investors", desc: "AI surfaces the right investors based on thesis fit and compatibility" },
                  { step: "5", title: "Close deals in deal rooms", desc: "Collaborate privately with interested investors and close your round" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="shrink-0 h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">{item.step}</div>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* For Investors */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-300" />
                </div>
                <span className="font-bold text-base">For Investors</span>
              </div>
              <div className="space-y-5">
                {[
                  { step: "1", title: "Complete KYC verification", desc: "One-time identity verification for a fully trusted network" },
                  { step: "2", title: "Set your investment thesis", desc: "Define your sector focus, ticket size, and stage preference" },
                  { step: "3", title: "Receive AI-curated deal flow", desc: "AI surfaces pre-screened, expert-reviewed startups matching your thesis" },
                  { step: "4", title: "Discover, browse, and bookmark", desc: "Browse the full leaderboard or explore AI matches with compatibility scores" },
                  { step: "5", title: "Engage via CRM and deal rooms", desc: "Track your pipeline, schedule meetings, and close investments" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="shrink-0 h-8 w-8 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-sm flex items-center justify-center">{item.step}</div>
                    <div>
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── HEALTH SCORE ──────────── */}
      <section id="health-score" className="py-24 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="secondary" className="mb-4 text-xs">Proprietary Technology</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-5 leading-tight">
                Introducing the{" "}
                <span className="text-primary">Startup Health Score™</span>
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-6">
                Our AI-powered Health Score gives every startup a real-time composite
                rating across 8 key business dimensions, providing the clearest picture
                of investment readiness in India.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  "Business model clarity & unit economics",
                  "Market size and growth opportunity",
                  "Team strength and execution history",
                  "Product quality and competitive moat",
                  "Traction: revenue, users, and retention",
                  "Fundraising readiness and documentation",
                ].map((point) => (
                  <div key={point} className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
              <Button asChild>
                <Link href="/register?role=founder">
                  Get Your Health Score <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Score visualization */}
            <div className="relative">
              <div className="rounded-2xl border bg-card p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">TechVision AI — Seed Stage</p>
                    <h3 className="text-xl font-bold mt-0.5">Overall Health Score</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-black text-primary">82</div>
                    <p className="text-xs text-green-600 font-semibold mt-0.5">Strong ↑</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Business Model", score: 88, color: "bg-green-500" },
                    { label: "Market Opportunity", score: 91, color: "bg-green-500" },
                    { label: "Team Strength", score: 79, color: "bg-blue-500" },
                    { label: "Product Quality", score: 84, color: "bg-blue-500" },
                    { label: "Traction", score: 71, color: "bg-amber-500" },
                    { label: "Fundraising Readiness", score: 76, color: "bg-amber-500" },
                  ].map((dim) => (
                    <div key={dim.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{dim.label}</span>
                        <span className="text-xs font-bold text-muted-foreground">{dim.score}/100</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${dim.color}`}
                          style={{ width: `${dim.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-4 text-center">Sample score — for illustration purposes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── TESTIMONIALS ──────────── */}
      <section className="py-24 px-6 bg-muted/30 border-y">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-3 text-xs">Success Stories</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Founders and investors love StartupMinds</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "The AI pitch analysis caught gaps in our deck I hadn't noticed. After fixing them, we got our first investor meeting within 2 weeks.",
                name: "Priya S.",
                role: "Founder, EdTech Startup · Pre-Seed",
                avatar: "PS",
              },
              {
                quote: "The deal flow quality here is unmatched. Every pitch I see has already been reviewed and scored — I spend 70% less time on discovery.",
                name: "Rahul M.",
                role: "Angel Investor · 12 Investments",
                avatar: "RM",
              },
              {
                quote: "StartupMinds gave us a Health Score of 78 with specific action items. We hit 89 the next month and closed our seed round shortly after.",
                name: "Aditya K.",
                role: "Co-Founder, SaaS Startup · Seed",
                avatar: "AK",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border bg-card p-6 flex flex-col gap-4">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => <Star key={n} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-2 border-t">
                  <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── FAQ ──────────── */}
      <section id="faq" className="py-24 px-6">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-3 text-xs">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Frequently asked questions</h2>
          </div>
          <div className="divide-y border rounded-xl overflow-hidden">
            {[
              {
                q: "Is StartupMinds free to use?",
                a: "Yes — basic access is free for founders and investors. Premium features like advanced deal rooms, priority matching, and detailed analytics are available on paid plans.",
              },
              {
                q: "How does the investor KYC process work?",
                a: "Investors submit government-issued ID and proof of accreditation. Our compliance team reviews submissions within 24–48 hours and approves access to the full platform.",
              },
              {
                q: "How accurate is the AI Health Score?",
                a: "The Health Score is generated by Gemini AI and validated against our expert reviewer network. It scores 8 dimensions and updates as you improve your startup profile and pitch.",
              },
              {
                q: "Can investors contact founders directly?",
                a: "Yes — once both parties have connected or a deal room is established, direct messaging and meeting scheduling are fully available within the platform.",
              },
              {
                q: "Is my data and pitch deck kept confidential?",
                a: "Absolutely. Your pitch materials are only shared with investors you've explicitly engaged with or who have been matched and have accepted the connection. Full NDA workflows are available in deal rooms.",
              },
            ].map((faq) => (
              <details key={faq.q} className="group px-6 py-5 bg-card cursor-pointer">
                <summary className="flex items-center justify-between gap-4 font-semibold text-sm list-none">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── FINAL CTA ──────────── */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground py-24 px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
        </div>
        <div className="container mx-auto max-w-3xl text-center relative">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-white/10 mb-6">
            <Zap className="h-7 w-7" />
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-5 leading-tight">
            Ready to accelerate your startup journey?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto">
            Join thousands of founders and investors who trust StartupMinds to connect, grow, and close deals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-base px-8 h-12 shadow-md">
              <Link href="/register?role=founder">
                I&apos;m a Founder <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8 h-12 border-white/30 text-white hover:bg-white/10">
              <Link href="/register?role=investor">I&apos;m an Investor</Link>
            </Button>
          </div>
          <p className="mt-6 text-xs text-primary-foreground/60">
            Free to start · No credit card required · KYC-verified network
          </p>
        </div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="border-t py-10 px-6 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-bold">StartupMinds</span>
              </Link>
              <p className="text-xs text-muted-foreground max-w-xs">
                India&apos;s AI-first platform connecting verified founders and investors for faster, smarter fundraising.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="font-semibold text-xs uppercase tracking-wide mb-3 text-muted-foreground">Platform</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                  <li><Link href="#health-score" className="hover:text-foreground transition-colors">Health Score™</Link></li>
                  <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-xs uppercase tracking-wide mb-3 text-muted-foreground">Join</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/register?role=founder" className="hover:text-foreground transition-colors">For Founders</Link></li>
                  <li><Link href="/register?role=investor" className="hover:text-foreground transition-colors">For Investors</Link></li>
                  <li><Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link></li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-xs uppercase tracking-wide mb-3 text-muted-foreground">Legal</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                  <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© 2026 StartupMinds Technologies Pvt. Ltd. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <Globe className="h-3 w-3" /> Made in India 🇮🇳 for Indian startups
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
