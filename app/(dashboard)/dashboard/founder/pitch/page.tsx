import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PitchManagement } from "@/components/dashboard/founder/pitch-management";

export default async function PitchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: startup } = await supabase
    .from("startups")
    .select("id, name")
    .eq("founder_id", user.id)
    .single();

  if (!startup) redirect("/dashboard/founder/startup");

  const { data: pitch } = await supabase
    .from("pitches")
    .select("*")
    .eq("startup_id", startup.id)
    .order("version", { ascending: false })
    .limit(1)
    .single();

  const { data: versions } = await supabase
    .from("pitch_versions")
    .select("id, version, change_summary, created_at")
    .eq("startup_id", startup.id)
    .order("version", { ascending: false });

  return (
    <PitchManagement
      startup={startup}
      pitch={pitch}
      versions={versions ?? []}
    />
  );
}
