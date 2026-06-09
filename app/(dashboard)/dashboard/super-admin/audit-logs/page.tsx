import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SuperAdminAuditLogsPage } from "@/components/dashboard/super-admin/audit-logs-page";

export const dynamic = "force-dynamic";

export default async function SuperAdminAuditLogs() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (profile?.role !== "super_admin") redirect("/dashboard/admin");

  const { data: logs } = await supabase
    .from("audit_logs")
    .select(`*, users!actor_id(full_name, email)`)
    .order("created_at", { ascending: false })
    .limit(100);

  return <SuperAdminAuditLogsPage logs={logs ?? []} />;
}
