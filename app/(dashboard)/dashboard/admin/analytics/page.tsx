import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminAnalyticsPage } from "@/components/dashboard/admin/analytics-page";

export const dynamic = "force-dynamic";

export default async function AdminAnalytics() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || !["sub_admin", "super_admin"].includes(profile.role)) redirect("/dashboard/founder");

  const [
    { count: totalUsers },
    { count: totalStartups },
    { count: totalPitches },
    { count: publishedPitches },
    { count: totalInvestors },
    { count: totalEvents },
    { data: recentEvents },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("startups").select("*", { count: "exact", head: true }),
    supabase.from("pitches").select("*", { count: "exact", head: true }),
    supabase.from("pitches").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("investors").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("analytics_events").select("event_name, created_at").order("created_at", { ascending: false }).limit(100),
  ]);

  return (
    <AdminAnalyticsPage
      stats={{ totalUsers: totalUsers ?? 0, totalStartups: totalStartups ?? 0, totalPitches: totalPitches ?? 0, publishedPitches: publishedPitches ?? 0, totalInvestors: totalInvestors ?? 0, totalEvents: totalEvents ?? 0 }}
      recentEvents={recentEvents ?? []}
    />
  );
}
