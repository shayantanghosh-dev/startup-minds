export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Globe, Linkedin, Twitter, Mail, Building2, CheckCircle2, TrendingUp, Users } from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";
import Link from "next/link";
import { ConnectButton } from "@/components/profile/connect-button";

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params;

  const admin = await createAdminClient();
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Load the profile
  const { data: profile } = await admin
    .from("users")
    .select("id, full_name, avatar_url, bio, role, location, linkedin_url, twitter_url, website_url, is_verified, created_at")
    .eq("id", userId)
    .single();

  if (!profile) notFound();

  // Load role-specific data in parallel
  const isFounder = profile.role === "founder";
  const isInvestor = profile.role === "investor";

  const [{ data: startup }, { data: investor }] = await Promise.all([
    isFounder
      ? admin.from("startups").select("id, name, description, stage, industry, location, logo_url, website_url").eq("founder_id", userId).single()
      : Promise.resolve({ data: null }),
    isInvestor
      ? admin.from("investors").select("id, organization, organization_type, min_ticket_size, max_ticket_size, preferred_sectors, preferred_stages, investment_thesis, is_verified, portfolio_count").eq("user_id", userId).single()
      : Promise.resolve({ data: null }),
  ]);

  // Load connection status between currentUser and this profile
  let connectionStatus: string | null = null;
  if (currentUser && currentUser.id !== userId) {
    const { data: conn } = await admin
      .from("connection_requests")
      .select("status")
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id})`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    connectionStatus = conn?.status ?? null;
  }

  const isSelf = currentUser?.id === userId;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 text-xl">
              <AvatarImage src={profile.avatar_url ?? ""} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                {profile.is_verified && (
                  <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
                )}
                <Badge variant="secondary" className="capitalize">{profile.role?.replace("_", " ")}</Badge>
              </div>
              {investor?.organization && (
                <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" /> {investor.organization}
                </p>
              )}
              {profile.location && (
                <p className="text-muted-foreground text-sm mt-1 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {profile.location}
                </p>
              )}
              {profile.bio && (
                <p className="text-sm mt-3 leading-relaxed">{profile.bio}</p>
              )}

              {/* Social links */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {profile.twitter_url && (
                  <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Twitter className="h-4 w-4" />
                  </a>
                )}
                {profile.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <Globe className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Action button */}
            <div className="shrink-0">
              {isSelf ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/founder/settings">Edit Profile</Link>
                </Button>
              ) : currentUser ? (
                <ConnectButton
                  targetUserId={userId}
                  targetName={profile.full_name}
                  initialStatus={connectionStatus}
                />
              ) : (
                <Button size="sm" asChild>
                  <Link href="/login">Sign in to Connect</Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investor details */}
      {investor && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Investment Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(investor.min_ticket_size || investor.max_ticket_size) && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Ticket Size</p>
                <p className="font-medium">
                  {investor.min_ticket_size ? formatCurrency(investor.min_ticket_size) : "—"}
                  {" – "}
                  {investor.max_ticket_size ? formatCurrency(investor.max_ticket_size) : "Open"}
                </p>
              </div>
            )}
            {investor.preferred_sectors && investor.preferred_sectors.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Focus Sectors</p>
                <div className="flex flex-wrap gap-1.5">
                  {investor.preferred_sectors.map((s: string) => (
                    <Badge key={s} variant="secondary">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {investor.preferred_stages && investor.preferred_stages.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Preferred Stages</p>
                <div className="flex flex-wrap gap-1.5">
                  {investor.preferred_stages.map((s: string) => (
                    <Badge key={s} variant="outline" className="capitalize">{s.replace(/_/g, " ")}</Badge>
                  ))}
                </div>
              </div>
            )}
            {investor.investment_thesis && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Investment Thesis</p>
                <p className="text-sm leading-relaxed">{investor.investment_thesis}</p>
              </div>
            )}
            {investor.portfolio_count != null && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{investor.portfolio_count} portfolio companies</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Founder's startup */}
      {startup && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Startup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold">{startup.name}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className="capitalize text-xs">{startup.stage?.replace(/_/g, " ")}</Badge>
                  <Badge variant="outline" className="text-xs">{startup.industry}</Badge>
                </div>
                {startup.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{startup.description}</p>
                )}
              </div>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/startups/${startup.id}`}>View Pitch</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
