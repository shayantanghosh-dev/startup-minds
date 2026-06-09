"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, MapPin, DollarSign, Zap, Star, ExternalLink, MessageSquare, UserPlus, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";

interface InvestorUser {
  id?: string;
  full_name: string;
  avatar_url?: string | null;
  email: string;
  location?: string | null;
}

interface InvestorRecord {
  id: string;
  user_id?: string;
  organization?: string | null;
  organization_type?: string | null;
  min_ticket_size?: number | null;
  max_ticket_size?: number | null;
  preferred_sectors?: string[] | null;
  preferred_stages?: string[] | null;
  investment_thesis?: string | null;
  is_verified: boolean;
  users: InvestorUser | null;
}

interface InvestorMatch {
  id: string;
  compatibility_score: number;
  match_reasons?: string[] | null;
  ai_explanation?: string | null;
  investors: InvestorRecord | null;
}

interface FounderInvestorsPageProps {
  startup: { id: string; name: string } | null;
  matches: InvestorMatch[];
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-green-600 dark:text-green-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-muted-foreground";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
  if (score >= 60) return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800";
  return "bg-muted/50";
}

function MatchCard({ match, myId }: { match: InvestorMatch; myId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const inv = match.investors!;
  const user = inv.users!;
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [messaging, setMessaging] = useState(false);

  async function handleConnect() {
    if (!inv.user_id) return;
    setConnecting(true);
    try {
      const { error } = await supabase.from("connection_requests").insert({
        sender_id: myId,
        receiver_id: inv.user_id,
        message: `Hi, I noticed you're a great match for ${match.investors?.organization ?? "my startup"} based on our AI compatibility score of ${match.compatibility_score}%. I'd love to connect!`,
        status: "pending",
      });
      if (error) {
        if (error.code === "23505") {
          toast.info("Connection request already sent");
        } else {
          toast.error(error.message);
        }
      } else {
        setConnected(true);
        toast.success("Connection request sent!");
      }
    } finally {
      setConnecting(false);
    }
  }

  async function handleMessage() {
    if (!inv.user_id) return;
    setMessaging(true);
    try {
      // Find or create conversation
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .contains("participant_ids", [myId, inv.user_id])
        .maybeSingle();

      if (existing) {
        router.push(`/dashboard/founder/messages`);
        return;
      }

      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({ participant_ids: [myId, inv.user_id] })
        .select("id")
        .single();

      if (error) { toast.error(error.message); return; }
      router.push(`/dashboard/founder/messages`);
    } finally {
      setMessaging(false);
    }
  }

  return (
    <Card className={`hover:shadow-md transition-all ${getScoreBg(match.compatibility_score)}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={user.avatar_url ?? ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
              {user.full_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm">{user.full_name}</p>
              {inv.is_verified && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-500/30 bg-green-500/5 py-0">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />Verified
                </Badge>
              )}
            </div>
            {inv.organization && <p className="text-xs text-muted-foreground truncate">{inv.organization}</p>}
            {user.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />{user.location}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className={`text-xl font-black ${getScoreColor(match.compatibility_score)}`}>
              {match.compatibility_score}%
            </p>
            <p className="text-[10px] text-muted-foreground">match</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Compatibility bar */}
        <div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1"><Star className="h-3 w-3" /> AI Compatibility</span>
            <span>{match.compatibility_score}%</span>
          </div>
          <Progress value={match.compatibility_score} className="h-1.5" />
        </div>

        {inv.min_ticket_size && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="h-3.5 w-3.5 shrink-0" />
            <span>
              {formatCurrency(inv.min_ticket_size)} – {inv.max_ticket_size ? formatCurrency(inv.max_ticket_size) : "Open"} ticket
            </span>
          </div>
        )}

        {inv.preferred_sectors && inv.preferred_sectors.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {inv.preferred_sectors.slice(0, 4).map(s => (
              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
            ))}
            {inv.preferred_sectors.length > 4 && (
              <Badge variant="secondary" className="text-xs">+{inv.preferred_sectors.length - 4}</Badge>
            )}
          </div>
        )}

        {match.ai_explanation && (
          <p className="text-xs text-muted-foreground border-t pt-2 italic">&ldquo;{match.ai_explanation}&rdquo;</p>
        )}

        {Array.isArray(match.match_reasons) && match.match_reasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {match.match_reasons.map(r => (
              <span key={r} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{r}</span>
            ))}
          </div>
        )}

        {/* Action buttons — in-platform, not mailto */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={handleConnect}
            disabled={connecting || connected}
          >
            {connecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : connected ? (
              <><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Sent</>
            ) : (
              <><UserPlus className="h-3.5 w-3.5" /> Connect</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={handleMessage}
            disabled={messaging}
          >
            {messaging
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <><MessageSquare className="h-3.5 w-3.5" /> Message</>
            }
          </Button>
          {inv.user_id && (
            <Button size="sm" variant="ghost" className="px-2 text-xs" asChild>
              <Link href={`/profile/${inv.user_id}`} title="View profile">
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function FounderInvestorsPage({ startup, matches, myUserId }: FounderInvestorsPageProps & { myUserId?: string }) {
  if (!startup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 max-w-md mx-auto text-center pt-12">
        <div className="rounded-2xl bg-primary/10 p-6">
          <Users className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-xl mb-2">Set up your startup first</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Create your startup profile and submit a pitch deck to unlock AI-powered investor matching.
          </p>
          <Button asChild>
            <Link href="/dashboard/founder/startup">
              Create Startup Profile <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const validMatches = matches.filter((m) => m.investors && m.investors.users);
  const topMatches = validMatches.filter((m) => m.compatibility_score >= 80);
  const goodMatches = validMatches.filter((m) => m.compatibility_score >= 60 && m.compatibility_score < 80);
  const otherMatches = validMatches.filter((m) => m.compatibility_score < 60);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Investor Matches</h1>
          <p className="text-muted-foreground text-sm">
            AI-curated investors for <strong>{startup.name}</strong>
          </p>
        </div>
        {validMatches.length > 0 && (
          <div className="text-right shrink-0">
            <p className="text-2xl font-black text-primary">{validMatches.length}</p>
            <p className="text-xs text-muted-foreground">matches</p>
          </div>
        )}
      </div>

      {/* Tip banner */}
      {validMatches.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Tip:</span> Use{" "}
            <span className="text-primary font-medium">Connect</span> to send a platform connection request, or{" "}
            <span className="text-primary font-medium">Message</span> to start a private conversation —
            both are more effective than cold email.
          </p>
        </div>
      )}

      {validMatches.length === 0 ? (
        <div className="rounded-2xl border bg-card p-10 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-2">No matches yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
            Investor matches are generated after your pitch is reviewed and approved.
            Complete these steps to get matched:
          </p>
          <div className="space-y-2.5 text-left max-w-xs mx-auto mb-6">
            {[
              { step: "Complete your startup profile", href: "/dashboard/founder/startup" },
              { step: "Upload and submit your pitch deck", href: "/dashboard/founder/pitch" },
              { step: "Pass expert review", href: "/dashboard/founder/pitch" },
            ].map((item, i) => (
              <Link key={item.step} href={item.href} className="flex items-center gap-3 hover:text-primary group">
                <div className="h-5 w-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  {i + 1}
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">{item.step}</span>
                <ArrowRight className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
              </Link>
            ))}
          </div>
          <Button asChild>
            <Link href="/dashboard/founder/pitch">Go to Pitch <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {topMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-green-600">
                  ⚡ Strong Matches — {topMatches.length}
                </span>
                <div className="flex-1 h-px bg-green-200 dark:bg-green-800" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {topMatches.map(match => (
                  <MatchCard key={match.id} match={match} myId={myUserId ?? ""} />
                ))}
              </div>
            </div>
          )}

          {goodMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                  Good Matches — {goodMatches.length}
                </span>
                <div className="flex-1 h-px bg-amber-200 dark:bg-amber-800" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {goodMatches.map(match => (
                  <MatchCard key={match.id} match={match} myId={myUserId ?? ""} />
                ))}
              </div>
            </div>
          )}

          {otherMatches.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Other Matches — {otherMatches.length}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {otherMatches.map(match => (
                  <MatchCard key={match.id} match={match} myId={myUserId ?? ""} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
