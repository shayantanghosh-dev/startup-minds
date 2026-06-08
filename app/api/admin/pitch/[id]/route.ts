import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { sendPitchStatusEmail } from "@/lib/email/resend";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!["sub_admin", "super_admin", "reviewer"].includes(adminUser?.role ?? "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes, changes_requested, rejection_reason } = body;

    const adminSupabase = await createAdminClient();

    // Get pitch with startup founder info
    const { data: pitch } = await adminSupabase
      .from("pitches")
      .select("*, startups(name, users(email, full_name))")
      .eq("id", id)
      .single();

    if (!pitch) return NextResponse.json({ error: "Pitch not found" }, { status: 404 });

    const oldStatus = pitch.status;

    // Update pitch
    await adminSupabase
      .from("pitches")
      .update({
        status,
        admin_notes: notes,
        changes_requested,
        rejection_reason,
        ...(status === "approved" && { reviewer_id: user.id }),
      })
      .eq("id", id);

    // Log status change
    await adminSupabase.from("pitch_status_logs").insert({
      pitch_id: id,
      from_status: oldStatus,
      to_status: status,
      changed_by: user.id,
      notes,
    });

    // Create notification for founder
    const startup = pitch.startups as Record<string, unknown>;
    const founderUser = startup?.users as Record<string, string>;

    if (founderUser) {
      await adminSupabase.from("notifications").insert({
        user_id: (await adminSupabase
          .from("startups")
          .select("founder_id")
          .eq("id", pitch.startup_id)
          .single()
        ).data?.founder_id,
        type: "pitch_status_changed",
        title: `Pitch status updated: ${status.replace("_", " ")}`,
        body: notes ?? `Your pitch for ${(startup as Record<string, string>).name} has been ${status}.`,
        data: { pitch_id: id, status },
      });

      // Send email
      await sendPitchStatusEmail(
        founderUser.email,
        founderUser.full_name,
        (startup as Record<string, string>).name,
        status,
        notes
      );
    }

    // Audit log
    await adminSupabase.from("audit_logs").insert({
      actor_id: user.id,
      action: `pitch_status_changed_to_${status}`,
      entity_type: "pitch",
      entity_id: id,
      old_data: { status: oldStatus },
      new_data: { status, notes },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pitch update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
