"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Bot,
  BookOpen,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatCurrency } from "@/lib/utils";

interface Props {
  pitch: Record<string, unknown>;
  adminId: string;
}

const STATUS_CONFIG = {
  approved: { label: "Approve & Publish", icon: CheckCircle, variant: "default" as const, action: "approved" },
  changes_requested: { label: "Request Changes", icon: AlertCircle, variant: "secondary" as const, action: "changes_requested" },
  rejected: { label: "Reject", icon: XCircle, variant: "destructive" as const, action: "rejected" },
};

export default function AdminPitchDetail({ pitch, adminId }: Props) {
  const router = useRouter();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const startup = pitch.startup as Record<string, unknown>;
  const founder = startup?.founder as Record<string, unknown>;
  const reviews = (pitch.reviews as Record<string, unknown>[]) ?? [];
  const aiAnalysis = pitch.ai_analysis as Record<string, unknown> | null;

  async function handleAction(action: string) {
    if (!notes.trim() && action !== "approved") {
      toast.error("Please provide notes for this decision");
      return;
    }
    setLoading(true);

    const res = await fetch(`/api/admin/pitch/${pitch.id as string}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: action, notes }),
    });

    if (!res.ok) {
      toast.error("Failed to update pitch status");
      setLoading(false);
      return;
    }

    toast.success(`Pitch ${action.replace(/_/g, " ")} successfully`);
    router.push("/dashboard/admin/pitches");
  }

  const avgScore =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + ((r.overall_score as number) ?? 0), 0) / reviews.length
      : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{startup?.name as string}</h1>
          <p className="text-muted-foreground text-sm">
            {(startup?.industry as string ?? "").replace(/_/g, " ")} •{" "}
            {(startup?.stage as string ?? "").replace(/_/g, " ")}
          </p>
        </div>
        <Badge className="ml-auto capitalize">
          {(pitch.status as string ?? "").replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Reviews</p>
            <p className="text-2xl font-bold">{reviews.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Avg Score</p>
            <p className="text-2xl font-bold">{avgScore !== null ? `${avgScore.toFixed(1)}/10` : "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Funding Ask</p>
            <p className="text-2xl font-bold">{formatCurrency((pitch.funding_ask as number) ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">AI Score</p>
            <p className="text-2xl font-bold">
              {aiAnalysis ? `${(aiAnalysis.overall_score as number) ?? 0}/100` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="pitch">
            <TabsList>
              <TabsTrigger value="pitch">
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Pitch
              </TabsTrigger>
              <TabsTrigger value="reviews">
                <Star className="h-3.5 w-3.5 mr-1.5" />
                Reviews ({reviews.length})
              </TabsTrigger>
              {aiAnalysis && (
                <TabsTrigger value="ai">
                  <Bot className="h-3.5 w-3.5 mr-1.5" />
                  AI Analysis
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="pitch" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Tagline</p>
                    <p className="font-medium">{pitch.tagline as string}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Problem</p>
                    <p className="text-sm">{pitch.problem_statement as string}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Solution</p>
                    <p className="text-sm">{pitch.solution as string}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Value Proposition</p>
                    <p className="text-sm">{pitch.value_proposition as string}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Business Model</p>
                    <p className="text-sm">{pitch.business_model as string}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {[
                      { label: "TAM", value: formatCurrency((pitch.tam as number) ?? 0) },
                      { label: "SAM", value: formatCurrency((pitch.sam as number) ?? 0) },
                      { label: "SOM", value: formatCurrency((pitch.som as number) ?? 0) },
                      { label: "Funding Ask", value: formatCurrency((pitch.funding_ask as number) ?? 0) },
                      { label: "Pre-money Valuation", value: formatCurrency((pitch.pre_money_valuation as number) ?? 0) },
                      { label: "Team Size", value: `${(pitch.team_size as number) ?? 0} people` },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-muted-foreground">{label}</p>
                        <p className="font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4 mt-4">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No reviews submitted yet
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => {
                  const reviewer = review.reviewer as Record<string, unknown>;
                  return (
                    <Card key={review.id as string}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                              {((reviewer?.full_name as string) ?? "?")[0]}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{reviewer?.full_name as string}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(review.created_at as string)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              review.recommendation === "approve" ? "default" :
                              review.recommendation === "reject" ? "destructive" : "secondary"
                            } className="capitalize text-xs">
                              {(review.recommendation as string ?? "").replace(/_/g, " ")}
                            </Badge>
                            <span className="font-bold text-primary">{review.overall_score as number}/10</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <div className="grid grid-cols-5 gap-2 mb-3">
                          {["team", "market", "product", "traction", "financials"].map((k) => (
                            <div key={k} className="text-center">
                              <p className="text-xs text-muted-foreground capitalize">{k}</p>
                              <p className="font-semibold text-sm">{review[`${k}_score`] as number}</p>
                            </div>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground">{review.feedback as string}</p>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {aiAnalysis && (
              <TabsContent value="ai" className="mt-4">
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Overall AI Score</p>
                      <div className="text-2xl font-bold text-primary">
                        {(aiAnalysis.overall_score as number) ?? 0}/100
                      </div>
                    </div>
                    <Separator />
                    {(aiAnalysis.strengths as string[] | undefined) && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5 text-green-500" /> Strengths
                        </p>
                        <ul className="space-y-1">
                          {(aiAnalysis.strengths as string[]).map((s, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-green-500 mt-0.5">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(aiAnalysis.weaknesses as string[] | undefined) && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" /> Areas for Improvement
                        </p>
                        <ul className="space-y-1">
                          {(aiAnalysis.weaknesses as string[]).map((w, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                              <span className="text-red-500 mt-0.5">•</span>
                              <span>{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {(aiAnalysis.summary as string | undefined) && (
                      <div>
                        <p className="text-sm font-medium mb-1">Summary</p>
                        <p className="text-sm text-muted-foreground">{aiAnalysis.summary as string}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Decision panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Admin Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={activeAction === key ? config.variant : "outline"}
                    onClick={() => setActiveAction(activeAction === key ? null : key)}
                    className="justify-start gap-2"
                    disabled={loading}
                  >
                    <config.icon className="h-4 w-4" />
                    {config.label}
                  </Button>
                ))}
              </div>

              {activeAction && (
                <div className="space-y-2 pt-2 border-t">
                  <Label>
                    {activeAction === "approved" ? "Notes (optional)" : "Reason (required)"}
                  </Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      activeAction === "approved"
                        ? "Any notes for the founder..."
                        : "Explain what needs to change or why rejected..."
                    }
                    rows={4}
                    className="resize-none"
                  />
                  <Button
                    className="w-full"
                    disabled={loading}
                    onClick={() => handleAction(activeAction)}
                  >
                    {loading ? "Processing..." : `Confirm ${STATUS_CONFIG[activeAction as keyof typeof STATUS_CONFIG].label}`}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Founder</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary text-sm">
                {((founder?.full_name as string) ?? "?")[0]}
              </div>
              <div>
                <p className="font-medium text-sm">{founder?.full_name as string}</p>
                <p className="text-xs text-muted-foreground">{founder?.email as string}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
