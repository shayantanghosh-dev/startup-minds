"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Briefcase, Bookmark, ExternalLink, TrendingUp, Building2,
  Plus, ArrowRight, Search, DollarSign, Star, Loader2, X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

// ─── Stage config ──────────────────────────────────────────────────────────────
const STAGE_CONFIG: Record<string, { label: string; color: string }> = {
  interested:     { label: "Interested",      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  contacted:      { label: "Contacted",       color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  meeting_scheduled: { label: "Meeting",      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  due_diligence:  { label: "Due Diligence",   color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  term_sheet:     { label: "Term Sheet",      color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300" },
  invested:       { label: "Invested ✓",      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  passed:         { label: "Passed",          color: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400" },
};

interface CRMRecord {
  id: string;
  stage: string;
  investment_amount?: number;
  notes?: string;
  updated_at: string;
  startups: {
    id: string;
    name: string;
    logo_url?: string;
    tagline?: string;
    stage?: string;
    industry?: string;
    health_score?: number;
  } | null;
}

interface Bookmark {
  id: string;
  startup_id: string;
  created_at: string;
  startups: {
    id: string;
    name: string;
    logo_url?: string;
    tagline?: string;
    stage?: string;
    industry?: string;
    health_score?: number;
  } | null;
}

interface Props {
  pipeline: CRMRecord[];
  watchlist: Bookmark[];
  investorId: string;
  userId: string;
}

// ─── Pipeline card ─────────────────────────────────────────────────────────────
function PipelineCard({
  record, investorId, onStageChange,
}: {
  record: CRMRecord;
  investorId: string;
  onStageChange: (id: string, stage: string) => void;
}) {
  const startup = record.startups;
  const [updating, setUpdating] = useState(false);
  const supabase = createClient();
  const stageCfg = STAGE_CONFIG[record.stage] ?? STAGE_CONFIG.interested;

  async function updateStage(newStage: string) {
    setUpdating(true);
    const { error } = await supabase
      .from("crm_records")
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq("id", record.id);
    if (error) toast.error(error.message);
    else { toast.success("Stage updated"); onStageChange(record.id, newStage); }
    setUpdating(false);
  }

  if (!startup) return null;

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            {startup.logo_url
              ? <img src={startup.logo_url} alt={startup.name} className="h-full w-full rounded-lg object-cover" />
              : <Building2 className="h-5 w-5 text-muted-foreground" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{startup.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {(startup.stage ?? "").replace(/_/g, " ")}
              {startup.industry ? ` • ${startup.industry}` : ""}
            </p>
          </div>
          {startup.health_score != null && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {startup.health_score}/100
            </Badge>
          )}
        </div>

        {startup.tagline && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{startup.tagline}</p>
        )}

        {record.investment_amount != null && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 mb-2">
            <DollarSign className="h-3 w-3" />
            Invested: {formatCurrency(record.investment_amount)}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <Select
            value={record.stage}
            onValueChange={updateStage}
            disabled={updating}
          >
            <SelectTrigger className={`h-7 text-xs flex-1 border-0 ${stageCfg.color}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STAGE_CONFIG).map(([value, cfg]) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {updating && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />}
          <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
            <Link href={`/dashboard/investor/crm`}>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Watchlist card ────────────────────────────────────────────────────────────
function WatchlistCard({
  bookmark, userId, onRemove,
}: {
  bookmark: Bookmark;
  userId: string;
  onRemove: (id: string) => void;
}) {
  const startup = bookmark.startups;
  const [removing, setRemoving] = useState(false);
  const supabase = createClient();

  async function handleRemove() {
    setRemoving(true);
    const { error } = await supabase
      .from("bookmarks")
      .delete()
      .eq("id", bookmark.id);
    if (error) toast.error(error.message);
    else { toast.success("Removed from watchlist"); onRemove(bookmark.id); }
    setRemoving(false);
  }

  if (!startup) return null;

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            {startup.logo_url
              ? <img src={startup.logo_url} alt={startup.name} className="h-full w-full rounded-lg object-cover" />
              : <Building2 className="h-5 w-5 text-muted-foreground" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{startup.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {(startup.stage ?? "").replace(/_/g, " ")}
              {startup.industry ? ` • ${startup.industry}` : ""}
            </p>
          </div>
          {startup.health_score != null && (
            <Badge variant="secondary" className="text-xs shrink-0">{startup.health_score}/100</Badge>
          )}
        </div>

        {startup.tagline && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{startup.tagline}</p>
        )}

        <div className="flex gap-2 mt-2">
          <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1" asChild>
            <Link href={`/dashboard/investor/discover`}>
              <ExternalLink className="h-3 w-3" /> View
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            disabled={removing}
          >
            {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main portfolio ────────────────────────────────────────────────────────────
export default function InvestorPortfolio({ pipeline: initialPipeline, watchlist: initialWatchlist, investorId, userId }: Props) {
  const [pipeline, setPipeline] = useState(initialPipeline);
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [stageFilter, setStageFilter] = useState<string>("all");

  const invested = pipeline.filter(r => r.stage === "invested");
  const totalInvested = invested.reduce((sum, r) => sum + (r.investment_amount ?? 0), 0);

  const activePipeline = pipeline.filter(r => r.stage !== "passed");
  const filtered = stageFilter === "all" ? activePipeline : activePipeline.filter(r => r.stage === stageFilter);

  function handleStageChange(id: string, stage: string) {
    setPipeline(prev => prev.map(r => r.id === id ? { ...r, stage } : r));
  }

  function handleRemoveBookmark(id: string) {
    setWatchlist(prev => prev.filter(b => b.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Track your investments and watchlist</p>
        </div>
        <Button asChild size="sm" className="gap-1.5">
          <Link href="/dashboard/investor/discover">
            <Search className="h-3.5 w-3.5" /> Discover Startups
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Briefcase className="h-4 w-4" /> Portfolio Companies
            </div>
            <p className="text-3xl font-bold">{invested.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{activePipeline.length} total in pipeline</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4" /> Total Invested
            </div>
            <p className="text-3xl font-bold">
              {totalInvested > 0 ? formatCurrency(totalInvested) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Bookmark className="h-4 w-4" /> Watchlist
            </div>
            <p className="text-3xl font-bold">{watchlist.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">
            <Briefcase className="h-3.5 w-3.5 mr-1.5" />
            Pipeline ({activePipeline.length})
          </TabsTrigger>
          <TabsTrigger value="watchlist">
            <Bookmark className="h-3.5 w-3.5 mr-1.5" />
            Watchlist ({watchlist.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Pipeline tab ── */}
        <TabsContent value="pipeline" className="mt-4 space-y-4">
          {activePipeline.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filter:</span>
              {["all", ...Object.keys(STAGE_CONFIG)].map(s => (
                <button
                  key={s}
                  onClick={() => setStageFilter(s)}
                  className={[
                    "text-xs px-2.5 py-1 rounded-full border transition-colors",
                    stageFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/40",
                  ].join(" ")}
                >
                  {s === "all" ? "All" : STAGE_CONFIG[s]?.label ?? s}
                  {s !== "all" && (
                    <span className="ml-1 opacity-60">
                      ({pipeline.filter(r => r.stage === s).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-medium mb-1">
                  {activePipeline.length === 0 ? "No startups in your pipeline" : "No startups in this stage"}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {activePipeline.length === 0
                    ? "Discover startups and add them to your CRM pipeline to track deals"
                    : "Try selecting a different stage filter"}
                </p>
                {activePipeline.length === 0 && (
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button asChild size="sm" className="gap-1.5">
                      <Link href="/dashboard/investor/discover">
                        <Search className="h-3.5 w-3.5" /> Discover Startups
                      </Link>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                      <Link href="/dashboard/investor/matches">
                        <Star className="h-3.5 w-3.5" /> AI Matches
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(record => (
                <PipelineCard
                  key={record.id}
                  record={record}
                  investorId={investorId}
                  onStageChange={handleStageChange}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Watchlist tab ── */}
        <TabsContent value="watchlist" className="mt-4">
          {watchlist.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="font-medium mb-1">No bookmarked startups</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Click the bookmark icon on any startup card to save it here
                </p>
                <Button asChild size="sm" className="gap-1.5">
                  <Link href="/dashboard/investor/discover">
                    <Search className="h-3.5 w-3.5" /> Browse Startups
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {watchlist.map(bookmark => (
                <WatchlistCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  userId={userId}
                  onRemove={handleRemoveBookmark}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
