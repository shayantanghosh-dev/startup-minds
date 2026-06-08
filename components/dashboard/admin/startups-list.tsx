"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Search, Star, Shield, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface Props {
  startups: Record<string, unknown>[];
}

export default function AdminStartupsList({ startups: initialStartups }: Props) {
  const [startups, setStartups] = useState(initialStartups);
  const [search, setSearch] = useState("");

  const filtered = startups.filter((s) =>
    (s.name as string ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function toggleFeatured(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("startups").update({ is_featured: !current }).eq("id", id);
    setStartups((prev) =>
      prev.map((s) => s.id === id ? { ...s, is_featured: !current } : s)
    );
    toast.success(`Startup ${!current ? "featured" : "unfeatured"}`);
  }

  async function toggleVerified(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("startups").update({ is_verified: !current }).eq("id", id);
    setStartups((prev) =>
      prev.map((s) => s.id === id ? { ...s, is_verified: !current } : s)
    );
    toast.success(`Startup ${!current ? "verified" : "unverified"}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Startups</h1>
        <p className="text-muted-foreground">Manage all registered startups</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search startups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Startup</th>
                  <th className="text-left px-4 py-3 font-medium">Stage</th>
                  <th className="text-left px-4 py-3 font-medium">Founder</th>
                  <th className="text-left px-4 py-3 font-medium">Health</th>
                  <th className="text-left px-4 py-3 font-medium">Pitch</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Joined</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">No startups found</td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const founder = s.founder as Record<string, unknown>;
                    const pitches = (s.pitches as Record<string, unknown>[]) ?? [];
                    const latestPitch = pitches[0];
                    const healthScores = (s.health_scores as Record<string, unknown>[]) ?? [];
                    const healthScore = healthScores[0];

                    return (
                      <tr key={s.id as string} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-medium">{s.name as string}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {(s.industry as string ?? "").replace(/_/g, " ")}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs capitalize text-muted-foreground">
                          {(s.stage as string ?? "").replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{founder?.full_name as string}</div>
                          <div className="text-xs text-muted-foreground">{founder?.email as string}</div>
                        </td>
                        <td className="px-4 py-3">
                          {healthScore ? (
                            <span className="font-semibold">{healthScore.overall_score as number}/100</span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {latestPitch ? (
                            <Badge variant="secondary" className="text-xs capitalize">
                              {(latestPitch.status as string ?? "").replace(/_/g, " ")}
                            </Badge>
                          ) : <span className="text-muted-foreground text-xs">No pitch</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {!!(s.is_verified) && (
                              <Badge variant="default" className="text-xs gap-1">
                                <Shield className="h-2.5 w-2.5" />Verified
                              </Badge>
                            )}
                            {!!(s.is_featured) && (
                              <Badge className="text-xs gap-1 bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                                <Star className="h-2.5 w-2.5" />Featured
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {formatDate(s.created_at as string)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFeatured(s.id as string, s.is_featured as boolean)}
                              title={s.is_featured ? "Remove from featured" : "Feature startup"}
                            >
                              <Star className={`h-3.5 w-3.5 ${s.is_featured ? "fill-yellow-500 text-yellow-500" : ""}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleVerified(s.id as string, s.is_verified as boolean)}
                              title={s.is_verified ? "Remove verification" : "Verify startup"}
                            >
                              <Shield className={`h-3.5 w-3.5 ${s.is_verified ? "text-primary" : ""}`} />
                            </Button>
                            <Link href={`/startups/${s.id as string}`} target="_blank">
                              <Button variant="ghost" size="icon">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
