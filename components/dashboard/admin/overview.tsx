"use client";

import Link from "next/link";
import {
  Users, Rocket, FileText, ShieldCheck, Flag,
  ArrowRight, BarChart3, Clock, CheckCircle2, AlertTriangle
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
  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      href: "/dashboard/admin/users",
      color: "text-blue-600",
    },
    {
      label: "Total Startups",
      value: stats.totalStartups.toLocaleString(),
      icon: Rocket,
      href: "/dashboard/admin/startups",
      color: "text-purple-600",
    },
    {
      label: "Pending Reviews",
      value: stats.pendingPitches.toString(),
      icon: Clock,
      href: "/dashboard/admin/pitches",
      color: "text-orange-600",
      urgent: stats.pendingPitches > 0,
    },
    {
      label: "Pending KYC",
      value: stats.pendingKYC.toString(),
      icon: ShieldCheck,
      href: "/dashboard/admin/investors",
      color: "text-yellow-600",
      urgent: stats.pendingKYC > 0,
    },
    {
      label: "Pending Reports",
      value: stats.pendingReports.toString(),
      icon: Flag,
      href: "/dashboard/admin/reports",
      color: "text-red-600",
      urgent: stats.pendingReports > 0,
    },
  ];

  const quickLinks = [
    { label: "Review Pitches", href: "/dashboard/admin/pitches", icon: FileText },
    { label: "Verify KYC", href: "/dashboard/admin/investors", icon: ShieldCheck },
    { label: "Manage Users", href: "/dashboard/admin/users", icon: Users },
    { label: "Platform Analytics", href: "/dashboard/admin/analytics", icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Control Center</h1>
        <p className="text-muted-foreground">Platform overview and management dashboard</p>
      </div>

      {/* Urgent alerts */}
      {(stats.pendingPitches > 0 || stats.pendingKYC > 0 || stats.pendingReports > 0) && (
        <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <p className="font-medium text-orange-800 dark:text-orange-200">Items requiring attention</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.pendingPitches > 0 && (
                <Badge variant="outline" className="border-orange-500 text-orange-700">
                  {stats.pendingPitches} pending pitches
                </Badge>
              )}
              {stats.pendingKYC > 0 && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                  {stats.pendingKYC} KYC reviews
                </Badge>
              )}
              {stats.pendingReports > 0 && (
                <Badge variant="outline" className="border-red-500 text-red-700">
                  {stats.pendingReports} reports
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className={`hover:shadow-md transition-shadow ${stat.urgent ? "border-orange-500/50" : ""}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <div className={`rounded-lg bg-primary/10 p-1.5`}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent pitches */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Submissions</CardTitle>
                <CardDescription>Pitches waiting for review</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/admin/pitches">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentPitches.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All pitches reviewed!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPitches.map((pitch) => {
                  const startup = pitch.startups as Record<string, string>;
                  return (
                    <div key={pitch.id as string} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{startup?.name ?? "Unknown Startup"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(pitch.created_at as string)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={(pitch.status as string) === "submitted" ? "secondary" : "default"}
                          className="text-xs"
                        >
                          {(pitch.status as string).replace("_", " ")}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/admin/pitches/${pitch.id}`}>
                            Review
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <Button key={link.label} variant="outline" asChild className="h-auto flex-col py-4 gap-2">
                  <Link href={link.href}>
                    <link.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs">{link.label}</span>
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
