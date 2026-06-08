import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SuperAdminOverview } from "@/components/dashboard/admin/super-admin-overview";

export default async function SuperAdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "super_admin") redirect("/dashboard/admin");

  const [
    { count: totalUsers },
    { count: totalStartups },
    { count: totalInvestors },
    { count: publishedPitches },
    { count: pendingKYC },
    { data: recentAuditLogs },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("startups").select("*", { count: "exact", head: true }),
    supabase.from("investors").select("*", { count: "exact", head: true }),
    supabase.from("pitches").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("kyc_documents").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("audit_logs")
      .select("*, users(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return (
    <SuperAdminOverview
      stats={{
        totalUsers: totalUsers ?? 0,
        totalStartups: totalStartups ?? 0,
        totalInvestors: totalInvestors ?? 0,
        publishedPitches: publishedPitches ?? 0,
        pendingKYC: pendingKYC ?? 0,
      }}
      recentAuditLogs={recentAuditLogs ?? []}
    />
  );
}
