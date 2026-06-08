"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const startupSchema = z.object({
  name: z.string().min(2),
  slogan: z.string().optional(),
  description: z.string().min(50),
  stage: z.enum(["idea", "pre_seed", "seed", "series_a", "series_b", "series_c", "growth", "ipo_ready"]),
  industry: z.string().min(1),
  country: z.string().default("India"),
  city: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  dpiit_number: z.string().optional(),
  incorporation_date: z.string().optional(),
  registered_address: z.string().optional(),
});

export async function createStartup(formData: z.infer<typeof startupSchema>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const validated = startupSchema.parse(formData);

  const { data, error } = await supabase
    .from("startups")
    .insert({
      ...validated,
      founder_id: user.id,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Audit log
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "startup_created",
    entity_type: "startup",
    entity_id: data.id,
    new_data: validated,
  });

  revalidatePath("/dashboard/founder");
  return data;
}

export async function updateStartup(
  startupId: string,
  formData: Partial<z.infer<typeof startupSchema>>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: startup } = await supabase
    .from("startups")
    .select("founder_id")
    .eq("id", startupId)
    .single();

  if (startup?.founder_id !== user.id) throw new Error("Forbidden");

  const { error } = await supabase
    .from("startups")
    .update(formData)
    .eq("id", startupId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/founder/startup");
}
