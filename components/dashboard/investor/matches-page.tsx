"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Star, X, Eye, Loader2, Zap, TrendingUp } from "lucide-react";
import Link from "next/link";

interface Match {
  id: string;
  compatibility_score: number;
  match_reasons: string[];
  ai_explanation?: string;
  startups: {
    id: string;
    name: string;
    slogan?: string;
    logo_url?: string;
    industry: string;
    stage: string;
    city?: string;
    health_score?: number;
    startup_health_scores?: Array<{ overall_score: number }>;
    pitches?: Array<{ amount_raising: number; ai_quality_score?: number; status: string }>;
  };
}

interface InvestorMatchesPageProps {
  matches: Match[];
  investorId: string;
}

export function InvestorMatchesPage({ matches: initialMatches, investorId }: InvestorMatchesPageProps) {
  const supabase = createClient();
  const [matches, setMatches] = useState(initialMatches);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  async function dismissMatch(matchId: string) {
    setDismissingId(matchId);
    const { error } = await supabase.from("startup_matches").update({ is_dismissed: true }).eq("id", matchId);
    if (error) toast.error(error.message);
    else setMatches(prev => prev.filter(m => m.id !== matchId));
    setDismissingId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 p-2">
          <Zap className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Startup Matches</h1>
          <p className="text-muted-foreground">Personalized startup recommendations based on your investment thesis</p>
        </div>
      </div>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-full bg-primary/10 p-4"><Star className="h-8 w-8 text-primary" /></div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">No Matches Yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Update your investment preferences in settings to get better startup matches.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {matches.map(match => {
            const startup = match.startups;
            const pitch = startup.pitches?.[0];
            const healthScore = startup.startup_health_scores?.[0]?.overall_score ?? startup.health_score ?? 0;

            return (
              <Card key={match.id} className="hover:border-primary/30 transition-colors relative group">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => dismissMatch(match.id)}
                  disabled={dismissingId === match.id}
                >
                  {dismissingId === match.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                </Button>

                <CardHeader className="pb-3 pr-10">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={startup.logo_url ?? ""} alt={startup.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                        {startup.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{startup.name}</p>
                      {startup.slogan && <p className="text-xs text-muted-foreground truncate">{startup.slogan}</p>}
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className="text-xs">{startup.industry}</Badge>
                        <Badge variant="secondary" className="text-xs">{startup.stage?.replace("_", " ")}</Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3" /> Match Score</span>
                      <span className="font-bold text-primary">{match.compatibility_score}%</span>
                    </div>
                    <Progress value={match.compatibility_score} className="h-1.5" />
                  </div>

                  {healthScore > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Health Score</span>
                      <span className="font-medium">{healthScore}/100</span>
                    </div>
                  )}

                  {pitch?.amount_raising && (
                    <div className="text-xs text-muted-foreground">
                      Raising: <span className="font-medium text-foreground">₹{(pitch.amount_raising / 10000000).toFixed(1)} Cr</span>
                    </div>
                  )}

                  {match.match_reasons && match.match_reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {match.match_reasons.slice(0, 3).map(r => (
                        <span key={r} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{r}</span>
                      ))}
                    </div>
                  )}

                  {match.ai_explanation && (
                    <p className="text-xs text-muted-foreground border-t pt-2 line-clamp-2">{match.ai_explanation}</p>
                  )}

                  <Button size="sm" className="w-full" asChild>
                    <Link href={`/startups/${startup.id}`}>
                      <Eye className="mr-2 h-3.5 w-3.5" /> View Startup
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
