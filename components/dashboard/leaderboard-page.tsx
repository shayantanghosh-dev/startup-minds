"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Trophy, TrendingUp, Eye, Heart, Bookmark, Loader2, Medal } from "lucide-react";
import Link from "next/link";

const LEADERBOARD_TYPES = [
  { value: "health_score", label: "Health Score", icon: TrendingUp },
  { value: "most_viewed", label: "Most Viewed", icon: Eye },
  { value: "most_liked", label: "Most Liked", icon: Heart },
  { value: "most_bookmarked", label: "Most Bookmarked", icon: Bookmark },
];

const INDUSTRIES = [
  "All", "FinTech", "EdTech", "HealthTech", "AgriTech", "CleanTech",
  "SaaS", "E-commerce", "Logistics", "AI/ML", "Blockchain", "Other"
];

const STAGES = [
  { value: "", label: "All Stages" },
  { value: "idea", label: "Idea" },
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B+" },
];

interface LeaderboardEntry {
  id: string; name: string; slogan?: string; logo_url?: string;
  industry: string; stage: string; city?: string;
  health_score?: number; total_views: number; total_likes: number;
  total_bookmarks: number; founder_name: string; overall_score: number;
}

interface LeaderboardPageProps {
  initialStartups: LeaderboardEntry[];
}

const RANK_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-600"];
const RANK_ICONS = ["🥇", "🥈", "🥉"];

export function LeaderboardPage({ initialStartups }: LeaderboardPageProps) {
  const supabase = createClient();
  const [startups, setStartups] = useState<LeaderboardEntry[]>(initialStartups);
  const [type, setType] = useState("health_score");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchLeaderboard(newType = type, newIndustry = industry, newStage = stage) {
    setLoading(true);
    const { data } = await supabase.rpc("get_startup_leaderboard", {
      p_type: newType,
      p_industry: newIndustry || null,
      p_stage: newStage || null,
      p_limit: 50,
    });
    setStartups(data ?? []);
    setLoading(false);
  }

  function handleTypeChange(val: string) {
    setType(val);
    fetchLeaderboard(val, industry, stage);
  }

  function handleIndustryChange(val: string) {
    const v = val === "All" ? "" : val;
    setIndustry(v);
    fetchLeaderboard(type, v, stage);
  }

  function handleStageChange(val: string) {
    setStage(val);
    fetchLeaderboard(type, industry, val);
  }

  const activeTypeDef = LEADERBOARD_TYPES.find(t => t.value === type);
  const maxValue = Math.max(...startups.map(s => {
    if (type === "most_viewed") return s.total_views;
    if (type === "most_liked") return s.total_likes;
    if (type === "most_bookmarked") return s.total_bookmarks;
    return s.overall_score;
  }), 1);

  function getMetric(s: LeaderboardEntry): number {
    if (type === "most_viewed") return s.total_views;
    if (type === "most_liked") return s.total_likes;
    if (type === "most_bookmarked") return s.total_bookmarks;
    return s.overall_score;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-yellow-500/10 p-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Startup Leaderboard</h1>
          <p className="text-muted-foreground">Top performing startups on the platform</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-1">
              {LEADERBOARD_TYPES.map(t => (
                <Button
                  key={t.value}
                  variant={type === t.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTypeChange(t.value)}
                >
                  <t.icon className="mr-1.5 h-3.5 w-3.5" />
                  {t.label}
                </Button>
              ))}
            </div>
            <Select value={industry || "All"} onValueChange={(v: string | null) => { if (v) handleIndustryChange(v); }}>
              <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Industry" /></SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={stage} onValueChange={(v: string | null) => { if (v) handleStageChange(v); }}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Stage" /></SelectTrigger>
              <SelectContent>
                {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 podium */}
      {startups.length >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          {[1, 0, 2].map(i => {
            const s = startups[i];
            if (!s) return null;
            const rank = i + 1;
            return (
              <Card key={s.id} className={`${rank === 1 ? "border-yellow-500/50 bg-yellow-500/5" : ""} text-center`}>
                <CardContent className="pt-6 pb-4">
                  <div className="text-2xl mb-2">{RANK_ICONS[i]}</div>
                  <Avatar className="h-12 w-12 mx-auto mb-2">
                    <AvatarImage src={s.logo_url ?? ""} alt={s.name} />
                    <AvatarFallback className="text-sm font-bold bg-primary text-primary-foreground">
                      {s.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{s.industry}</p>
                  <p className={`text-lg font-bold mt-1 ${RANK_COLORS[i]}`}>{getMetric(s)}</p>
                  <p className="text-xs text-muted-foreground">{activeTypeDef?.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{activeTypeDef?.label} Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {startups.map((startup, idx) => (
                <Link key={startup.id} href={`/startups/${startup.id}`} className="block">
                  <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-8 text-center font-bold text-muted-foreground text-sm">
                      {idx < 3 ? <span className={RANK_COLORS[idx]}>{RANK_ICONS[idx]}</span> : `#${idx + 1}`}
                    </div>
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={startup.logo_url ?? ""} alt={startup.name} />
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {startup.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{startup.name}</p>
                        <Badge variant="outline" className="text-xs hidden sm:flex">{startup.stage?.replace("_", " ")}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{startup.industry} · {startup.city ?? startup.founder_name}</p>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="font-bold text-sm">{getMetric(startup).toLocaleString()}</p>
                      <div className="w-20 mt-1">
                        <Progress value={(getMetric(startup) / maxValue) * 100} className="h-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {startups.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <Medal className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>No startups found for this filter</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
