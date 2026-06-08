"use client";

import { useState } from "react";
import { Search, Filter, Heart, Bookmark, Brain, TrendingUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";
import { getInitials, formatCurrency, truncate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import type { Startup } from "@/types";

interface StartupDiscoveryProps {
  startups: Array<Startup & {
    startup_health_scores?: Array<{ overall_score: number }>;
    pitches?: Array<{ status: string; amount_raising: number; ai_quality_score: number | null }>;
  }>;
  investorId: string;
}

const STAGES = ["idea", "pre_seed", "seed", "series_a", "series_b", "series_c", "growth"];
const INDUSTRIES = ["Technology", "FinTech", "HealthTech", "EdTech", "AgriTech", "CleanTech", "D2C", "SaaS", "AI/ML", "Other"];

export function StartupDiscovery({ startups, investorId }: StartupDiscoveryProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const supabase = createClient();

  const filtered = startups.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.industry.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || s.stage === stageFilter;
    const matchIndustry = industryFilter === "all" || s.industry === industryFilter;
    return matchSearch && matchStage && matchIndustry;
  });

  async function handleLike(startupId: string) {
    const isLiked = likedIds.has(startupId);
    if (isLiked) {
      await supabase.from("likes").delete().match({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        entity_type: "startup",
        entity_id: startupId,
      });
      setLikedIds((prev) => { const next = new Set(prev); next.delete(startupId); return next; });
    } else {
      await supabase.from("likes").insert({
        entity_type: "startup",
        entity_id: startupId,
      });
      setLikedIds((prev) => new Set([...prev, startupId]));
    }
  }

  async function handleBookmark(startupId: string) {
    const isBookmarked = bookmarkedIds.has(startupId);
    if (isBookmarked) {
      await supabase.from("bookmarks").delete().match({
        startup_id: startupId,
      });
      setBookmarkedIds((prev) => { const next = new Set(prev); next.delete(startupId); return next; });
    } else {
      await supabase.from("bookmarks").insert({ startup_id: startupId });
      setBookmarkedIds((prev) => new Set([...prev, startupId]));
      toast.success("Startup bookmarked");
    }
  }

  async function addToCRM(startupId: string) {
    const { error } = await supabase.from("crm_records").upsert({
      investor_id: investorId,
      startup_id: startupId,
      stage: "interested",
    });

    if (error) {
      toast.error("Already in your pipeline");
    } else {
      toast.success("Added to your pipeline");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discover Startups</h1>
        <p className="text-muted-foreground">Browse {startups.length} verified startups</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search startups..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select value={stageFilter} onValueChange={(v) => setStageFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All stages" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace("_", " ").toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={industryFilter} onValueChange={(v) => setIndustryFilter(v ?? "all")}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {INDUSTRIES.map((i) => (
              <SelectItem key={i} value={i}>{i}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {startups.length} startups
      </p>

      {/* Startup Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((startup) => {
          const healthScore = startup.startup_health_scores?.[0]?.overall_score ?? 0;
          const pitch = startup.pitches?.[0];
          const isLiked = likedIds.has(startup.id);
          const isBookmarked = bookmarkedIds.has(startup.id);

          return (
            <Card key={startup.id} className="group hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 rounded-lg">
                    <AvatarImage src={startup.logo_url ?? ""} alt={startup.name} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold">
                      {getInitials(startup.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{startup.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {startup.stage.replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{startup.industry}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {truncate(startup.description, 120)}
                </p>

                {healthScore > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Health Score
                      </span>
                      <span className="text-xs font-medium">{healthScore}/100</span>
                    </div>
                    <Progress value={healthScore} className="h-1.5" />
                  </div>
                )}

                {pitch?.ai_quality_score && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Brain className="h-3 w-3 text-primary" />
                    AI Score: <span className="font-medium text-foreground">{pitch.ai_quality_score}/100</span>
                  </div>
                )}

                {pitch?.amount_raising && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Raising: </span>
                    <span className="font-semibold">{formatCurrency(pitch.amount_raising)}</span>
                  </div>
                )}

                <Separator />

                <div className="flex items-center gap-2">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleLike(startup.id)}
                  >
                    <Heart className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant={isBookmarked ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleBookmark(startup.id)}
                  >
                    <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-current" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8"
                    onClick={() => addToCRM(startup.id)}
                  >
                    Add to Pipeline
                  </Button>
                  <Button size="sm" className="flex-1 h-8" asChild>
                    <Link href={`/startups/${startup.id}`}>View Pitch</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium">No startups found</p>
          <p className="text-muted-foreground">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
