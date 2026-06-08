import Link from "next/link";
import { ArrowRight, Zap, Shield, BarChart3, Users, Star, TrendingUp, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Insights",
      desc: "Claude AI analyzes every pitch for quality, viability, and investment readiness.",
    },
    {
      icon: Shield,
      title: "Verified Ecosystem",
      desc: "KYC-verified investors and DPIIT-verified startups for a trusted network.",
    },
    {
      icon: BarChart3,
      title: "Startup Health Scores",
      desc: "Real-time health scoring across 8 dimensions to benchmark your startup.",
    },
    {
      icon: Users,
      title: "Smart Matchmaking",
      desc: "AI-driven compatibility scores connect the right founders with the right investors.",
    },
    {
      icon: TrendingUp,
      title: "Deal Rooms",
      desc: "Private collaboration spaces with milestone tracking and document sharing.",
    },
    {
      icon: Zap,
      title: "Live Demo Days",
      desc: "Virtual pitch events with investor networking and startup showcases.",
    },
  ];

  const stats = [
    { value: "2,400+", label: "Startups" },
    { value: "850+", label: "Verified Investors" },
    { value: "₹1,200Cr+", label: "Deals Facilitated" },
    { value: "94%", label: "Satisfaction Rate" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">StartupMinds</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/startups" className="text-muted-foreground hover:text-foreground transition-colors">Startups</Link>
            <Link href="/investors" className="text-muted-foreground hover:text-foreground transition-colors">Investors</Link>
            <Link href="/events" className="text-muted-foreground hover:text-foreground transition-colors">Events</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild><Link href="/login">Sign In</Link></Button>
            <Button asChild><Link href="/register">Get Started <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-24 pb-20">
        <Badge variant="secondary" className="mb-6 gap-1.5">
          <Star className="h-3 w-3" /> India&apos;s #1 Startup-Investor Platform
        </Badge>
        <h1 className="max-w-4xl text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
          Where Startups{" "}
          <span className="text-primary">Meet Their Future</span>
        </h1>
        <p className="max-w-2xl text-xl text-muted-foreground mb-10 leading-relaxed">
          AI-powered matchmaking, verified investors, and a curated ecosystem to help you
          raise capital faster and smarter.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" asChild className="text-base px-8">
            <Link href="/register?role=founder">Pitch Your Startup <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="text-base px-8">
            <Link href="/register?role=investor">I&apos;m an Investor</Link>
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to raise capital
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From AI-powered pitch analysis to secure deal rooms, StartupMinds provides
              the complete infrastructure for startup fundraising.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border bg-card p-6 hover:border-primary/50 hover:shadow-lg transition-all duration-200"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to accelerate your startup journey?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of founders and investors building the future together.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-base px-8">
            <Link href="/register">Start for Free <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-6">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            <span>© 2025 StartupMinds. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
