import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminEventsPage } from "@/components/dashboard/admin/events-page";

export const dynamic = "force-dynamic";

export default async function AdminEvents() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || !["sub_admin", "super_admin"].includes(profile.role)) redirect("/dashboard/founder");

  const { data: events } = await supabase
    .from("events")
    .select(`*, event_registrations(id, registration_type)`)
    .order("created_at", { ascending: false });

  return <AdminEventsPage events={events ?? []} adminId={user.id} />;
}
