"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Users, MapPin, DollarSign, Zap, Star, Mail, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
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
  if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
  return "text-muted-foreground";
}

export function FounderInvestorsPage({ startup, matches }: FounderInvestorsPageProps) {
  if (!startup) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="rounded-full bg-primary/10 p-4"><Users className="h-8 w-8 text-primary" /></div>
        <div className="text-center">
          <h3 className="font-semibold text-lg">No Startup Profile</h3>
          <p className="text-muted-foreground text-sm">Create your startup profile to see investor matches.</p>
        </div>
      </div>
    );
  }

  // Filter out any matches with missing investor/user data
  const validMatches = matches.filter((m) => m.investors && m.investors.users);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Investor Matches</h1>
        <p className="text-muted-foreground">AI-powered investor matches for <strong>{startup.name}</strong></p>
      </div>

      {validMatches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-full bg-primary/10 p-4"><Zap className="h-8 w-8 text-primary" /></div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-1">No Matches Yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                Complete your startup profile and pitch to get AI-powered investor match recommendations.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{validMatches.length} investor match{validMatches.length !== 1 ? "es" : ""} found</p>
          <div className="grid gap-4 md:grid-cols-2">
            {validMatches.map(match => {
              const inv = match.investors!;
              const user = inv.users!;
              return (
                <Card key={match.id} className="hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={user.avatar_url ?? ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                          {user.full_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{user.full_name}</p>
                          {inv.is_verified && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-500/30 bg-green-500/5">
                              Verified
                            </Badge>
                          )}
                        </div>
                        {inv.organization && <p className="text-xs text-muted-foreground truncate">{inv.organization}</p>}
                        {user.location && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />{user.location}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getScoreColor(match.compatibility_score)}`}>
                          {match.compatibility_score}%
                        </p>
                        <p className="text-xs text-muted-foreground">match</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3" /> Compatibility</span>
                        <span>{match.compatibility_score}%</span>
                      </div>
                      <Progress value={match.compatibility_score} className="h-1.5" />
                    </div>

                    {inv.min_ticket_size && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <DollarSign className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {formatCurrency(inv.min_ticket_size)} – {inv.max_ticket_size ? formatCurrency(inv.max_ticket_size) : "Open"} ticket size
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
                      <p className="text-xs text-muted-foreground border-t pt-2">{match.ai_explanation}</p>
                    )}

                    {Array.isArray(match.match_reasons) && match.match_reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {match.match_reasons.map(r => (
                          <span key={r} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{r}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-2" asChild>
                        <a href={`mailto:${user.email}`}>
                          <Mail className="h-3.5 w-3.5" /> Email
                        </a>
                      </Button>
                      {inv.user_id && (
                        <Button size="sm" className="flex-1 gap-2" asChild>
                          <Link href={`/profile/${inv.user_id}`}>
                            <ExternalLink className="h-3.5 w-3.5" /> View Profile
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
