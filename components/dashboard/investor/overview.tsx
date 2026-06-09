"use client";

import Link from "next/link";
import {
  Search, Star, Briefcase, ArrowRight, AlertCircle, CheckCircle2,
  TrendingUp, Zap, Shield, Target, MessageSquare, Calendar,
  ChevronRight, Activity, DollarSign, Users, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { OnboardingChecklist, buildInvestorSteps } from "@/components/dashboard/onboarding-checklist";
import { getInitials } from "@/lib/utils";
import type { Investor } from "@/types";

interface InvestorOverviewProps {
  investor: Investor | null;
  crmRecords: Array<Record<string, unknown>>;
  matches: Array<Record<string, unknown>>;
}

const CRM_STAGE_LABELS: Record<string, string> = {
  interested: "Interested",
  contacted: "Contacted",
  meeting_scheduled: "Meeting Set",
  due_diligence: "Due Diligence",
  negotiation: "Negotiating",
  invested: "Invested",
  passed: "Passed",
  closed: "Closed",
};

const CRM_STAGE_COLORS: Record<string, string> = {
  interested: "bg-blue-100 text-blue-700",
  contacted: "bg-indigo-100 text-indigo-700",
  meeting_scheduled: "bg-purple-100 text-purple-700",
  due_diligence: "bg-amber-100 text-amber-700",
  negotiation: "bg-orange-100 text-orange-700",
  invested: "bg-green-100 text-green-700",
  passed: "bg-gray-100 text-gray-600",
  closed: "bg-gray-100 text-gray-600",
};

export function InvestorOverview({ investor, crmRecords, matches }: InvestorOverviewProps) {
  if (!investor) {
    const steps = buildInvestorSteps({
      profileComplete: false, kycSubmitted: false, kycApproved: false,
      thesisAdded: false, firstReview: false,
    });
    return (
      <div className="space-y-8 max-w-2xl mx-auto pt-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <Briefcase className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome, Investor</h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Access a curated pipeline of AI-scored, expert-reviewed startups. Complete your profile to unlock deal flow.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Zap, title: "AI-Powered Deal Flow", description: "Our AI matches startups to your thesis and investment criteria" },
            { icon: Shield, title: "Expert-Reviewed Pitches", description: "Every pitch is reviewed and scored before you see it" },
            { icon: Target, title: "Structured CRM", description: "Track your pipeline from first contact to investment close" },
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

        <OnboardingChecklist steps={steps} role="investor" />

        <Button size="lg" className="w-full" asChild>
          <Link href="/dashboard/investor/settings">
            <Briefcase className="mr-2 h-5 w-5" /> Complete Investor Profile
          </Link>
        </Button>
      </div>
    );
  }

  const onboardingSteps = buildInvestorSteps({
    profileComplete: !!(investor.organization || investor.investment_thesis),
    kycSubmitted: !!investor.kyc_status,
    kycApproved: investor.kyc_status === "approved",
    thesisAdded: !!(investor.investment_thesis),
    firstReview: crmRecords.length > 0,
  });

  const isKYCPending = investor.kyc_status !== "approved";
  const activeDeals = crmRecords.filter(r => !["passed", "closed", "invested"].includes(r.stage as string));
  const investedDeals = crmRecords.filter(r => r.stage === "invested");

  const statCards = [
    {
      label: "Pipeline Companies",
      value: activeDeals.length.toString(),
      icon: Briefcase,
      change: "Active deal opportunities",
      href: "/dashboard/investor/crm",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "AI Matches",
      value: matches.length.toString(),
      icon: Zap,
      change: "Startups matching your thesis",
      href: "/dashboard/investor/matches",
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Investments Made",
      value: investedDeals.length.toString(),
      icon: DollarSign,
      change: "Deals closed via platform",
      href: "/dashboard/investor/portfolio",
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "Total Tracked",
      value: crmRecords.length.toString(),
      icon: BarChart3,
      change: "Companies in pipeline",
      href: "/dashboard/investor/crm",
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {investor.organization ?? "Investment"} <span className="text-muted-foreground font-normal text-base">Dashboard</span>
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {investor.organization_type && (
              <Badge variant="secondary" className="text-xs capitalize">{investor.organization_type.replace("_", " ")}</Badge>
            )}
            {investor.is_verified && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Verified
              </span>
            )}
            {investor.min_ticket_size && (
              <span className="text-xs text-muted-foreground">
                ₹{(investor.min_ticket_size / 100000).toFixed(0)}L – {investor.max_ticket_size ? `₹${(investor.max_ticket_size / 100000).toFixed(0)}L` : "Open"} ticket
              </span>
            )}
          </div>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/dashboard/investor/discover">
            <Search className="mr-2 h-4 w-4" /> Discover Startups
          </Link>
        </Button>
      </div>

      {/* Onboarding */}
      <OnboardingChecklist steps={onboardingSteps} role="investor" />

      {/* KYC Banner */}
      {isKYCPending && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${
          investor.kyc_status === "under_review"
            ? "border-blue-400/50 bg-blue-50 dark:bg-blue-950/30"
            : "border-orange-400/50 bg-orange-50 dark:bg-orange-950/30"
        }`}>
          <AlertCircle className={`h-5 w-5 mt-0.5 shrink-0 ${investor.kyc_status === "under_review" ? "text-blue-500" : "text-orange-500"}`} />
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {investor.kyc_status === "under_review" ? "KYC Verification In Progress" : "KYC Verification Required"}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {investor.kyc_status === "under_review"
                ? "Your documents are under review. Full access will be granted once approved (24–48 hours)."
                : "Submit your KYC documents to unlock full access to startup pitches, deal rooms, and investment features."}
            </p>
            {investor.kyc_status !== "under_review" && (
              <Button variant="outline" size="sm" className="mt-2" asChild>
                <Link href="/dashboard/investor/kyc">Complete KYC <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {investor.kyc_status === "approved" && (
        <div className="flex items-center gap-3 rounded-xl border border-green-400/50 bg-green-50 dark:bg-green-950/30 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
          <span className="text-sm font-semibold text-green-800 dark:text-green-300">
            Verified Investor — Full platform access unlocked
          </span>
          <Button variant="ghost" size="sm" className="ml-auto text-green-700 shrink-0" asChild>
            <Link href="/dashboard/investor/discover">Explore Startups <ChevronRight className="ml-1 h-3 w-3" /></Link>
          </Button>
        </div>
      )}

      {/* Stats */}
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Matches */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> AI-Matched Startups
                </CardTitle>
                <CardDescription>Startups aligned with your thesis</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/investor/matches">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-muted mb-3">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                </div>
                <h4 className="font-medium text-sm mb-1">No matches yet</h4>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                  Complete your investment thesis so our AI can surface the right startups for you
                </p>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard/investor/settings">Add Investment Thesis</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => {
                  const startup = match.startups as Record<string, unknown>;
                  const healthScore = startup?.health_score as number ?? 0;
                  return (
                    <div key={match.id as string} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                          {getInitials(startup?.name as string ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{startup?.name as string}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground capitalize">
                            {(startup?.stage as string ?? "").replace("_", " ")}
                          </span>
                          {healthScore > 0 && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                              healthScore >= 75 ? "bg-green-100 text-green-700" : healthScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            }`}>
                              Score: {healthScore}
                            </span>
                          )}
                        </div>
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

        {/* CRM Pipeline */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" /> Deal Pipeline
                </CardTitle>
                <CardDescription>Your active investment opportunities</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/investor/crm">Manage CRM <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {crmRecords.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-muted mb-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </div>
                <h4 className="font-medium text-sm mb-1">Your pipeline is empty</h4>
                <p className="text-xs text-muted-foreground mb-4 max-w-xs mx-auto">
                  Start building your deal pipeline by discovering and saving startups that match your criteria
                </p>
                <Button size="sm" asChild>
                  <Link href="/dashboard/investor/discover">
                    <Search className="mr-1.5 h-3.5 w-3.5" /> Discover Startups
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {crmRecords.slice(0, 5).map((record) => {
                  const startup = record.startups as Record<string, string>;
                  const stageKey = record.stage as string;
                  return (
                    <div key={record.id as string} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                          {getInitials(startup?.name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{startup?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{startup?.industry}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${CRM_STAGE_COLORS[stageKey] ?? "bg-gray-100 text-gray-600"}`}>
                        {CRM_STAGE_LABELS[stageKey] ?? stageKey}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Jump to your most-used features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: "Discover Startups", href: "/dashboard/investor/discover", icon: Search, desc: "Browse deals" },
              { label: "View Matches", href: "/dashboard/investor/matches", icon: Star, desc: "AI-curated" },
              { label: "CRM Pipeline", href: "/dashboard/investor/crm", icon: Briefcase, desc: "Track deals" },
              { label: "Messages", href: "/dashboard/investor/messages", icon: MessageSquare, desc: "Conversations" },
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
  );
}
