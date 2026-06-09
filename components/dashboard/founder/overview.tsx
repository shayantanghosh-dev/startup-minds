"use client";

import Link from "next/link";
import {
  ArrowRight, Eye, Users, TrendingUp, Rocket,
  FileText, BarChart3, Plus, AlertCircle, Zap,
  CheckCircle2, Star, MessageSquare, Target, ChevronRight,
  Activity, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StartupHealthScoreCard } from "@/components/startup/health-score-card";
import { OnboardingChecklist, buildFounderSteps } from "@/components/dashboard/onboarding-checklist";
import { formatNumber } from "@/lib/utils";
import type { Startup, Pitch } from "@/types";

interface FounderOverviewProps {
  startup: (Startup & { startup_health_scores?: { overall_score: number }[] }) | null;
  pitch: Pitch | null;
  stats: Record<string, number> | null;
  profileComplete: boolean;
  recentMatches: Array<Record<string, unknown>>;
  hasConnections: boolean;
}

const PITCH_STATUS_CONFIG: Record<string, { label: string; color: string; description: string }> = {
  draft:            { label: "Draft",            color: "secondary",    description: "Finish your pitch to submit for review" },
  submitted:        { label: "Submitted",        color: "default",      description: "Your pitch is queued for expert review" },
  under_review:     { label: "Under Review",     color: "default",      description: "Our reviewers are evaluating your pitch" },
  changes_requested:{ label: "Action Required",  color: "destructive",  description: "Reviewer has requested changes" },
  approved:         { label: "Approved",         color: "default",      description: "Approved — awaiting publication" },
  published:        { label: "Live",             color: "default",      description: "Your pitch is visible to investors" },
  rejected:         { label: "Not Approved",     color: "destructive",  description: "Review the feedback and resubmit" },
};

const PITCH_STAGES = ["draft", "submitted", "under_review", "approved", "published"];
const STAGE_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "In Review",
  approved: "Approved",
  published: "Live",
};

export function FounderOverview({
  startup, pitch, stats, profileComplete, recentMatches, hasConnections
}: FounderOverviewProps) {
  const healthScore = startup?.startup_health_scores?.[0]?.overall_score ?? 0;

  if (!startup) {
    const steps = buildFounderSteps({
      hasStartup: false, hasTeam: false, hasPitch: false,
      pitchSubmitted: false, profileComplete,
    });
    return (
      <div className="space-y-8 max-w-2xl mx-auto pt-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to StartupMinds</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Your AI-powered fundraising command centre. Let&apos;s get your startup in front of the right investors.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Zap, title: "AI Health Score", description: "Get an instant evaluation of your startup's investment readiness" },
            { icon: Target, title: "Investor Matching", description: "Our AI finds investors whose thesis aligns with your vision" },
            { icon: Shield, title: "Expert Review", description: "Industry experts review and validate your pitch deck" },
          ].map((feat) => (
            <Card key={feat.title} className="text-center border-primary/10">
              <CardContent className="pt-6 pb-5">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 mb-3">
                  <feat.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1">{feat.title}</h3>
                <p className="text-xs text-muted-foreground">{feat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <OnboardingChecklist steps={steps} role="founder" />

        <Button size="lg" className="w-full" asChild>
          <Link href="/dashboard/founder/startup/new">
            <Plus className="mr-2 h-5 w-5" /> Create Your Startup Profile
          </Link>
        </Button>
      </div>
    );
  }

  const onboardingSteps = buildFounderSteps({
    hasStartup: true,
    hasTeam: !!(startup as unknown as Record<string, unknown>).startup_members,
    hasPitch: !!pitch,
    pitchSubmitted: !!pitch && pitch.status !== "draft",
    profileComplete,
  });

  const statCards = [
    {
      label: "Pitch Views",
      value: formatNumber(startup.total_views ?? 0),
      icon: Eye,
      change: "Total pitch views",
      href: "/dashboard/founder/analytics",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Investor Interest",
      value: formatNumber(startup.total_likes ?? 0),
      icon: Star,
      change: "Investors who liked your pitch",
      href: "/dashboard/founder/investors",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "AI Matches",
      value: formatNumber(recentMatches.length),
      icon: Zap,
      change: "Investors matched to your startup",
      href: "/dashboard/founder/investors",
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Health Score",
      value: healthScore > 0 ? `${healthScore}` : "—",
      icon: TrendingUp,
      change: healthScore > 0 ? "out of 100 · AI evaluated" : "Submit pitch to generate",
      href: "/dashboard/founder/analytics",
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
    },
  ];

  const pitchStatusConfig = pitch ? PITCH_STATUS_CONFIG[pitch.status] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {startup.name} <span className="text-muted-foreground font-normal text-base">Dashboard</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {startup.industry && (
              <Badge variant="secondary" className="text-xs">{startup.industry}</Badge>
            )}
            {startup.stage && (
              <Badge variant="outline" className="text-xs capitalize">{startup.stage.replace("_", " ")}</Badge>
            )}
            {healthScore > 0 && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                healthScore >= 75 ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                : healthScore >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
              }`}>
                Health: {healthScore}/100
              </span>
            )}
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/dashboard/founder/pitch">
            <FileText className="mr-2 h-4 w-4" />
            {pitch ? "Manage Pitch" : "Create Pitch"}
          </Link>
        </Button>
      </div>

      {/* Onboarding checklist (hidden when complete) */}
      <OnboardingChecklist steps={onboardingSteps} role="founder" />

      {/* Changes requested banner */}
      {pitch?.status === "changes_requested" && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-400/50 bg-orange-50 dark:bg-orange-950/30 p-4">
          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-orange-800 dark:text-orange-200 text-sm">
              Action Required — Reviewer Feedback Pending
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              {pitch.changes_requested ?? "A reviewer has requested changes to your pitch. Review the feedback and resubmit."}
            </p>
            <Button variant="outline" size="sm" className="mt-2 border-orange-400 text-orange-700 hover:bg-orange-100" asChild>
              <Link href="/dashboard/founder/pitch">Review Feedback <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </div>
      )}

      {/* Pitch approved/live banner */}
      {(pitch?.status === "approved" || pitch?.status === "published") && (
        <div className="flex items-center gap-3 rounded-xl border border-green-400/50 bg-green-50 dark:bg-green-950/30 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-semibold text-green-800 dark:text-green-200">
              {pitch.status === "published" ? "Your pitch is live — investors can discover you now" : "Pitch approved and awaiting publication"}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="text-green-700 shrink-0" asChild>
            <Link href="/dashboard/founder/investors">View Matches <ArrowRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <Card className="hover:border-primary/30 hover:shadow-sm transition-all">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</span>
                  <div className={`rounded-lg ${stat.bg} p-1.5`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-black tracking-tight">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                  {stat.change}
                  <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Health Score (wider) */}
        <div className="lg:col-span-3">
          <StartupHealthScoreCard score={healthScore} startupId={startup.id} />
        </div>

        {/* Pitch Status */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Pitch Status
            </CardTitle>
            <CardDescription>Live fundraising progress</CardDescription>
          </CardHeader>
          <CardContent>
            {pitch ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current Stage</span>
                  <Badge
                    variant={pitchStatusConfig?.color === "destructive" ? "destructive" : pitchStatusConfig?.color === "default" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {pitchStatusConfig?.label ?? pitch.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{pitchStatusConfig?.description}</p>

                <div className="space-y-2 pt-1">
                  {PITCH_STAGES.map((stage, idx) => {
                    const currentIdx = PITCH_STAGES.indexOf(pitch.status);
                    const isDone = idx <= currentIdx && pitch.status !== "rejected";
                    const isCurrent = idx === currentIdx;
                    return (
                      <div key={stage} className="flex items-center gap-3">
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${
                          isDone ? "bg-primary" : "bg-muted"
                        }`}>
                          {isDone ? <CheckCircle2 className="h-3 w-3 text-primary-foreground" /> : <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />}
                        </div>
                        <span className={`text-xs ${isDone ? "text-foreground font-medium" : "text-muted-foreground"} ${isCurrent ? "font-semibold" : ""}`}>
                          {STAGE_LABELS[stage]}
                        </span>
                        {isCurrent && !isDone && <span className="text-[10px] text-primary font-medium ml-auto">← Current</span>}
                      </div>
                    );
                  })}
                </div>

                {(pitch.ai_quality_score as number) > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap className="h-3 w-3 text-primary" /> AI Quality Score
                      </span>
                      <span className="text-sm font-bold">{pitch.ai_quality_score as number}/100</span>
                    </div>
                    <Progress value={pitch.ai_quality_score as number} className="h-1.5" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-muted mb-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h4 className="font-medium text-sm mb-1">No pitch submitted yet</h4>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                  Create your pitch to get an AI quality score and start connecting with investors
                </p>
                <Button size="sm" asChild>
                  <Link href="/dashboard/founder/pitch/new">
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Your Pitch
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Investor matches preview + Quick actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent investor matches */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Top Investor Matches
                </CardTitle>
                <CardDescription>AI-curated for your startup</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/founder/investors">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentMatches.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-muted mb-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <h4 className="font-medium text-sm mb-1">No matches generated yet</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Complete your startup profile and submit your pitch to unlock AI-powered investor matching
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/founder/pitch">Complete Your Pitch</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((match, i) => {
                  const inv = match.investors as Record<string, unknown> ?? {};
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {String(inv.organization ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{inv.organization as string ?? "Investor"}</p>
                        <p className="text-xs text-muted-foreground">AI match</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {match.compatibility_score as number}% match
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Most used features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Edit Startup Profile", href: "/dashboard/founder/startup", icon: Rocket, desc: "Update details" },
                { label: "View Analytics", href: "/dashboard/founder/analytics", icon: BarChart3, desc: "Track performance" },
                { label: "Browse Investors", href: "/dashboard/founder/investors", icon: Users, desc: "Explore matches" },
                { label: "Manage Data Room", href: "/dashboard/founder/data-room", icon: FileText, desc: "Share documents" },
                { label: "Connections", href: "/dashboard/founder/connections", icon: MessageSquare, desc: "Your network" },
                { label: "Deal Rooms", href: "/dashboard/founder/deal-rooms", icon: TrendingUp, desc: "Active deals" },
              ].map((action) => (
                <Button key={action.label} variant="outline" asChild className="h-auto flex-col py-3 gap-1.5 justify-start items-start px-3 hover:border-primary/30">
                  <Link href={action.href}>
                    <action.icon className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium leading-tight">{action.label}</span>
                    <span className="text-[11px] text-muted-foreground">{action.desc}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
