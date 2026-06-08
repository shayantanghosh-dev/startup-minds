"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StartupHealthScoreCardProps {
  score: number;
  startupId?: string;
  breakdown?: Record<string, number>;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}

function getScoreLabel(score: number) {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs Work";
}

const DIMENSIONS = [
  { key: "traction_score", label: "Traction" },
  { key: "growth_score", label: "Growth" },
  { key: "team_quality_score", label: "Team Quality" },
  { key: "business_model_score", label: "Business Model" },
  { key: "market_opportunity_score", label: "Market Opportunity" },
  { key: "fundraising_readiness_score", label: "Funding Readiness" },
];

export function StartupHealthScoreCard({
  score,
  breakdown,
}: StartupHealthScoreCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Startup Health Score
        </CardTitle>
        <CardDescription>AI-powered readiness assessment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall score circle */}
        <div className="flex items-center gap-6">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-muted">
            <div
              className="absolute inset-0 rounded-full border-4"
              style={{
                borderColor: score >= 80 ? "#16a34a" : score >= 60 ? "#ca8a04" : score >= 40 ? "#ea580c" : "#dc2626",
                clipPath: `inset(0 ${100 - score}% 0 0)`,
              }}
            />
            <span className={cn("text-xl font-bold", getScoreColor(score))}>
              {score}
            </span>
          </div>
          <div>
            <p className={cn("text-lg font-semibold", getScoreColor(score))}>
              {getScoreLabel(score)}
            </p>
            <p className="text-sm text-muted-foreground">Overall health score</p>
          </div>
        </div>

        {/* Dimensions */}
        {breakdown && (
          <div className="space-y-3">
            {DIMENSIONS.map((dim) => {
              const val = breakdown[dim.key] ?? 0;
              return (
                <div key={dim.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">{dim.label}</span>
                    <span className="text-xs font-medium">{val}/100</span>
                  </div>
                  <Progress value={val} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}

        {!breakdown && score === 0 && (
          <p className="text-sm text-muted-foreground">
            Complete your pitch submission to receive your AI health score.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
