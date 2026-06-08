"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileText,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatCurrency } from "@/lib/utils";

const reviewSchema = z.object({
  team_score: z.number().min(1).max(10),
  market_score: z.number().min(1).max(10),
  product_score: z.number().min(1).max(10),
  traction_score: z.number().min(1).max(10),
  financials_score: z.number().min(1).max(10),
  feedback: z.string().min(50, "Please provide at least 50 characters of feedback"),
  recommendation: z.enum(["approve", "changes_requested", "reject"]),
});

type ReviewForm = z.infer<typeof reviewSchema>;

interface Props {
  pitch: Record<string, unknown>;
  reviewerId: string;
  existingReview: Record<string, unknown> | null;
}

const CRITERIA = [
  { key: "team_score", label: "Team", icon: Users, description: "Founder background, team composition, relevant experience" },
  { key: "market_score", label: "Market", icon: TrendingUp, description: "Market size, growth potential, competitive landscape" },
  { key: "product_score", label: "Product", icon: Building2, description: "Product quality, innovation, defensibility, IP" },
  { key: "traction_score", label: "Traction", icon: Star, description: "Revenue, users, growth metrics, partnerships" },
  { key: "financials_score", label: "Financials", icon: FileText, description: "Financial projections, burn rate, unit economics" },
] as const;

function ScoreInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`h-8 w-8 rounded text-xs font-medium transition-colors ${
            n <= value
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function ReviewQueueDetail({ pitch, reviewerId, existingReview }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPitch, setShowPitch] = useState(true);

  const startup = pitch.startup as Record<string, unknown>;
  const founder = startup?.founder as Record<string, unknown>;
  const isCompleted = !!existingReview;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: existingReview
      ? {
          team_score: (existingReview.team_score as number) ?? 5,
          market_score: (existingReview.market_score as number) ?? 5,
          product_score: (existingReview.product_score as number) ?? 5,
          traction_score: (existingReview.traction_score as number) ?? 5,
          financials_score: (existingReview.financials_score as number) ?? 5,
          feedback: (existingReview.feedback as string) ?? "",
          recommendation: (existingReview.recommendation as ReviewForm["recommendation"]) ?? "approve",
        }
      : {
          team_score: 5,
          market_score: 5,
          product_score: 5,
          traction_score: 5,
          financials_score: 5,
          feedback: "",
          recommendation: "approve",
        },
  });

  const scores = watch(["team_score", "market_score", "product_score", "traction_score", "financials_score"]);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const recommendation = watch("recommendation");

  async function onSubmit(data: ReviewForm) {
    setSubmitting(true);
    const supabase = createClient();

    const overall = Math.round(
      (data.team_score + data.market_score + data.product_score + data.traction_score + data.financials_score) / 5
    );

    const { error } = await supabase.from("pitch_reviews").upsert({
      pitch_id: pitch.id as string,
      reviewer_id: reviewerId,
      ...data,
      overall_score: overall,
      status: "completed",
    });

    if (error) {
      toast.error("Failed to submit review");
      setSubmitting(false);
      return;
    }

    // Update pitch status
    await supabase
      .from("pitches")
      .update({
        status: data.recommendation === "approve"
          ? "approved"
          : data.recommendation === "changes_requested"
          ? "changes_requested"
          : "rejected",
        ...(data.recommendation === "changes_requested" && { changes_requested: data.feedback }),
        ...(data.recommendation === "reject" && { rejection_reason: data.feedback }),
      })
      .eq("id", pitch.id as string);

    toast.success("Review submitted successfully");
    router.push("/dashboard/reviewer");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{startup?.name as string}</h1>
          <p className="text-muted-foreground text-sm">
            Submitted {formatDate((pitch.submitted_at as string) ?? (pitch.created_at as string))}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={isCompleted ? "default" : "secondary"}>
            {isCompleted ? "Reviewed" : "Pending Review"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Pitch content - 3 cols */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader
              className="cursor-pointer"
              onClick={() => setShowPitch((v) => !v)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pitch Overview</CardTitle>
                {showPitch ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
            {showPitch && (
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Tagline</p>
                  <p>{pitch.tagline as string}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Problem</p>
                  <p className="text-sm">{pitch.problem_statement as string}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Solution</p>
                  <p className="text-sm">{pitch.solution as string}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Value Proposition</p>
                  <p className="text-sm">{pitch.value_proposition as string}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Market Size (TAM)</p>
                    <p className="font-semibold">{formatCurrency((pitch.tam as number) ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Funding Ask</p>
                    <p className="font-semibold">{formatCurrency((pitch.funding_ask as number) ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Revenue (MRR)</p>
                    <p className="font-semibold">{formatCurrency((pitch.current_revenue as number) ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Team Size</p>
                    <p className="font-semibold">{(pitch.team_size as number) ?? 0} people</p>
                  </div>
                </div>
                {!!(pitch.traction_metrics) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Traction Metrics</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(pitch.traction_metrics as Record<string, unknown>).map(([k, v]) => (
                          <div key={k} className="flex justify-between bg-muted/50 rounded px-2 py-1">
                            <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</span>
                            <span className="font-medium">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Founder</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                {((founder?.full_name as string) ?? "?")[0]}
              </div>
              <div>
                <p className="font-medium">{founder?.full_name as string}</p>
                <p className="text-sm text-muted-foreground">{founder?.email as string}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review form - 2 cols */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Review Scorecard</span>
                <span className="text-lg font-bold text-primary">{avgScore.toFixed(1)}/10</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {CRITERIA.map((c) => (
                  <div key={c.key} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5">
                        <c.icon className="h-3.5 w-3.5" />
                        {c.label}
                      </Label>
                      <span className="text-sm font-bold">{watch(c.key)}/10</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                    <ScoreInput
                      value={watch(c.key)}
                      onChange={(v) => setValue(c.key, v)}
                      disabled={isCompleted}
                    />
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <Label>Recommendation</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["approve", "changes_requested", "reject"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        disabled={isCompleted}
                        onClick={() => setValue("recommendation", r)}
                        className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                          recommendation === r
                            ? r === "approve"
                              ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                              : r === "reject"
                              ? "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400"
                              : "border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                            : "border-border bg-background hover:bg-muted"
                        }`}
                      >
                        {r === "approve" ? "Approve" : r === "changes_requested" ? "Request Changes" : "Reject"}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">
                    Feedback{" "}
                    <span className="text-muted-foreground font-normal">(min 50 chars)</span>
                  </Label>
                  <Textarea
                    id="feedback"
                    {...register("feedback")}
                    rows={6}
                    disabled={isCompleted}
                    placeholder="Provide detailed feedback for the founder..."
                    className="resize-none"
                  />
                  {errors.feedback && (
                    <p className="text-xs text-destructive">{errors.feedback.message}</p>
                  )}
                </div>

                {!isCompleted && (
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Review"}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
