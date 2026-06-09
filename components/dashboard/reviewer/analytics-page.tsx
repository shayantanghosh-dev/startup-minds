"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ClipboardList, CheckCircle, XCircle, BarChart3 } from "lucide-react";

interface ReviewerAnalyticsPageProps {
  stats: { totalReviews: number; approvedReviews: number; rejectedReviews: number };
  recentReviews: Array<Record<string, unknown>>;
}

export function ReviewerAnalyticsPage({ stats, recentReviews }: ReviewerAnalyticsPageProps) {
  const changesRequested = stats.totalReviews - stats.approvedReviews - stats.rejectedReviews;
  const approvalRate = stats.totalReviews > 0 ? Math.round((stats.approvedReviews / stats.totalReviews) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review Analytics</h1>
        <p className="text-muted-foreground">Your performance and review history</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Reviews", value: stats.totalReviews, icon: ClipboardList, color: "text-blue-500" },
          { label: "Approved", value: stats.approvedReviews, icon: CheckCircle, color: "text-green-500" },
          { label: "Rejected", value: stats.rejectedReviews, icon: XCircle, color: "text-red-500" },
          { label: "Changes Requested", value: changesRequested, icon: BarChart3, color: "text-yellow-500" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="text-3xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Approval Rate</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Approved</span>
                <span className="font-medium text-green-600">{approvalRate}%</span>
              </div>
              <Progress value={approvalRate} className="h-3" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Rejected</span>
                <span className="font-medium text-red-600">
                  {stats.totalReviews > 0 ? Math.round((stats.rejectedReviews / stats.totalReviews) * 100) : 0}%
                </span>
              </div>
              <Progress value={stats.totalReviews > 0 ? (stats.rejectedReviews / stats.totalReviews) * 100 : 0} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {recentReviews.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No reviews yet</p>
            ) : (
              <div className="space-y-2">
                {recentReviews.map(review => {
                  const pitch = review.pitches as Record<string, unknown> | null;
                  const startup = pitch?.startups as Record<string, unknown> | null;
                  return (
                    <div key={review.id as string} className="flex items-center justify-between text-sm">
                      <span className="truncate text-muted-foreground">{(startup?.name as string) ?? "Unknown"}</span>
                      <span className="font-medium shrink-0 ml-2">{(review.overall_score as number)?.toFixed(1)}/10</span>
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
