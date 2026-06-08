"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, ArrowRight, Building2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUS_COLORS = {
  submitted: "secondary",
  assigned: "default",
  under_review: "default",
  resubmitted: "secondary",
} as const;

interface Props {
  pitches: Record<string, unknown>[];
}

export default function ReviewQueue({ pitches }: Props) {
  if (pitches.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Review Queue</h1>
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No pitches in the queue</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review Queue</h1>
        <p className="text-muted-foreground">{pitches.length} pitches awaiting review</p>
      </div>

      <div className="space-y-3">
        {pitches.map((pitch) => {
          const startup = pitch.startup as Record<string, unknown>;
          return (
            <Card key={pitch.id as string} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold">{startup?.name as string}</p>
                      <Badge
                        variant={STATUS_COLORS[pitch.status as keyof typeof STATUS_COLORS] ?? "secondary"}
                        className="text-xs capitalize"
                      >
                        {(pitch.status as string ?? "").replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{pitch.tagline as string}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="capitalize">{(startup?.stage as string ?? "").replace(/_/g, " ")}</span>
                      {" · "}
                      <span className="capitalize">{(startup?.industry as string ?? "").replace(/_/g, " ")}</span>
                      {" · Submitted "}
                      {pitch.submitted_at ? formatDate(pitch.submitted_at as string) : "—"}
                    </p>
                  </div>
                  <Link href={`/dashboard/reviewer/queue/${pitch.id as string}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      Review
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
