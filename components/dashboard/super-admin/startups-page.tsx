"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Search, Rocket, Star, Zap } from "lucide-react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";

interface SuperAdminStartupsPageProps {
  startups: Array<Record<string, unknown>>;
}

export function SuperAdminStartupsPage({ startups }: SuperAdminStartupsPageProps) {
  const supabase = createClient();
  const [search, setSearch] = useState("");

  const filtered = startups.filter(s => {
    const name = (s.name as string ?? "").toLowerCase();
    const industry = (s.industry as string ?? "").toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q) || industry.includes(q);
  });

  async function toggleFeatured(id: string, current: boolean) {
    const { error } = await supabase.from("startups").update({ is_featured: !current }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(!current ? "Startup featured" : "Startup unfeatured"); window.location.reload(); }
  }

  async function toggleDPIIT(id: string, current: boolean) {
    const { error } = await supabase.from("startups").update({ is_dpiit_verified: !current }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("DPIIT status updated"); window.location.reload(); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Startup Management</h1>
        <p className="text-muted-foreground">{startups.length} startups on the platform</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search startups..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Rocket className="h-5 w-5" /> No startups found
              </div>
            ) : filtered.map(startup => {
              const founder = startup.users as Record<string, unknown> | null;
              const pitches = (startup.pitches as Array<Record<string, unknown>>) ?? [];
              const healthScore = (startup.startup_health_scores as Array<Record<string, unknown>>)?.[0]?.overall_score as number ?? 0;
              const latestPitch = pitches[0];

              return (
                <div key={startup.id as string} className="flex items-center gap-4 p-4 hover:bg-muted/30">
                  <Avatar className="h-10 w-10 shrink-0 rounded-lg">
                    <AvatarImage src={(startup.logo_url as string) ?? ""} />
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-sm">
                      {(startup.name as string).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{startup.name as string}</p>
                      {!!(startup.is_featured) && <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />}
                      {!!(startup.is_dpiit_verified) && <Badge variant="outline" className="text-xs text-green-600">DPIIT</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{startup.industry as string} · {founder?.full_name as string}</p>
                    {latestPitch && (
                      <Badge variant="outline" className="text-xs mt-0.5 capitalize">
                        {(latestPitch.status as string).replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                  {healthScore > 0 && (
                    <div className="hidden md:block w-24">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Health</span>
                        <span className="font-medium">{healthScore}</span>
                      </div>
                      <Progress value={healthScore} className="h-1" />
                    </div>
                  )}
                  <div className="flex gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" className={`h-7 text-xs ${startup.is_featured ? "bg-yellow-50 text-yellow-700 border-yellow-300" : ""}`}
                      onClick={() => toggleFeatured(startup.id as string, startup.is_featured as boolean)}>
                      {startup.is_featured ? "Unfeature" : "Feature"}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => toggleDPIIT(startup.id as string, startup.is_dpiit_verified as boolean)}>
                      {startup.is_dpiit_verified ? "Revoke DPIIT" : "DPIIT Verify"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7" asChild>
                      <Link href={`/startups/${startup.id as string}`}><Zap className="h-3.5 w-3.5" /></Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
