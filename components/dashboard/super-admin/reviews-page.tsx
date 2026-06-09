"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { ClipboardList } from "lucide-react";

interface SuperAdminReviewsPageProps {
  reviews: Array<Record<string, unknown>>;
}

const REC_COLORS: Record<string, string> = {
  approve: "bg-green-500/10 text-green-700",
  reject: "bg-red-500/10 text-red-700",
  request_changes: "bg-yellow-500/10 text-yellow-700",
};

export function SuperAdminReviewsPage({ reviews }: SuperAdminReviewsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Reviews</h1>
        <p className="text-muted-foreground">{reviews.length} pitch reviews submitted</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {reviews.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <ClipboardList className="h-5 w-5" /> No reviews yet
              </div>
            ) : reviews.map(review => {
              const reviewer = review.users as Record<string, unknown> | null;
              const pitch = review.pitches as Record<string, unknown> | null;
              const startup = (pitch?.startups as Record<string, unknown> | null);
              const score = review.overall_score as number ?? 0;

              return (
                <div key={review.id as string} className="flex items-start gap-4 p-4 hover:bg-muted/30">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback>{getInitials((reviewer?.full_name as string) ?? "?")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium">{(reviewer?.full_name as string) ?? "Reviewer"}</p>
                      <span className="text-xs text-muted-foreground">reviewed</span>
                      <p className="text-sm font-medium text-primary">{(startup?.name as string) ?? "Startup"}</p>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{review.feedback as string}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(review.created_at as string)}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-sm font-bold">{score.toFixed(1)}/10</span>
                    </div>
                    <div className="w-20">
                      <Progress value={score * 10} className="h-1" />
                    </div>
                    {!!(review.recommendation) && (
                      <Badge variant="outline" className={`text-xs ${REC_COLORS[review.recommendation as string] ?? ""}`}>
                        {(review.recommendation as string).replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
