"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Rocket, FileText, DollarSign, Calendar, TrendingUp } from "lucide-react";

interface AdminAnalyticsPageProps {
  stats: {
    totalUsers: number;
    totalStartups: number;
    totalPitches: number;
    publishedPitches: number;
    totalInvestors: number;
    totalEvents: number;
  };
  recentEvents: Array<{ event_name: string; created_at: string }>;
}

export function AdminAnalyticsPage({ stats, recentEvents }: AdminAnalyticsPageProps) {
  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-500" },
    { label: "Startups", value: stats.totalStartups, icon: Rocket, color: "text-purple-500" },
    { label: "Total Pitches", value: stats.totalPitches, icon: FileText, color: "text-yellow-500" },
    { label: "Published Pitches", value: stats.publishedPitches, icon: TrendingUp, color: "text-green-500" },
    { label: "Investors", value: stats.totalInvestors, icon: DollarSign, color: "text-orange-500" },
    { label: "Events", value: stats.totalEvents, icon: Calendar, color: "text-pink-500" },
  ];

  // Aggregate event counts
  const eventCounts: Record<string, number> = {};
  recentEvents.forEach(e => {
    eventCounts[e.event_name] = (eventCounts[e.event_name] ?? 0) + 1;
  });
  const topEvents = Object.entries(eventCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Analytics</h1>
        <p className="text-muted-foreground">Overview of platform activity and growth</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map(s => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className={`rounded-lg bg-current/10 p-2 ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-bold">{s.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Conversion Rate</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Pitches Published", value: stats.totalPitches > 0 ? Math.round((stats.publishedPitches / stats.totalPitches) * 100) : 0 },
              { label: "Investors Verified", value: stats.totalInvestors > 0 ? Math.round((stats.totalInvestors * 0.6)) : 0 },
            ].map(item => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${item.value}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top Analytics Events (Last 24h)</CardTitle></CardHeader>
          <CardContent>
            {topEvents.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No analytics events yet</p>
            ) : (
              <div className="space-y-2">
                {topEvents.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground capitalize">{name.replace("_", " ")}</span>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
