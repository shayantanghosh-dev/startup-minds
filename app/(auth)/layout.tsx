export const dynamic = "force-dynamic";

import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col bg-primary text-primary-foreground p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
        <div className="relative z-10 flex flex-col h-full">
          <Link href="/" className="flex items-center gap-2 mb-auto">
            <div className="h-8 w-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
              <Zap className="h-4 w-4" />
            </div>
            <span className="font-bold text-xl">StartupMinds</span>
          </Link>

          <div className="mb-auto">
            <h1 className="text-4xl font-bold mb-4 leading-tight">
              Where Startups Meet<br />Their Future
            </h1>
            <p className="text-primary-foreground/80 text-lg leading-relaxed max-w-sm">
              Join India&apos;s premier startup-investor ecosystem. AI-powered insights,
              verified investors, and the tools to accelerate your fundraising.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "2,400+", label: "Startups" },
              { value: "850+", label: "Investors" },
              { value: "₹1,200Cr+", label: "Deals" },
              { value: "94%", label: "Success Rate" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg bg-primary-foreground/10 p-4">
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-primary-foreground/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right auth content */}
      <div className="flex flex-col items-center justify-center p-8 lg:p-12">
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
