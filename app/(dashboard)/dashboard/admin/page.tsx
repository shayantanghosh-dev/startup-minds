import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminOverview } from "@/components/dashboard/admin/overview";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["sub_admin", "super_admin"].includes(userProfile?.role ?? "")) {
    redirect("/dashboard/founder");
  }

  const [
    { count: totalUsers },
    { count: totalStartups },
    { count: pendingPitches },
    { count: pendingKYC },
    { count: pendingReports },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("startups").select("*", { count: "exact", head: true }),
    supabase.from("pitches").select("*", { count: "exact", head: true }).eq("status", "submitted"),
    supabase.from("kyc_documents").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const { data: recentPitches } = await supabase
    .from("pitches")
    .select("id, status, created_at, startups(name)")
    .in("status", ["submitted", "under_review"])
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <AdminOverview
      stats={{
        totalUsers: totalUsers ?? 0,
        totalStartups: totalStartups ?? 0,
        pendingPitches: pendingPitches ?? 0,
        pendingKYC: pendingKYC ?? 0,
        pendingReports: pendingReports ?? 0,
      }}
      recentPitches={recentPitches ?? []}
    />
  );
}
