"use client";

import Link from "next/link";
import {
  Users, Rocket, DollarSign, FileText, ShieldCheck,
  Settings, BarChart3, Shield, Database, Globe
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

export function SuperAdminOverview({ stats, recentAuditLogs }: SuperAdminOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Super Admin</h1>
          <p className="text-muted-foreground">Full platform control and oversight</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/super-admin/settings">
            <Settings className="mr-2 h-4 w-4" /> Platform Settings
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Users", value: stats.totalUsers, icon: Users, href: "/dashboard/super-admin/users" },
          { label: "Startups", value: stats.totalStartups, icon: Rocket, href: "/dashboard/super-admin/startups" },
          { label: "Investors", value: stats.totalInvestors, icon: DollarSign, href: "/dashboard/super-admin/investors" },
          { label: "Live Pitches", value: stats.publishedPitches, icon: FileText, href: "/dashboard/super-admin/pitches" },
          { label: "KYC Pending", value: stats.pendingKYC, icon: ShieldCheck, href: "/dashboard/super-admin/investors", urgent: stats.pendingKYC > 0 },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className={`hover:shadow-md transition-shadow ${stat.urgent ? "border-orange-500/50" : ""}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                  <div className="rounded-lg bg-primary/10 p-1.5">
                    <stat.icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stat.value.toLocaleString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Admin Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Management</CardTitle>
            <CardDescription>Critical admin tools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "RBAC & Roles", href: "/dashboard/super-admin/roles", icon: Shield },
                { label: "Audit Logs", href: "/dashboard/super-admin/audit-logs", icon: Database },
                { label: "Analytics", href: "/dashboard/super-admin/analytics", icon: BarChart3 },
                { label: "Global Reports", href: "/dashboard/super-admin/reports", icon: Globe },
                { label: "Badges", href: "/dashboard/super-admin/badges", icon: ShieldCheck },
                { label: "Platform Config", href: "/dashboard/super-admin/settings", icon: Settings },
              ].map((tool) => (
                <Button key={tool.label} variant="outline" asChild className="h-auto flex-col py-3 gap-1.5">
                  <Link href={tool.href}>
                    <tool.icon className="h-5 w-5 text-primary" />
                    <span className="text-xs">{tool.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Audit Logs</CardTitle>
                <CardDescription>Platform activity trail</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/super-admin/audit-logs">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAuditLogs.map((log) => {
                const actor = log.users as Record<string, string>;
                return (
                  <div key={log.id as string} className="flex items-start gap-3">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-medium">{actor?.full_name ?? "System"}</span>
                        {" "}
                        <span className="text-muted-foreground">
                          {(log.action as string).replace(/_/g, " ")}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(log.created_at as string)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {log.entity_type as string}
                    </Badge>
                  </div>
                );
              })}

              {recentAuditLogs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
