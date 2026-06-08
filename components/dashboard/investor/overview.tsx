"use client";

import Link from "next/link";
import { Search, Star, Briefcase, ArrowRight, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatCurrency } from "@/lib/utils";
import type { Investor } from "@/types";

interface InvestorOverviewProps {
  investor: Investor | null;
  crmRecords: Array<Record<string, unknown>>;
  matches: Array<Record<string, unknown>>;
}

export function InvestorOverview({ investor, crmRecords, matches }: InvestorOverviewProps) {
  if (!investor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="rounded-full bg-primary/10 p-6">
          <Briefcase className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Complete Your Investor Profile</h2>
          <p className="text-muted-foreground max-w-md">
            Set up your investor profile to access startup pitches, connect with founders,
            and leverage AI-powered deal flow recommendations.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/investor/profile">Complete Profile</Link>
        </Button>
      </div>
    );
  }

  const isKYCPending = investor.kyc_status !== "approved";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investor Dashboard</h1>
          <p className="text-muted-foreground">
            {investor.organization ? `${investor.organization} • ` : ""}
            {investor.kyc_status === "approved" ? "Verified Investor" : "Pending Verification"}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/investor/discover">
            <Search className="mr-2 h-4 w-4" /> Discover Startups
          </Link>
        </Button>
      </div>

      {/* KYC Banner */}
      {isKYCPending && (
        <div className={`flex items-start gap-3 rounded-lg border p-4 ${
          investor.kyc_status === "under_review"
            ? "border-blue-500/50 bg-blue-50 dark:bg-blue-950/20"
            : "border-orange-500/50 bg-orange-50 dark:bg-orange-950/20"
        }`}>
          <AlertCircle className={`h-5 w-5 mt-0.5 shrink-0 ${
            investor.kyc_status === "under_review" ? "text-blue-500" : "text-orange-500"
          }`} />
          <div className="flex-1">
            <p className="font-medium">
              {investor.kyc_status === "under_review"
                ? "KYC verification in progress"
                : "KYC verification required"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {investor.kyc_status === "under_review"
                ? "Your documents are being reviewed. You&apos;ll be notified once approved."
                : "Complete KYC to access startup pitches and investment features."}
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
        <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-50 dark:bg-green-950/20 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Verified Investor — Full access to startup pitches
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pipeline Companies", value: crmRecords.length.toString(), icon: Briefcase },
          { label: "AI Matches", value: matches.length.toString(), icon: Star },
          { label: "Investments Made", value: (investor.total_investments ?? 0).toString(), icon: TrendingUp },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className="rounded-lg bg-primary/10 p-2">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Matches */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">AI Matches</CardTitle>
                <CardDescription>Startups matching your preferences</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/investor/matches">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {matches.length === 0 ? (
              <div className="text-center py-4">
                <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No matches yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => {
                  const startup = match.startups as Record<string, string>;
                  return (
                    <div key={match.id as string} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {getInitials(startup?.name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{startup?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {startup?.stage?.replace("_", " ")} • {startup?.industry}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="text-xs">
                          {match.compatibility_score as number}% match
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CRM Pipeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Pipeline</CardTitle>
                <CardDescription>Recent CRM activity</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/investor/crm">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {crmRecords.length === 0 ? (
              <div className="text-center py-4">
                <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No pipeline companies yet</p>
                <Button size="sm" className="mt-2" asChild>
                  <Link href="/dashboard/investor/discover">Discover Startups</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {crmRecords.map((record) => {
                  const startup = record.startups as Record<string, string>;
                  return (
                    <div key={record.id as string} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">
                          {getInitials(startup?.name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{startup?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {(record.stage as string).replace("_", " ")}
                        </p>
                      </div>
                      {(record.rating as number) > 0 && (
                        <div className="flex">
                          {Array.from({ length: record.rating as number }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
