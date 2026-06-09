"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";
import { ClipboardList, ArrowRight } from "lucide-react";

interface ReviewerMyReviewsPageProps {
  reviews: Array<Record<string, unknown>>;
}

const REC_COLORS: Record<string, string> = {
  approve: "bg-green-500/10 text-green-700",
  reject: "bg-red-500/10 text-red-700",
  request_changes: "bg-yellow-500/10 text-yellow-700",
};

export function ReviewerMyReviewsPage({ reviews }: ReviewerMyReviewsPageProps) {
  const avgScore = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + ((r.overall_score as number) ?? 0), 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Reviews</h1>
        <p className="text-muted-foreground">
          {reviews.length} reviews submitted · Average score: {avgScore.toFixed(1)}/10
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <ClipboardList className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">You haven&apos;t submitted any reviews yet</p>
            <Button asChild>
              <Link href="/dashboard/reviewer/queue">View Review Queue</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => {
            const pitch = review.pitches as Record<string, unknown> | null;
            const startup = pitch?.startups as Record<string, unknown> | null;
            const score = review.overall_score as number ?? 0;

            return (
              <Card key={review.id as string} className="hover:border-primary/30 transition-colors">
                <CardContent className="flex items-center gap-4 py-4">
                  <Avatar className="h-10 w-10 rounded-lg shrink-0">
                    <AvatarImage src={(startup?.logo_url as string) ?? ""} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-sm">
                      {((startup?.name as string) ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{(startup?.name as string) ?? "Unknown Startup"}</p>
                      {!!(review.recommendation) && (
                        <Badge variant="outline" className={`text-xs ${REC_COLORS[review.recommendation as string] ?? ""}`}>
                          {(review.recommendation as string).replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{review.feedback as string}</p>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(review.created_at as string)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold">{score.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">/ 10</p>
                    <div className="w-16 mt-1">
                      <Progress value={score * 10} className="h-1" />
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/reviewer/queue/${pitch?.id as string ?? ""}`}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
