export const dynamic = "force-dynamic";

import Link from "next/link";
import { Zap, CheckCircle2 } from "lucide-react";

const TRUST_POINTS = [
  "AI-powered pitch analysis using Google Gemini",
  "Verified, KYC-approved investor network",
  "Startup Health Score™ across 8 dimensions",
  "Private deal rooms with milestone tracking",
  "Expert reviewer feedback on every pitch",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col bg-primary text-primary-foreground p-12 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute right-0 bottom-1/4 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 mb-auto">
            <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center shadow-sm">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg">StartupMinds</span>
              <p className="text-[10px] text-primary-foreground/60 leading-none mt-0.5">AI Fundraising Platform</p>
            </div>
          </Link>

          {/* Headline */}
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold mb-4 leading-tight">
              Raise capital smarter.<br />
              <span className="text-white/70">Find the right investors.</span>
            </h1>
            <p className="text-primary-foreground/75 text-base leading-relaxed max-w-sm">
              India&apos;s AI-first platform connecting verified founders and investors for faster, smarter fundraising.
            </p>
          </div>

          {/* Trust points */}
          <div className="space-y-2.5 mb-10">
            {TRUST_POINTS.map((point) => (
              <div key={point} className="flex items-center gap-2.5 text-sm text-primary-foreground/85">
                <CheckCircle2 className="h-4 w-4 text-white/70 shrink-0" />
                {point}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "2,400+", label: "Startups" },
              { value: "850+", label: "Investors" },
              { value: "₹1,200Cr+", label: "Deals Closed" },
              { value: "94%", label: "Satisfaction" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-black">{stat.value}</div>
                <div className="text-primary-foreground/60 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth content */}
      <div className="flex flex-col items-center justify-center p-8 lg:p-12 bg-background">
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">StartupMinds</span>
          </Link>
        </div>
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
