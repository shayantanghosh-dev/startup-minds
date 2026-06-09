import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { EventsPage } from "@/components/dashboard/events-page";

export const dynamic = "force-dynamic";

export default async function FounderEventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: upcomingEvents }, { data: myRegistrations }] = await Promise.all([
    supabase.from("events")
      .select("*")
      .in("status", ["published", "ongoing"])
      .gte("start_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(20),
    supabase.from("event_registrations")
      .select("*, events(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return <EventsPage events={upcomingEvents ?? []} myRegistrations={myRegistrations ?? []} userId={user.id} />;
}
