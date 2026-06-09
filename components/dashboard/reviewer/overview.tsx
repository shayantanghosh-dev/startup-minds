"use client";

import Link from "next/link";
import {
  ClipboardList, Clock, CheckCircle2, ArrowRight, Star,
  Zap, AlertTriangle, TrendingUp, Target, Flame, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { getInitials, formatRelativeTime } from "@/lib/utils";

interface ReviewerOverviewProps {
  assignedPitches: Array<Record<string, unknown>>;
  completedReviews: Array<Record<string, unknown>>;
}

function getUrgencyColor(submittedAt: string | undefined) {
  if (!submittedAt) return "text-muted-foreground";
  const hours = (Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60);
  if (hours > 48) return "text-red-600";
  if (hours > 24) return "text-amber-600";
  return "text-muted-foreground";
}

function getUrgencyLabel(submittedAt: string | undefined) {
  if (!submittedAt) return null;
  const hours = (Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60);
  if (hours > 48) return { label: "Overdue", color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" };
  if (hours > 24) return { label: "Due soon", color: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300" };
  return null;
}

export function ReviewerOverview({ assignedPitches, completedReviews }: ReviewerOverviewProps) {
  const assigned = assignedPitches.filter((p) => p.status === "assigned");
  const inReview = assignedPitches.filter((p) => p.status === "under_review");
  const total = assignedPitches.length;
  const nextPitch = assignedPitches[0];
  const overduePitches = assignedPitches.filter(p => {
    const hours = (Date.now() - new Date(p.submitted_at as string || p.created_at as string || 0).getTime()) / (1000 * 60 * 60);
    return hours > 48;
  });

  // Simple streak: consecutive days with completed reviews
  const weeklyTarget = 5;
  const weekProgress = Math.min(completedReviews.length, weeklyTarget);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reviewer Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            {total === 0
              ? "Your queue is clear — great work!"
              : `${total} pitch${total !== 1 ? "es" : ""} waiting for review`}
          </p>
        </div>
        {total > 0 && nextPitch && (
          <Button asChild className="shrink-0 gap-2">
            <Link href={`/dashboard/reviewer/queue/${nextPitch.id}`}>
              <Zap className="h-4 w-4" /> Start Reviewing
            </Link>
          </Button>
        )}
      </div>

      {/* Overdue alert */}
      {overduePitches.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-400/50 bg-red-50 dark:bg-red-950/30 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-red-800 dark:text-red-200">
              {overduePitches.length} pitch{overduePitches.length > 1 ? "es" : ""} overdue (48h+)
            </p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
              Founders are waiting. Please review these as soon as possible.
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-red-400 text-red-700 hover:bg-red-100 shrink-0" asChild>
            <Link href="/dashboard/reviewer/queue">Review Now</Link>
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Assigned",
            value: assigned.length,
            icon: Clock,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950",
            href: "/dashboard/reviewer/queue",
          },
          {
            label: "Under Review",
            value: inReview.length,
            icon: ClipboardList,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-950",
            href: "/dashboard/reviewer/queue",
          },
          {
            label: "Completed",
            value: completedReviews.length,
            icon: CheckCircle2,
            color: "text-green-600",
            bg: "bg-green-50 dark:bg-green-950",
            href: "/dashboard/reviewer/reviews",
          },
          {
            label: "This Week",
            value: weekProgress,
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50 dark:bg-purple-950",
            href: "/dashboard/reviewer/analytics",
            sub: `${weekProgress}/${weeklyTarget} target`,
          },
        ].map((stat) => (
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
                {stat.sub && <p className="text-[11px] text-muted-foreground mt-1.5">{stat.sub}</p>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Weekly progress */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Weekly Review Goal</span>
            </div>
            <span className="text-sm font-bold text-primary">{weekProgress}/{weeklyTarget}</span>
          </div>
          <Progress value={(weekProgress / weeklyTarget) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {weekProgress >= weeklyTarget
              ? "🎉 Weekly goal reached! Great work."
              : `${weeklyTarget - weekProgress} more review${weeklyTarget - weekProgress !== 1 ? "s" : ""} to hit your weekly target.`}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Review Queue */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Review Queue</CardTitle>
                <CardDescription>Ordered by submission date</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/reviewer/queue">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {assignedPitches.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-sm">All caught up!</p>
                <p className="text-xs text-muted-foreground mt-1">New pitches will appear here when assigned to you.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedPitches.slice(0, 5).map((pitch, idx) => {
                  const startup = pitch.startups as Record<string, string>;
                  const submittedAt = pitch.submitted_at as string || pitch.created_at as string;
                  const urgency = getUrgencyLabel(submittedAt);
                  return (
                    <div key={pitch.id as string} className="flex items-center gap-3">
                      {idx === 0 && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" title="Next to review" />
                      )}
                      {idx !== 0 && <div className="h-2 w-2 rounded-full bg-muted shrink-0" />}
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(startup?.name ?? "?")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{startup?.name}</p>
                          {urgency && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${urgency.color}`}>
                              {urgency.label}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="capitalize">{startup?.stage?.replace("_", " ")}</span>
                          <span>·</span>
                          <span>{startup?.industry}</span>
                          {submittedAt && (
                            <><span>·</span><span className={getUrgencyColor(submittedAt)}>{formatRelativeTime(submittedAt)}</span></>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Timer className="h-3 w-3" /> ~15 min
                        </span>
                        <Button size="sm" asChild className="h-7 text-xs px-2.5">
                          <Link href={`/dashboard/reviewer/queue/${pitch.id}`}>Review</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Reviews */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Reviews</CardTitle>
                <CardDescription>Your completed reviews</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/reviewer/reviews">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {completedReviews.length === 0 ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-muted mb-3">
                  <ClipboardList className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No reviews completed yet</p>
                <p className="text-xs text-muted-foreground mt-1">Each review takes about 15 minutes.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedReviews.slice(0, 6).map((review) => {
                  const pitch = review.pitches as Record<string, unknown>;
                  const startup = (pitch?.startups) as Record<string, string>;
                  const score = review.overall_score as number;
                  return (
                    <div key={review.id as string} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback className="text-xs bg-muted text-muted-foreground">{getInitials(startup?.name ?? "?")}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{startup?.name ?? "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{formatRelativeTime(review.created_at as string)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-sm font-semibold">{score?.toFixed(1)}</span>
                        </div>
                        <Badge
                          className={`text-xs ${
                            review.recommendation === "approve"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : review.recommendation === "reject"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                          }`}
                          variant="outline"
                        >
                          {(review.recommendation as string)?.replace("_", " ")}
                        </Badge>
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
