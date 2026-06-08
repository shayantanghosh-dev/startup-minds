"use client";

import Link from "next/link";
import {
  ArrowRight, Eye, Heart, Bookmark, TrendingUp, Rocket,
  FileText, Users, BarChart3, Plus, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StartupHealthScoreCard } from "@/components/startup/health-score-card";
import { formatNumber, formatRelativeTime } from "@/lib/utils";
import type { Startup, Pitch } from "@/types";

interface FounderOverviewProps {
  startup: (Startup & { startup_health_scores?: { overall_score: number }[] }) | null;
  pitch: Pitch | null;
  stats: Record<string, number> | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "secondary" },
  submitted: { label: "Submitted", color: "default" },
  under_review: { label: "Under Review", color: "default" },
  changes_requested: { label: "Changes Requested", color: "destructive" },
  approved: { label: "Approved", color: "default" },
  published: { label: "Published", color: "default" },
  rejected: { label: "Rejected", color: "destructive" },
};

export function FounderOverview({ startup, pitch, stats }: FounderOverviewProps) {
  const healthScore = startup?.startup_health_scores?.[0]?.overall_score ?? 0;

  if (!startup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="rounded-full bg-primary/10 p-6">
          <Rocket className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Create Your Startup Profile</h2>
          <p className="text-muted-foreground max-w-md">
            Start by creating your startup profile to unlock all features including
            AI-powered pitch analysis, investor matching, and more.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/dashboard/founder/startup/new">
            <Plus className="mr-2 h-5 w-5" /> Create Startup Profile
          </Link>
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      label: "Profile Views",
      value: formatNumber(startup.total_views),
      icon: Eye,
      change: "+12% this week",
    },
    {
      label: "Investor Likes",
      value: formatNumber(startup.total_likes),
      icon: Heart,
      change: "+5 this week",
    },
    {
      label: "Bookmarks",
      value: formatNumber(startup.total_bookmarks),
      icon: Bookmark,
      change: "+3 this week",
    },
    {
      label: "Health Score",
      value: `${healthScore}/100`,
      icon: TrendingUp,
      change: "Updated today",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back 👋</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with <strong>{startup.name}</strong>
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/founder/pitch">
            <FileText className="mr-2 h-4 w-4" />
            {pitch ? "Manage Pitch" : "Create Pitch"}
          </Link>
        </Button>
      </div>

      {/* Changes requested banner */}
      {pitch?.status === "changes_requested" && (
        <div className="flex items-start gap-3 rounded-lg border border-orange-500/50 bg-orange-50 dark:bg-orange-950/20 p-4">
          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-orange-800 dark:text-orange-200">
              Changes requested for your pitch
            </p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
              {pitch.changes_requested ?? "Please review the reviewer feedback and update your pitch."}
            </p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href="/dashboard/founder/pitch">View Feedback <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className="rounded-lg bg-primary/10 p-2">
                  <stat.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Startup Health Score */}
        <StartupHealthScoreCard score={healthScore} startupId={startup.id} />

        {/* Pitch Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pitch Status</CardTitle>
            <CardDescription>Current pitch lifecycle status</CardDescription>
          </CardHeader>
          <CardContent>
            {pitch ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Current Status</span>
                  <Badge variant={
                    STATUS_CONFIG[pitch.status]?.color === "destructive" ? "destructive" : "secondary"
                  }>
                    {STATUS_CONFIG[pitch.status]?.label ?? pitch.status}
                  </Badge>
                </div>

                {/* Lifecycle progress */}
                <div className="space-y-2">
                  {["draft", "submitted", "under_review", "approved", "published"].map((status, idx) => {
                    const statuses = ["draft", "submitted", "under_review", "approved", "published"];
                    const currentIdx = statuses.indexOf(pitch.status);
                    const isDone = idx <= currentIdx;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${isDone ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        <span className={`text-xs capitalize ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                          {status.replace("_", " ")}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {!!(pitch.ai_quality_score) && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">AI Quality Score</span>
                      <span className="text-sm font-bold">{pitch.ai_quality_score as number}/100</span>
                    </div>
                    <Progress value={pitch.ai_quality_score as number} className="h-2" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">No pitch submitted yet</p>
                <Button size="sm" asChild>
                  <Link href="/dashboard/founder/pitch/new">Create Pitch</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Edit Startup", href: "/dashboard/founder/startup", icon: Rocket },
              { label: "View Analytics", href: "/dashboard/founder/analytics", icon: BarChart3 },
              { label: "Browse Investors", href: "/dashboard/founder/investors", icon: Users },
              { label: "Manage Data Room", href: "/dashboard/founder/data-room", icon: FileText },
            ].map((action) => (
              <Button key={action.label} variant="outline" asChild className="h-auto flex-col py-4 gap-2">
                <Link href={action.href}>
                  <action.icon className="h-5 w-5 text-primary" />
                  <span className="text-xs">{action.label}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
