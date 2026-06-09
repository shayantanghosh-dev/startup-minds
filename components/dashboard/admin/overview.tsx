"use client";

import Link from "next/link";
import {
  Users, Rocket, FileText, ShieldCheck, Flag,
  ArrowRight, BarChart3, Clock, CheckCircle2, AlertTriangle,
  ChevronRight, Megaphone, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

interface AdminOverviewProps {
  stats: {
    totalUsers: number;
    totalStartups: number;
    pendingPitches: number;
    pendingKYC: number;
    pendingReports: number;
  };
  recentPitches: Array<Record<string, unknown>>;
}

export function AdminOverview({ stats, recentPitches }: AdminOverviewProps) {
  const totalPending = stats.pendingPitches + stats.pendingKYC + stats.pendingReports;

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      href: "/dashboard/admin/users",
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Total Startups",
      value: stats.totalStartups.toLocaleString(),
      icon: Rocket,
      href: "/dashboard/admin/startups",
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingPitches.toString(),
      icon: Clock,
      href: "/dashboard/admin/pitches",
      color: "text-orange-600",
      bg: "bg-orange-50 dark:bg-orange-950",
      urgent: stats.pendingPitches > 0,
    },
    {
      label: "Pending KYC",
      value: stats.pendingKYC.toString(),
      icon: ShieldCheck,
      href: "/dashboard/admin/investors",
      color: "text-yellow-600",
      bg: "bg-yellow-50 dark:bg-yellow-950",
      urgent: stats.pendingKYC > 0,
    },
    {
      label: "Open Reports",
      value: stats.pendingReports.toString(),
      icon: Flag,
      href: "/dashboard/admin/reports",
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950",
      urgent: stats.pendingReports > 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Admin Control Center</h1>
          <p className="text-muted-foreground text-sm">Platform overview and management</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/admin/announcements">
              <Megaphone className="mr-1.5 h-3.5 w-3.5" /> Announce
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/admin/events">
              <Calendar className="mr-1.5 h-3.5 w-3.5" /> Events
            </Link>
          </Button>
        </div>
      </div>

      {/* Priority action banner */}
      {totalPending > 0 && (
        <div className="rounded-xl border border-orange-400/50 bg-orange-50 dark:bg-orange-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
            <p className="font-semibold text-sm text-orange-900 dark:text-orange-100">
              {totalPending} item{totalPending !== 1 ? "s" : ""} require your attention
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stats.pendingPitches > 0 && (
              <Button size="sm" variant="outline" className="border-orange-400 text-orange-800 hover:bg-orange-100 gap-1.5 h-7 text-xs" asChild>
                <Link href="/dashboard/admin/pitches">
                  <Clock className="h-3 w-3" /> {stats.pendingPitches} Pitches to assign
                </Link>
              </Button>
            )}
            {stats.pendingKYC > 0 && (
              <Button size="sm" variant="outline" className="border-yellow-400 text-yellow-800 hover:bg-yellow-100 gap-1.5 h-7 text-xs" asChild>
                <Link href="/dashboard/admin/investors">
                  <ShieldCheck className="h-3 w-3" /> {stats.pendingKYC} KYC to review
                </Link>
              </Button>
            )}
            {stats.pendingReports > 0 && (
              <Button size="sm" variant="outline" className="border-red-400 text-red-800 hover:bg-red-100 gap-1.5 h-7 text-xs" asChild>
                <Link href="/dashboard/admin/reports">
                  <Flag className="h-3 w-3" /> {stats.pendingReports} Reports pending
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <Card className={`hover:shadow-md transition-all hover:border-primary/30 ${stat.urgent ? "border-orange-400/50" : ""}`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.label}</span>
                  <div className={`rounded-lg ${stat.bg} p-1.5`}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                </div>
                <p className={`text-2xl font-black ${stat.urgent ? stat.color : ""}`}>{stat.value}</p>
                {stat.urgent && (
                  <p className="text-[10px] font-medium text-orange-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-2.5 w-2.5" /> Needs action
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent submissions — with inline Review button */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Submissions</CardTitle>
                <CardDescription>Pitches waiting for assignment</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/admin/pitches">All pitches <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentPitches.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-sm">All pitches handled!</p>
                <p className="text-xs text-muted-foreground mt-1">New submissions will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPitches.map((pitch) => {
                  const startup = pitch.startups as Record<string, string>;
                  const isSubmitted = (pitch.status as string) === "submitted";
                  return (
                    <div key={pitch.id as string} className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${isSubmitted ? "bg-orange-400 animate-pulse" : "bg-primary"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{startup?.name ?? "Unknown Startup"}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Badge
                            className={`text-[10px] py-0 px-1.5 h-4 ${isSubmitted ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}
                            variant="outline"
                          >
                            {(pitch.status as string).replace("_", " ")}
                          </Badge>
                          <span>{formatRelativeTime(pitch.created_at as string)}</span>
                        </div>
                      </div>
                      <Button variant={isSubmitted ? "default" : "outline"} size="sm" className="h-7 text-xs px-2.5 shrink-0" asChild>
                        <Link href={`/dashboard/admin/pitches/${pitch.id}`}>
                          {isSubmitted ? "Assign" : "View"}
                        </Link>
                      </Button>
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
            <CardDescription>Jump to common admin workflows</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "Review & Assign Pitches", href: "/dashboard/admin/pitches", icon: FileText, desc: "Assign pitches to reviewers", count: stats.pendingPitches },
                { label: "Verify KYC Documents", href: "/dashboard/admin/investors", icon: ShieldCheck, desc: "Approve investor verifications", count: stats.pendingKYC },
                { label: "Manage Users", href: "/dashboard/admin/users", icon: Users, desc: "View, search, and manage accounts" },
                { label: "Platform Analytics", href: "/dashboard/admin/analytics", icon: BarChart3, desc: "Engagement and growth metrics" },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:border-primary/30 hover:bg-muted/50 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <action.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {action.count !== undefined && action.count > 0 && (
                      <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200" variant="outline">
                        {action.count}
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
