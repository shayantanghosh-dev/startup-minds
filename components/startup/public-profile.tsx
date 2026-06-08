"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Building2,
  Globe,
  Linkedin,
  Twitter,
  Heart,
  Bookmark,
  Share2,
  Users,
  TrendingUp,
  DollarSign,
  MapPin,
  ExternalLink,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface Props {
  startup: Record<string, unknown>;
  pitch: Record<string, unknown> | null;
  currentUserId: string | null;
  userRole: string | null;
  isOwner: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
}

export default function StartupPublicProfile({
  startup,
  pitch,
  currentUserId,
  userRole,
  isOwner,
  isLiked: initialLiked,
  isBookmarked: initialBookmarked,
}: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const supabase = createClient();

  const founder = startup.founder as Record<string, unknown>;
  const members = (startup.members as Record<string, unknown>[]) ?? [];
  const healthScores = (startup.health_scores as Record<string, unknown>[])?.[0] ?? null;
  const aiAnalysis = pitch
    ? ((pitch.ai_analysis as Record<string, unknown>[])?.[0] ?? null)
    : null;

  async function toggleLike() {
    if (!currentUserId) { toast.error("Sign in to like"); return; }
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", currentUserId).eq("startup_id", startup.id as string);
      setLiked(false);
    } else {
      await supabase.from("likes").insert({ user_id: currentUserId, startup_id: startup.id as string });
      setLiked(true);
    }
  }

  async function toggleBookmark() {
    if (!currentUserId) { toast.error("Sign in to bookmark"); return; }
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", currentUserId).eq("startup_id", startup.id as string);
      setBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({ user_id: currentUserId, startup_id: startup.id as string });
      setBookmarked(true);
    }
  }

  function share() {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            StartupMinds
          </Link>
          {currentUserId ? (
            <Link href={`/dashboard/${(userRole ?? "founder").replace("_", "-")}`}>
              <Button variant="outline" size="sm">Dashboard</Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
              <Link href="/register"><Button size="sm">Get started</Button></Link>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border">
            {startup.logo_url ? (
              <Image src={startup.logo_url as string} alt={startup.name as string} width={80} height={80} className="object-cover" />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-3 mb-2">
              <h1 className="text-3xl font-bold">{startup.name as string}</h1>
              {!!(startup.is_featured) && (
                <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Featured</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-lg mb-3">{startup.tagline as string}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                <span className="capitalize">{(startup.industry as string ?? "").replace(/_/g, " ")}</span>
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="capitalize">{(startup.stage as string ?? "").replace(/_/g, " ")}</span>
              </span>
              {!!(startup.location) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {startup.location as string}
                </span>
              )}
              {!!(startup.founded_year) && (
                <span>Founded {startup.founded_year as string}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:flex-col sm:items-end">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleLike}>
                <Heart className={`h-4 w-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleBookmark}>
                <Bookmark className={`h-4 w-4 ${bookmarked ? "fill-primary text-primary" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={share}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
            {isOwner && (
              <Link href="/dashboard/founder/startup">
                <Button size="sm" variant="outline">Edit Profile</Button>
              </Link>
            )}
            {userRole === "investor" && currentUserId && (
              <Button size="sm">Express Interest</Button>
            )}
          </div>
        </div>

        {/* Stats */}
        {healthScores && (
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {[
              { label: "Health Score", value: `${healthScores.overall_score as number}/100` },
              { label: "Team", value: `${healthScores.team_score as number}/100` },
              { label: "Market", value: `${healthScores.market_score as number}/100` },
              { label: "Product", value: `${healthScores.product_score as number}/100` },
              { label: "Traction", value: `${healthScores.traction_score as number}/100` },
              { label: "Financials", value: `${healthScores.financials_score as number}/100` },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-3 pb-3 text-center">
                  <p className="text-lg font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {pitch && <TabsTrigger value="pitch">Pitch</TabsTrigger>}
                <TabsTrigger value="team">Team</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-4 space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{startup.description as string}</p>
                  </CardContent>
                </Card>
                {!!(startup.key_metrics) && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Key Metrics</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {Object.entries(startup.key_metrics as Record<string, unknown>).map(([k, v]) => (
                          <div key={k} className="bg-muted/50 rounded-lg p-3">
                            <p className="text-muted-foreground capitalize text-xs">{k.replace(/_/g, " ")}</p>
                            <p className="font-semibold">{String(v)}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {pitch && (
                <TabsContent value="pitch" className="mt-4 space-y-4">
                  <Card>
                    <CardContent className="pt-4 space-y-4">
                      {[
                        { label: "Problem", value: pitch.problem_statement },
                        { label: "Solution", value: pitch.solution },
                        { label: "Value Proposition", value: pitch.value_proposition },
                      ].map(({ label, value }) => value ? (
                        <div key={label}>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
                          <p className="text-sm">{value as string}</p>
                          <Separator className="mt-4" />
                        </div>
                      ) : null)}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        {!!(pitch.funding_ask) && (
                          <div>
                            <p className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" />Funding Ask</p>
                            <p className="font-semibold">{formatCurrency(pitch.funding_ask as number)}</p>
                          </div>
                        )}
                        {!!(pitch.tam) && (
                          <div>
                            <p className="text-muted-foreground">TAM</p>
                            <p className="font-semibold">{formatCurrency(pitch.tam as number)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  {aiAnalysis && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          AI Analysis
                          <Badge variant="secondary">{aiAnalysis.overall_score as number}/100</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {!!(aiAnalysis.strengths) && (
                          <div>
                            <p className="text-xs font-medium text-green-600 mb-1">Strengths</p>
                            <ul className="space-y-1">
                              {(aiAnalysis.strengths as string[]).map((s, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                  <span className="text-green-500">•</span>{s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              )}

              <TabsContent value="team" className="mt-4">
                <Card>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                        {((founder?.full_name as string) ?? "?")[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{founder?.full_name as string}</p>
                        <p className="text-sm text-primary">Founder & CEO</p>
                        {!!(founder?.bio) && <p className="text-sm text-muted-foreground mt-1">{founder.bio as string}</p>}
                      </div>
                    </div>
                    {members.map((m) => {
                      const memberUser = m.user as Record<string, unknown>;
                      return (
                        <div key={m.id as string} className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                            {((memberUser?.full_name as string) ?? (m.name as string) ?? "?")[0]}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{(memberUser?.full_name as string) ?? (m.name as string)}</p>
                            <p className="text-xs text-muted-foreground">{m.role as string}</p>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Startup Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { label: "Industry", value: (startup.industry as string ?? "").replace(/_/g, " ") },
                  { label: "Stage", value: (startup.stage as string ?? "").replace(/_/g, " ") },
                  { label: "Employees", value: startup.employee_count ? `${startup.employee_count}` : null },
                  { label: "Founded", value: startup.founded_year as string },
                  { label: "Location", value: startup.location as string },
                ].filter((r) => r.value).map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium capitalize">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {!!(startup.website_url || startup.linkedin_url || startup.twitter_url) && (
              <Card>
                <CardHeader><CardTitle className="text-base">Links</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {!!(startup.website_url) && (
                    <a href={startup.website_url as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                      <Globe className="h-4 w-4" />{startup.website_url as string}
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {!!(startup.linkedin_url) && (
                    <a href={startup.linkedin_url as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                      <Linkedin className="h-4 w-4" />LinkedIn
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {!!(startup.twitter_url) && (
                    <a href={startup.twitter_url as string} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                      <Twitter className="h-4 w-4" />Twitter
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
