"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Brain, ChevronDown, ChevronUp, Edit2, Save, X, Plus, History,
  TrendingUp, Zap, CheckCircle, AlertTriangle, ArrowRight, Loader2,
  FileText, RotateCcw, BarChart2, Star, ShieldCheck, Eye,
  Upload, Video, Target, Users, DollarSign, Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate, formatRelativeTime } from "@/lib/utils";
import type { Pitch } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Version {
  id: string;
  version: number;
  change_summary: string | null;
  created_at: string;
}

interface PitchWorkspaceProps {
  startup: { id: string; name: string };
  pitch: Pitch;
  versions: Version[];
  onNewVersion: () => void;
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:             { label: "Draft",             color: "text-zinc-600 dark:text-zinc-400", bg: "bg-zinc-100 dark:bg-zinc-800" },
  submitted:         { label: "Submitted",          color: "text-blue-700 dark:text-blue-300",  bg: "bg-blue-100 dark:bg-blue-900/30" },
  under_review:      { label: "Under Review",       color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
  changes_requested: { label: "Changes Requested",  color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-100 dark:bg-orange-900/30" },
  approved:          { label: "Approved",           color: "text-green-700 dark:text-green-300",  bg: "bg-green-100 dark:bg-green-900/30" },
  published:         { label: "Published",          color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  rejected:          { label: "Rejected",           color: "text-red-700 dark:text-red-300",   bg: "bg-red-100 dark:bg-red-900/30" },
};

// ─── Pitch section definitions ────────────────────────────────────────────────
const PITCH_SECTIONS = [
  { key: "company_overview",       label: "Company Overview",        placeholder: "Describe what your company does in 2-3 sentences..." },
  { key: "problem_statement",      label: "Problem Statement",       placeholder: "What specific problem are you solving?" },
  { key: "real_world_examples",    label: "Real World Examples",     placeholder: "Give concrete examples of this problem in action..." },
  { key: "solution_description",   label: "Solution",                placeholder: "How does your product/service solve this problem?" },
  { key: "unique_value_proposition", label: "Unique Value Proposition", placeholder: "What makes you different from competitors?" },
  { key: "revenue_model",          label: "Revenue Model",           placeholder: "How do you make money? Describe your monetisation strategy..." },
];

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div
      className="rounded-full border-4 flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, borderColor: color, color, fontSize: size * 0.28 }}
    >
      {score}
    </div>
  );
}

// ─── Section editor card ──────────────────────────────────────────────────────
function SectionCard({
  sectionKey, label, placeholder, value, pitchId, canEdit,
}: {
  sectionKey: string;
  label: string;
  placeholder: string;
  value: string | null | undefined;
  pitchId: string;
  canEdit: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value ?? "");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const hasContent = !!(value?.trim());

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("pitches")
      .update({ [sectionKey]: text, updated_at: new Date().toISOString() })
      .eq("id", pitchId);
    if (error) { toast.error(error.message); }
    else { toast.success(`${label} saved`); setEditing(false); router.refresh(); }
    setSaving(false);
  }

  return (
    <Card className={`transition-colors ${!hasContent && canEdit ? "border-dashed border-muted-foreground/30" : ""}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => !editing && setExpanded(v => !v)}
              className="text-sm font-medium text-left hover:text-primary transition-colors flex items-center gap-1.5"
            >
              {expanded || editing ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {label}
            </button>
            {!hasContent && canEdit && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground h-4 px-1.5">Missing</Badge>
            )}
          </div>
          <div className="flex gap-1">
            {canEdit && !editing && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => { setEditing(true); setExpanded(true); }}
              >
                <Edit2 className="h-3 w-3" /> Edit
              </Button>
            )}
            {editing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground"
                  onClick={() => { setEditing(false); setText(value ?? ""); }}
                  disabled={saving}
                >
                  <X className="h-3 w-3" /> Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      {(expanded || editing) && (
        <CardContent className="px-4 pb-4">
          {editing ? (
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={placeholder}
              rows={5}
              className="resize-none text-sm"
              autoFocus
            />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {value ?? <span className="italic">Not filled in yet. Click Edit to add.</span>}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main workspace ───────────────────────────────────────────────────────────
export function PitchWorkspace({ startup, pitch, versions, onNewVersion }: PitchWorkspaceProps) {
  const router = useRouter();
  const supabase = createClient();
  const statusCfg = STATUS_CONFIG[pitch.status] ?? STATUS_CONFIG.draft;
  const aiAnalysis = pitch.ai_analysis;

  const [submitting, setSubmitting] = useState(false);
  const [runningAI, setRunningAI] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [deckUrl, setDeckUrl] = useState(pitch.pitch_deck_url ?? "");
  const [videoUrl, setVideoUrl] = useState(pitch.demo_video_url ?? "");
  const [savingMedia, setSavingMedia] = useState(false);

  const canEdit = ["draft", "changes_requested", "rejected"].includes(pitch.status);
  const canSubmit = pitch.status === "draft" || pitch.status === "changes_requested";

  // Fill progress: count non-empty pitch sections
  const filledSections = PITCH_SECTIONS.filter(s => !!(pitch as unknown as Record<string, unknown>)[s.key]).length;
  const fillPercent = Math.round((filledSections / PITCH_SECTIONS.length) * 100);

  // ── Submit for review ──────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (filledSections < 3) {
      toast.error("Please fill in at least 3 sections before submitting");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("pitches")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", pitch.id);
    if (error) { toast.error(error.message); setSubmitting(false); return; }
    // Create version snapshot
    await supabase.from("pitch_versions").insert({
      pitch_id: pitch.id,
      startup_id: pitch.startup_id,
      version: (pitch.version ?? 0) + 1,
      snapshot: pitch,
      change_summary: "Submitted for review",
    });
    toast.success("Pitch submitted for review!");
    router.refresh();
    setSubmitting(false);
  }, [pitch, supabase, router, filledSections]);

  // ── Run AI analysis ────────────────────────────────────────────────────────
  const handleRunAI = useCallback(async () => {
    setRunningAI(true);
    setActiveTab("ai");
    try {
      const res = await fetch("/api/pitch/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitchId: pitch.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "AI analysis failed");
      } else {
        toast.success("AI analysis complete!");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to run AI analysis");
    } finally {
      setRunningAI(false);
    }
  }, [pitch.id, router]);

  // ── Restore version ────────────────────────────────────────────────────────
  async function handleRestore(versionId: string) {
    setRestoringId(versionId);
    try {
      const res = await fetch("/api/pitch/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_id: versionId }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Restore failed"); }
      else { toast.success("Pitch restored!"); router.refresh(); }
    } catch {
      toast.error("Failed to restore pitch");
    }
    setRestoringId(null);
  }

  // ── Save media URLs ────────────────────────────────────────────────────────
  async function handleSaveMedia() {
    setSavingMedia(true);
    const { error } = await supabase
      .from("pitches")
      .update({ pitch_deck_url: deckUrl || null, demo_video_url: videoUrl || null })
      .eq("id", pitch.id);
    if (error) toast.error(error.message);
    else { toast.success("Media links saved"); router.refresh(); }
    setSavingMedia(false);
  }

  return (
    <div className="space-y-0">
      {/* ── Persistent action bar ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-0 py-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status + version */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
              {pitch.status === "under_review" && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />}
              {statusCfg.label}
            </span>
            <span className="text-xs text-muted-foreground">v{pitch.version ?? 1}</span>
            {pitch.submitted_at && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                · {formatRelativeTime(pitch.submitted_at)}
              </span>
            )}
          </div>

          {/* Profile completeness */}
          <div className="hidden md:flex items-center gap-2">
            <Progress value={fillPercent} className="w-20 h-1.5" />
            <span className="text-xs text-muted-foreground">{fillPercent}% complete</span>
          </div>

          {/* AI score badge if available */}
          {aiAnalysis && (
            <div className="flex items-center gap-1.5 rounded-full bg-purple-100 dark:bg-purple-900/30 px-2.5 py-0.5">
              <Brain className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                AI Score: {aiAnalysis.quality_score}/100
              </span>
            </div>
          )}

          <div className="flex-1" />

          {/* Context-aware action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {canSubmit && (
              <Button size="sm" onClick={handleSubmit} disabled={submitting} className="gap-1.5">
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                {pitch.status === "changes_requested" ? "Resubmit" : "Submit for Review"}
              </Button>
            )}

            {(pitch.status === "approved" || pitch.status === "published") && (
              <Button size="sm" onClick={onNewVersion} variant="outline" className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> New Version
              </Button>
            )}

            {pitch.status === "rejected" && (
              <Button size="sm" onClick={onNewVersion} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Create New Version
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={handleRunAI}
              disabled={runningAI}
              className="gap-1.5"
            >
              {runningAI ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              {runningAI ? "Analysing…" : "Run AI"}
            </Button>

            {canEdit && (
              <Button size="sm" variant="ghost" onClick={onNewVersion} className="gap-1.5">
                <Edit2 className="h-3.5 w-3.5" /> Edit in Wizard
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Status banners ── */}
      {pitch.status === "submitted" && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-400/50 bg-blue-50 dark:bg-blue-950/20 px-4 py-3 mb-4">
          <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <div>
            <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">Pitch in review queue</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Expert reviewers will assess your pitch within <strong>3–5 business days</strong>. You&apos;ll receive a notification with feedback.
            </p>
          </div>
        </div>
      )}

      {pitch.status === "under_review" && (
        <div className="flex items-center gap-3 rounded-xl border border-indigo-400/50 bg-indigo-50 dark:bg-indigo-950/20 px-4 py-3 mb-4">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
          <p className="text-sm font-medium">A reviewer is currently reviewing your pitch — expect feedback within 1–2 days.</p>
        </div>
      )}

      {pitch.status === "approved" && (
        <div className="flex items-start gap-3 rounded-xl border border-green-400/50 bg-green-50 dark:bg-green-950/20 px-4 py-3 mb-4">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm text-green-900 dark:text-green-100">Pitch approved — you&apos;re live!</p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">Investors can discover your startup. Check your investor matches.</p>
          </div>
          <Button size="sm" variant="outline" className="border-green-400 text-green-700 shrink-0" asChild>
            <a href="/dashboard/founder/investors">View Matches →</a>
          </Button>
        </div>
      )}

      {pitch.status === "changes_requested" && pitch.changes_requested && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-400/50 bg-orange-50 dark:bg-orange-950/20 px-4 py-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-orange-900 dark:text-orange-100">Changes Requested</p>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-0.5">{pitch.changes_requested}</p>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview"><FileText className="h-3.5 w-3.5 mr-1.5" />Overview</TabsTrigger>
          <TabsTrigger value="sections"><Edit2 className="h-3.5 w-3.5 mr-1.5" />Edit Sections</TabsTrigger>
          <TabsTrigger value="ai"><Brain className="h-3.5 w-3.5 mr-1.5" />AI Workspace</TabsTrigger>
          <TabsTrigger value="fundraising"><TrendingUp className="h-3.5 w-3.5 mr-1.5" />Fundraising</TabsTrigger>
          <TabsTrigger value="history"><History className="h-3.5 w-3.5 mr-1.5" />History</TabsTrigger>
          <TabsTrigger value="media"><Upload className="h-3.5 w-3.5 mr-1.5" />Media</TabsTrigger>
        </TabsList>

        {/* ── Overview tab ── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Completeness card */}
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Pitch Completeness</p>
                <span className="text-sm font-bold">{fillPercent}%</span>
              </div>
              <Progress value={fillPercent} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {filledSections}/{PITCH_SECTIONS.length} sections filled
                {filledSections < PITCH_SECTIONS.length && " — complete all sections for best results"}
              </p>
            </CardContent>
          </Card>

          {/* Section previews */}
          <div className="grid gap-4 md:grid-cols-2">
            {PITCH_SECTIONS.map(section => {
              const val = (pitch as unknown as Record<string, unknown>)[section.key] as string | undefined;
              return (
                <Card key={section.key} className={!val ? "border-dashed opacity-60" : ""}>
                  <CardHeader className="pb-1 pt-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {section.label}
                      </CardTitle>
                      {!val && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground">Missing</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {val ? (
                      <p className="text-sm leading-relaxed line-clamp-3">{val}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Not filled in yet</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Media links preview */}
          {(pitch.pitch_deck_url || pitch.demo_video_url) && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Media</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 flex flex-wrap gap-2">
                {pitch.pitch_deck_url && (
                  <Button size="sm" variant="outline" asChild className="gap-1.5">
                    <a href={pitch.pitch_deck_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-3.5 w-3.5" /> View Pitch Deck
                    </a>
                  </Button>
                )}
                {pitch.demo_video_url && (
                  <Button size="sm" variant="outline" asChild className="gap-1.5">
                    <a href={pitch.demo_video_url} target="_blank" rel="noopener noreferrer">
                      <Video className="h-3.5 w-3.5" /> Demo Video
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Edit Sections tab ── */}
        <TabsContent value="sections" className="mt-4 space-y-3">
          {!canEdit && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2.5 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              Sections are locked while your pitch is {statusCfg.label.toLowerCase()}. Create a new version to make changes.
            </div>
          )}
          {PITCH_SECTIONS.map(section => (
            <SectionCard
              key={section.key}
              sectionKey={section.key}
              label={section.label}
              placeholder={section.placeholder}
              value={(pitch as unknown as Record<string, unknown>)[section.key] as string | undefined}
              pitchId={pitch.id}
              canEdit={canEdit}
            />
          ))}
        </TabsContent>

        {/* ── AI Workspace tab ── */}
        <TabsContent value="ai" className="mt-4 space-y-4">
          {runningAI && (
            <Card>
              <CardContent className="py-10 flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                <p className="font-medium text-sm">Running AI analysis…</p>
                <p className="text-xs text-muted-foreground">This may take 15–30 seconds</p>
              </CardContent>
            </Card>
          )}

          {!runningAI && !aiAnalysis && (
            <Card>
              <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
                <div className="h-16 w-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-lg">StartupMind Investment Report</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Get a comprehensive AI-powered analysis of your pitch: investor attractiveness, funding readiness, risk assessment, and more.
                  </p>
                </div>
                <Button onClick={handleRunAI} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                  <Zap className="h-4 w-4" /> Generate Investment Report
                </Button>
              </CardContent>
            </Card>
          )}

          {!runningAI && aiAnalysis && (
            <div className="space-y-4">
              {/* Top scores */}
              <Card>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-4 mb-5">
                    <ScoreRing score={aiAnalysis.quality_score} size={64} />
                    <div className="flex-1">
                      <p className="font-bold text-lg">Investment Report</p>
                      <p className="text-sm text-muted-foreground">{startup.name}</p>
                      <Badge className="mt-1" variant={
                        aiAnalysis.overall_recommendation === "strong_buy" || aiAnalysis.overall_recommendation === "buy"
                          ? "default" : "destructive"
                      }>
                        {String(aiAnalysis.overall_recommendation ?? "").replace(/_/g, " ").toUpperCase()}
                      </Badge>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleRunAI} className="shrink-0 gap-1.5">
                      <RotateCcw className="h-3.5 w-3.5" /> Re-run
                    </Button>
                  </div>

                  {/* Sub-scores grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Market Score",     score: aiAnalysis.market_opportunity_score,  icon: Target },
                      { label: "Team Score",        score: aiAnalysis.team_strength_score,       icon: Users },
                      { label: "Business Model",   score: aiAnalysis.business_viability_score,  icon: BarChart2 },
                      { label: "Funding Readiness", score: aiAnalysis.funding_readiness,         icon: DollarSign },
                    ].map(item => (
                      <div key={item.label} className="rounded-lg bg-muted/50 p-3 text-center">
                        <item.icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{item.score}</p>
                        <Progress value={item.score} className="h-1 mt-1 mb-1" />
                        <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Strengths / Improvements */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" /> Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <ul className="space-y-2">
                      {(aiAnalysis.strengths ?? []).map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" /> Improvements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <ul className="space-y-2">
                      {(aiAnalysis.improvements ?? []).map((imp: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-orange-500 mt-0.5">•</span>{imp}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Executive summary */}
              {aiAnalysis.executive_summary && (
                <Card className="border-purple-200 dark:border-purple-800">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4 text-purple-500" /> Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{aiAnalysis.executive_summary}</p>
                  </CardContent>
                </Card>
              )}

              {/* Risk assessment */}
              {aiAnalysis.risk_assessment && (
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" /> Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{aiAnalysis.risk_assessment}</p>
                  </CardContent>
                </Card>
              )}

              {/* Missing information */}
              {aiAnalysis.missing_information && aiAnalysis.missing_information.length > 0 && (
                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-4 w-4" /> Missing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <ul className="space-y-1.5">
                      {aiAnalysis.missing_information.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                          <span className="mt-0.5">•</span>{item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-2">
                <Button onClick={handleRunAI} variant="outline" className="gap-2" disabled={runningAI}>
                  <RotateCcw className="h-4 w-4" /> Re-run Analysis
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Fundraising tab ── */}
        <TabsContent value="fundraising" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Amount Raising",  value: pitch.amount_raising ? formatCurrency(pitch.amount_raising) : "—",      icon: DollarSign, color: "text-emerald-600" },
              { label: "Valuation",       value: pitch.valuation_expectation ? formatCurrency(pitch.valuation_expectation) : "—", icon: BarChart2, color: "text-blue-600" },
              { label: "Equity Offered",  value: pitch.equity_offered ? `${pitch.equity_offered}%` : "—",                icon: Target,     color: "text-purple-600" },
              { label: "Monthly Revenue", value: pitch.monthly_revenue ? formatCurrency(pitch.monthly_revenue) : "—",    icon: TrendingUp, color: "text-orange-600" },
              { label: "MRR",             value: pitch.mrr ? formatCurrency(pitch.mrr) : "—",                            icon: Star,       color: "text-pink-600" },
              { label: "Total Customers", value: pitch.total_customers?.toString() ?? "—",                               icon: Users,      color: "text-indigo-600" },
            ].map(item => (
              <Card key={item.label}>
                <CardContent className="pt-5 pb-4">
                  <item.icon className={`h-4 w-4 mb-2 ${item.color}`} />
                  <p className="text-2xl font-bold">{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Use of funds */}
          {pitch.use_of_funds && Object.keys(pitch.use_of_funds).length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Use of Funds</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {Object.entries(pitch.use_of_funds).map(([category, pct]) => (
                  <div key={category}>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span className="capitalize">{category.replace(/_/g, " ")}</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Funding timeline */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Fundraising Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {pitch.submitted_at && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="ml-auto text-muted-foreground text-xs">{formatDate(pitch.submitted_at)}</span>
                </div>
              )}
              {pitch.status === "approved" && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                  <span className="text-muted-foreground">Approved — live on platform</span>
                </div>
              )}
              {!pitch.submitted_at && (
                <p className="text-sm text-muted-foreground italic">Submit your pitch to start your fundraising timeline.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Version History tab ── */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardContent className="pt-5">
              {versions.length === 0 ? (
                <div className="py-8 text-center">
                  <History className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium text-sm">No version history yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Submit your pitch to create the first version snapshot.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {versions.map((version, idx) => (
                    <div key={version.id} className="flex items-start gap-3 pb-4 last:pb-0 relative">
                      {/* Timeline line */}
                      {idx < versions.length - 1 && (
                        <div className="absolute left-3 top-6 bottom-0 w-px bg-border" />
                      )}
                      {/* Dot */}
                      <div className="h-6 w-6 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0 mt-0.5 z-10">
                        <span className="text-[10px] font-bold text-primary">{version.version}</span>
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">Version {version.version}</p>
                          <span className="text-xs text-muted-foreground shrink-0">{formatDate(version.created_at)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {version.change_summary ?? "No summary"}
                        </p>
                        {idx > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 h-6 px-2 text-xs gap-1 text-muted-foreground"
                            disabled={!!restoringId}
                            onClick={() => handleRestore(version.id)}
                          >
                            {restoringId === version.id
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <RotateCcw className="h-3 w-3" />
                            }
                            Restore
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Media tab ── */}
        <TabsContent value="media" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" /> Pitch Deck PDF
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <Input
                value={deckUrl}
                onChange={e => setDeckUrl(e.target.value)}
                placeholder="https://your-pitch-deck-url.com/deck.pdf"
                className="text-sm"
              />
              {deckUrl && (
                <Button size="sm" variant="outline" asChild className="gap-1.5">
                  <a href={deckUrl} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Video className="h-4 w-4" /> Demo Video URL
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              <Input
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or Loom link"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">YouTube, Vimeo, or Loom links work best</p>
              {videoUrl && (
                <Button size="sm" variant="outline" asChild className="gap-1.5">
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-3.5 w-3.5" /> Preview
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSaveMedia} disabled={savingMedia} className="gap-2">
            {savingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Media Links
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
