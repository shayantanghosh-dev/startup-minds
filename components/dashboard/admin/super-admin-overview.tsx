"use client";

import Link from "next/link";
import {
  Users, Rocket, DollarSign, FileText, ShieldCheck,
  Settings, BarChart3, Shield, Database, Globe,
  ArrowRight, ChevronRight, TrendingUp, Activity,
  AlertTriangle, CheckCircle2, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

interface SuperAdminOverviewProps {
  stats: {
    totalUsers: number;
    totalStartups: number;
    totalInvestors: number;
    publishedPitches: number;
    pendingKYC: number;
  };
  recentAuditLogs: Array<Record<string, unknown>>;
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  update: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  delete: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  approve: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  reject: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  login: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

function getActionColor(action: string) {
  const key = Object.keys(ACTION_COLORS).find(k => action?.toLowerCase().includes(k));
  return ACTION_COLORS[key ?? "login"];
}

export function SuperAdminOverview({ stats, recentAuditLogs }: SuperAdminOverviewProps) {
  const founderCount = stats.totalUsers - stats.totalInvestors; // approximate
  const healthGood = stats.pendingKYC === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">Super Admin</h1>
            <Badge className="text-xs bg-red-100 text-red-700 border-red-200" variant="outline">Full Access</Badge>
          </div>
          <p className="text-muted-foreground text-sm">Platform-wide control, configuration, and oversight</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/super-admin/settings">
              <Settings className="mr-1.5 h-3.5 w-3.5" /> Platform Config
            </Link>
          </Button>
        </div>
      </div>

      {/* Platform health */}
      <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
        healthGood
          ? "border-green-400/50 bg-green-50 dark:bg-green-950/20"
          : "border-amber-400/50 bg-amber-50 dark:bg-amber-950/20"
      }`}>
        {healthGood
          ? <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
          : <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        }
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {healthGood ? "Platform operating normally" : "Action required"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {healthGood
              ? `${stats.totalUsers.toLocaleString()} users · ${stats.publishedPitches} live pitches · All KYC verified`
              : `${stats.pendingKYC} investor KYC submissions pending review`}
          </p>
        </div>
        {!healthGood && (
          <Button size="sm" variant="outline" className="shrink-0" asChild>
            <Link href="/dashboard/super-admin/investors">Review KYC</Link>
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, href: "/dashboard/super-admin/users", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950" },
          { label: "Startups", value: stats.totalStartups, icon: Rocket, href: "/dashboard/super-admin/startups", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950" },
          { label: "Investors", value: stats.totalInvestors, icon: DollarSign, href: "/dashboard/super-admin/investors", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950" },
          { label: "Live Pitches", value: stats.publishedPitches, icon: FileText, href: "/dashboard/super-admin/pitches", color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950" },
          {
            label: "KYC Pending",
            value: stats.pendingKYC,
            icon: ShieldCheck,
            href: "/dashboard/super-admin/investors",
            color: stats.pendingKYC > 0 ? "text-amber-600" : "text-gray-500",
            bg: stats.pendingKYC > 0 ? "bg-amber-50 dark:bg-amber-950" : "bg-gray-50 dark:bg-gray-900",
            urgent: stats.pendingKYC > 0,
          },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="group">
            <Card className={`hover:shadow-md transition-all hover:border-primary/30 ${stat.urgent ? "border-amber-400/50" : ""}`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight">{stat.label}</span>
                  <div className={`rounded-lg ${stat.bg} p-1.5`}>
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-2xl font-black">{stat.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform management tools */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Platform Management
            </CardTitle>
            <CardDescription>Critical configuration and oversight tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { label: "RBAC & Role Permissions", href: "/dashboard/super-admin/roles", icon: Shield, desc: "Manage user roles and access levels" },
                { label: "Platform Analytics", href: "/dashboard/super-admin/analytics", icon: TrendingUp, desc: "Growth, engagement, funnel metrics" },
                { label: "Audit Logs", href: "/dashboard/super-admin/audit-logs", icon: Database, desc: "Full activity trail across all users" },
                { label: "Global Reports", href: "/dashboard/super-admin/reports", icon: Globe, desc: "Platform-wide reporting and exports" },
                { label: "Manage Events", href: "/dashboard/super-admin/events", icon: Activity, desc: "Demo days, webinars, networking" },
                { label: "Platform Settings", href: "/dashboard/super-admin/settings", icon: Settings, desc: "Configure platform-wide features" },
              ].map((tool) => (
                <Link
                  key={tool.label}
                  href={tool.href}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:border-primary/30 hover:bg-muted/50 transition-all group"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <tool.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{tool.label}</p>
                    <p className="text-xs text-muted-foreground">{tool.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent audit logs — better styled */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Audit Trail</CardTitle>
                <CardDescription>Last {recentAuditLogs.length} platform events</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/super-admin/audit-logs">Full log <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentAuditLogs.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentAuditLogs.slice(0, 8).map((log) => {
                  const actor = log.users as Record<string, string>;
                  const action = (log.action as string) ?? "";
                  return (
                    <div key={log.id as string} className="flex items-start gap-3 py-1">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 mt-0.5">
                        {actor?.full_name?.slice(0, 2).toUpperCase() ?? "SY"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs leading-snug">
                          <span className="font-semibold">{actor?.full_name ?? "System"}</span>
                          {" "}
                          <span className="text-muted-foreground">{action.replace(/_/g, " ")}</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatRelativeTime(log.created_at as string)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${getActionColor(action)}`}>
                          {action.split("_")[0] ?? "event"}
                        </span>
                        {log.entity_type ? (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">
                            {String(log.entity_type)}
                          </Badge>
                        ) : null}
                      </div>
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
