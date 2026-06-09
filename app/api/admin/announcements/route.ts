import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// POST /api/admin/announcements — create a platform announcement
// Fans out in-app notifications + optional email to targeted audience
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || !["sub_admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const {
    title,
    body,
    audience = "all",        // "all" | "founders" | "investors" | "reviewers"
    send_email = false,
    cta_url,
  }: {
    title: string;
    body: string;
    audience?: string;
    send_email?: boolean;
    cta_url?: string;
  } = await req.json();

  if (!title || !body) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 });
  }

  // Fetch target users
  let usersQuery = adminSupabase.from("users").select("id, email, full_name, role").eq("is_active", true);

  if (audience !== "all") {
    const roleMap: Record<string, string> = {
      founders: "founder",
      investors: "investor",
      reviewers: "reviewer",
    };
    const targetRole = roleMap[audience];
    if (targetRole) usersQuery = usersQuery.eq("role", targetRole);
  }

  const { data: targetUsers } = await usersQuery;
  if (!targetUsers || targetUsers.length === 0) {
    return NextResponse.json({ error: "No users found for audience" }, { status: 404 });
  }

  // Batch insert in-app notifications (chunks of 200)
  const notifications = targetUsers.map(u => ({
    user_id: u.id,
    type: "admin_announcement" as const,
    title,
    body,
    data: {
      audience,
      sent_by: user.id,
      ...(cta_url ? { cta_url } : {}),
    },
    is_read: false,
  }));

  const CHUNK = 200;
  let inserted = 0;
  for (let i = 0; i < notifications.length; i += CHUNK) {
    const { error } = await adminSupabase
      .from("notifications")
      .insert(notifications.slice(i, i + CHUNK));
    if (!error) inserted += Math.min(CHUNK, notifications.length - i);
  }

  // Optional email delivery
  let emailsSent = 0;
  if (send_email && process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_placeholder")) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@startupminds.in";

    // Send in batches of 50 (Resend rate limit)
    for (let i = 0; i < targetUsers.length; i += 50) {
      const batch = targetUsers.slice(i, i + 50);
      await Promise.allSettled(
        batch.map(u =>
          resend.emails.send({
            from: `StartupMinds <${fromEmail}>`,
            to: u.email,
            subject: `[StartupMinds] ${title}`,
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
                <h2 style="color:#6366f1">${title}</h2>
                <p style="color:#374151;line-height:1.6">${body}</p>
                ${cta_url ? `<a href="${cta_url}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#6366f1;color:white;border-radius:6px;text-decoration:none">View Now</a>` : ""}
                <hr style="margin:24px 0;border-color:#e5e7eb"/>
                <p style="font-size:12px;color:#9ca3af">
                  You received this because you are a member of StartupMinds.
                  <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://startupminds.in"}/dashboard/${u.role}/settings">Manage notifications</a>
                </p>
              </div>
            `,
          })
        )
      );
      emailsSent += batch.length;
    }
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: "admin_announcement_sent",
    entity_type: "platform",
    entity_id: null,
    new_data: { title, audience, recipients: inserted, emails_sent: emailsSent },
  });

  return NextResponse.json({
    success: true,
    notifications_sent: inserted,
    emails_sent: emailsSent,
    audience,
  });
}
