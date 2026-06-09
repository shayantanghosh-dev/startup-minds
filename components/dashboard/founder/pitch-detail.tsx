"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, History, Brain, TrendingUp, AlertTriangle, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Pitch } from "@/types";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  draft: { label: "Draft", variant: "secondary" },
  submitted: { label: "Submitted", variant: "default" },
  under_review: { label: "Under Review", variant: "default" },
  changes_requested: { label: "Changes Requested", variant: "destructive" },
  approved: { label: "Approved", variant: "default" },
  published: { label: "Published", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

interface PitchDetailProps {
  pitch: Pitch;
  versions: Array<{ id: string; version: number; change_summary: string | null; created_at: string }>;
  onEdit: () => void;
}

export function PitchDetail({ pitch, versions, onEdit }: PitchDetailProps) {
  const router = useRouter();
  const status = STATUS_CONFIG[pitch.status] ?? { label: pitch.status, variant: "secondary" as const };
  const aiAnalysis = pitch.ai_analysis;
  const [restoringId, setRestoringId] = useState<string | null>(null);

  async function handleRestore(versionId: string) {
    setRestoringId(versionId);
    try {
      const res = await fetch("/api/pitch/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_id: versionId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Restore failed"); return; }
      toast.success("Pitch restored to selected version");
      router.refresh();
    } catch {
      toast.error("Failed to restore pitch");
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Pitch</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={status.variant}>{status.label}</Badge>
            <span className="text-sm text-muted-foreground">
              Version {pitch.version} â€¢ {pitch.submitted_at ? formatDate(pitch.submitted_at) : "Not submitted"}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {(pitch.status === "draft" || pitch.status === "changes_requested" || pitch.status === "rejected") && (
            <Button onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              {pitch.status === "changes_requested" ? "Address Changes" : "Edit Pitch"}
            </Button>
          )}
        </div>
      </div>

      {/* What happens next — shown when pitch is under review */}
      {pitch.status === "submitted" && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-400/50 bg-blue-50 dark:bg-blue-950/20 px-4 py-3">
          <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">Your pitch is in the review queue</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
              Our expert reviewers will assess your pitch within <strong>3–5 business days</strong>.
              You&apos;ll receive a notification with feedback. Once approved, your startup will be matched with relevant investors.
            </p>
          </div>
        </div>
      )}

      {pitch.status === "under_review" && (
        <div className="flex items-start gap-3 rounded-xl border border-indigo-400/50 bg-indigo-50 dark:bg-indigo-950/20 px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse mt-2 shrink-0" />
          <div>
            <p className="font-semibold text-sm">A reviewer is currently reviewing your pitch</p>
            <p className="text-xs text-muted-foreground mt-1">
              Expect feedback within 1–2 business days. Keep your profile and startup details up to date.
            </p>
          </div>
        </div>
      )}

      {pitch.status === "approved" && (
        <div className="flex items-start gap-3 rounded-xl border border-green-400/50 bg-green-50 dark:bg-green-950/20 px-4 py-3">
          <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-green-900 dark:text-green-100">Pitch approved — you&apos;re live!</p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Investors can now discover your startup. Check your <strong>Investor Matches</strong> to see who&apos;s compatible.
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-green-400 text-green-700 shrink-0" asChild>
            <a href="/dashboard/founder/investors">View Matches</a>
          </Button>
        </div>
      )}

      {pitch.status === "changes_requested" && pitch.changes_requested && (
        <Card className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">Changes Requested</p>
                <p className="text-sm mt-1">{pitch.changes_requested}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
          <TabsTrigger value="fundraising">Fundraising</TabsTrigger>
          <TabsTrigger value="history">Version History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          {[
            { label: "Company Overview", value: pitch.company_overview },
            { label: "Problem Statement", value: pitch.problem_statement },
            { label: "Solution", value: pitch.solution_description },
            { label: "Unique Value Proposition", value: pitch.unique_value_proposition },
            { label: "Revenue Model", value: pitch.revenue_model },
          ].map((item) => item.value && (
            <Card key={item.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ai-analysis" className="mt-4">
          {!aiAnalysis ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium mb-1">AI Analysis Pending</p>
                <p className="text-sm text-muted-foreground">
                  Submit your pitch to receive AI-powered quality analysis.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Overall score */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-16 w-16 rounded-full border-4 border-primary flex items-center justify-center">
                      <span className="text-xl font-bold text-primary">{aiAnalysis.quality_score}</span>
                    </div>
                    <div>
                      <p className="font-bold text-lg">AI Quality Score</p>
                      <p className="text-sm text-muted-foreground">
                        Funding Readiness: {aiAnalysis.funding_readiness}/100
                      </p>
                    </div>
                    <Badge className="ml-auto" variant={
                      aiAnalysis.overall_recommendation === "strong_buy" || aiAnalysis.overall_recommendation === "buy"
                        ? "default" : "destructive"
                    }>
                      {aiAnalysis.overall_recommendation?.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Market Opportunity", score: aiAnalysis.market_opportunity_score },
                      { label: "Team Strength", score: aiAnalysis.team_strength_score },
                      { label: "Business Viability", score: aiAnalysis.business_viability_score },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <Progress value={item.score} className="h-1.5 mb-1" />
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-xs font-medium">{item.score}/100</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Strengths and Weaknesses */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" /> Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiAnalysis.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 mt-0.5">â€¢</span>{s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" /> Improvements Needed
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {aiAnalysis.improvements.map((imp, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-orange-500 mt-0.5">â€¢</span>{imp}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="fundraising" className="mt-4">
          <Card>
            <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Amount Raising", value: formatCurrency(pitch.amount_raising) },
                { label: "Valuation", value: pitch.valuation_expectation ? formatCurrency(pitch.valuation_expectation) : "N/A" },
                { label: "Equity Offered", value: pitch.equity_offered ? `${pitch.equity_offered}%` : "N/A" },
                { label: "Monthly Revenue", value: pitch.monthly_revenue ? formatCurrency(pitch.monthly_revenue) : "N/A" },
                { label: "MRR", value: pitch.mrr ? formatCurrency(pitch.mrr) : "N/A" },
                { label: "Total Customers", value: pitch.total_customers?.toString() ?? "N/A" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-lg font-bold">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              {versions.length === 0 ? (
                <div className="text-center py-4">
                  <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No version history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div key={version.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                      <div>
                        <p className="text-sm font-medium">Version {version.version}</p>
                        <p className="text-xs text-muted-foreground">
                          {version.change_summary} â€¢ {formatDate(version.created_at)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!!restoringId}
                        onClick={() => handleRestore(version.id)}
                      >
                        {restoringId === version.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <ArrowRight className="ml-1 h-3 w-3" />
                        )}
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
