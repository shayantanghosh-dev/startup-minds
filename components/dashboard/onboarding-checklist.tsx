"use client";

import { CheckCircle2, Circle, ChevronRight, Zap } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

interface OnboardingChecklistProps {
  steps: Step[];
  role: "founder" | "investor";
}

export function OnboardingChecklist({ steps, role }: OnboardingChecklistProps) {
  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const nextStep = steps.find((s) => !s.done);

  if (pct === 100) return null; // Hide once complete

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-primary">Getting Started</span>
            </div>
            <h3 className="font-bold text-base">
              {pct === 0
                ? `Set up your ${role === "founder" ? "startup" : "investor"} profile`
                : `${pct}% complete — keep going!`}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {doneCount} of {steps.length} steps completed
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-black text-primary">{pct}%</div>
          </div>
        </div>
        <Progress value={pct} className="h-1.5 mt-3" />
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="space-y-2 mb-4">
          {steps.map((step, idx) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                step.done
                  ? "opacity-50"
                  : idx === steps.findIndex((s) => !s.done)
                  ? "bg-primary/10 border border-primary/20"
                  : "opacity-70"
              )}
            >
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Circle className={cn("h-4 w-4 shrink-0", idx === steps.findIndex((s) => !s.done) ? "text-primary" : "text-muted-foreground/40")} />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("font-medium truncate text-xs", step.done ? "line-through text-muted-foreground" : "")}>
                  {step.label}
                </p>
                {!step.done && idx === steps.findIndex((s) => !s.done) && (
                  <p className="text-[11px] text-muted-foreground truncate">{step.description}</p>
                )}
              </div>
              {!step.done && idx === steps.findIndex((s) => !s.done) && (
                <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
              )}
            </div>
          ))}
        </div>
        {nextStep && (
          <Button size="sm" className="w-full" asChild>
            <Link href={nextStep.href}>
              Continue Setup <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Helper to build founder steps from data
export function buildFounderSteps(opts: {
  hasStartup: boolean;
  hasTeam: boolean;
  hasPitch: boolean;
  pitchSubmitted: boolean;
  profileComplete: boolean;
}): Step[] {
  return [
    {
      id: "profile",
      label: "Complete your profile",
      description: "Add your bio, location, and social links",
      href: "/dashboard/founder/settings",
      done: opts.profileComplete,
    },
    {
      id: "startup",
      label: "Create your startup profile",
      description: "Tell investors about your company, team, and vision",
      href: "/dashboard/founder/startup",
      done: opts.hasStartup,
    },
    {
      id: "team",
      label: "Add your team members",
      description: "Investors want to know who's building your product",
      href: "/dashboard/founder/startup",
      done: opts.hasTeam,
    },
    {
      id: "pitch",
      label: "Upload your pitch deck",
      description: "Share your story with potential investors",
      href: "/dashboard/founder/pitch",
      done: opts.hasPitch,
    },
    {
      id: "submit",
      label: "Submit for review",
      description: "Get your pitch reviewed by our expert team",
      href: "/dashboard/founder/pitch",
      done: opts.pitchSubmitted,
    },
  ];
}

// Helper to build investor steps from data
export function buildInvestorSteps(opts: {
  profileComplete: boolean;
  kycSubmitted: boolean;
  kycApproved: boolean;
  thesisAdded: boolean;
  firstReview: boolean;
}): Step[] {
  return [
    {
      id: "profile",
      label: "Complete investor profile",
      description: "Add your organization, focus areas, and thesis",
      href: "/dashboard/investor/settings",
      done: opts.profileComplete,
    },
    {
      id: "kyc_submit",
      label: "Submit KYC documents",
      description: "Required to access startup pitches and deals",
      href: "/dashboard/investor/kyc",
      done: opts.kycSubmitted,
    },
    {
      id: "kyc_approved",
      label: "KYC approved",
      description: "Our team reviews your submission (24-48 hrs)",
      href: "/dashboard/investor/kyc",
      done: opts.kycApproved,
    },
    {
      id: "thesis",
      label: "Define your investment thesis",
      description: "Help our AI match you with the right startups",
      href: "/dashboard/investor/settings",
      done: opts.thesisAdded,
    },
    {
      id: "discover",
      label: "Review your first startup",
      description: "Start building your deal pipeline",
      href: "/dashboard/investor/discover",
      done: opts.firstReview,
    },
  ];
}
