"use client";

import Link from "next/link";
import { ClipboardList, Clock, CheckCircle2, ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatRelativeTime } from "@/lib/utils";

interface ReviewerOverviewProps {
  assignedPitches: Array<Record<string, unknown>>;
  completedReviews: Array<Record<string, unknown>>;
}

export function ReviewerOverview({ assignedPitches, completedReviews }: ReviewerOverviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reviewer Dashboard</h1>
        <p className="text-muted-foreground">
          You have <strong>{assignedPitches.length}</strong> pitches to review
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Assigned", value: assignedPitches.filter((p) => p.status === "assigned").length, icon: Clock },
          { label: "Under Review", value: assignedPitches.filter((p) => p.status === "under_review").length, icon: ClipboardList },
          { label: "Completed", value: completedReviews.length, icon: CheckCircle2 },
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
        {/* Review Queue */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Review Queue</CardTitle>
                <CardDescription>Pitches awaiting your review</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/reviewer/queue">View all <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {assignedPitches.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Queue is empty</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedPitches.slice(0, 5).map((pitch) => {
                  const startup = pitch.startups as Record<string, string>;
                  return (
                    <div key={pitch.id as string} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">{getInitials(startup?.name ?? "?")}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{startup?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {startup?.stage?.replace("_", " ")} • {startup?.industry}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/dashboard/reviewer/queue/${pitch.id}`}>Review</Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Reviews</CardTitle>
            <CardDescription>Your completed reviews</CardDescription>
          </CardHeader>
          <CardContent>
            {completedReviews.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No reviews completed yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedReviews.map((review) => {
                  const pitch = review.pitches as Record<string, unknown>;
                  const startup = (pitch?.startups) as Record<string, string>;
                  return (
                    <div key={review.id as string} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{startup?.name ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(review.created_at as string)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {(review.overall_score as number)?.toFixed(1)}
                        </span>
                        <Badge
                          variant={review.recommendation === "approve" ? "default" : "destructive"}
                          className="text-xs ml-1"
                        >
                          {review.recommendation as string}
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
