import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// GET /api/cron/event-reminders
// Called by Vercel Cron (see vercel.json) — runs daily at 08:00 UTC
// Sends reminders for events starting in 24h and 1h
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent public invocation
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = await createAdminClient();
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
  const in1h  = new Date(now.getTime() +      60 * 60 * 1000);
  const in2h  = new Date(now.getTime() +  2 * 60 * 60 * 1000);

  // Fetch events starting in the next windows
  const { data: events24h } = await adminSupabase
    .from("events")
    .select("id, title, start_date, location, is_virtual, virtual_link, organizer_id")
    .gte("start_date", in24h.toISOString())
    .lte("start_date", in25h.toISOString())
    .eq("status", "published");

  const { data: events1h } = await adminSupabase
    .from("events")
    .select("id, title, start_date, location, is_virtual, virtual_link, organizer_id")
    .gte("start_date", in1h.toISOString())
    .lte("start_date", in2h.toISOString())
    .eq("status", "published");

  const allEvents = [
    ...(events24h ?? []).map(e => ({ ...e, window: "24h" })),
    ...(events1h  ?? []).map(e => ({ ...e, window: "1h"  })),
  ];

  let notifCount = 0;
  let emailCount = 0;
  const resend = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith("re_placeholder")
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

  for (const event of allEvents) {
    // Fetch registrants for this event
    const { data: registrations } = await adminSupabase
      .from("event_registrations")
      .select("user_id, users(full_name, email)")
      .eq("event_id", event.id)
      .eq("status", "confirmed");

    if (!registrations) continue;

    for (const reg of registrations) {
      const usersField = reg.users as unknown;
      const u = (Array.isArray(usersField) ? usersField[0] : usersField) as { full_name: string; email: string } | null;
      if (!u) continue;

      const timeLabel = event.window === "24h" ? "tomorrow" : "in 1 hour";
      const locationStr = event.is_virtual
        ? `Virtual — ${event.virtual_link ?? "Link will be shared"}`
        : (event.location as string ?? "Check event page");

      // In-app notification
      const { error: notifError } = await adminSupabase.from("notifications").insert({
        user_id: reg.user_id,
        type: "event_reminder",
        title: `Reminder: ${event.title} starts ${timeLabel}`,
        body: `Your event "${event.title}" starts ${timeLabel}. Location: ${locationStr}`,
        data: {
          event_id: event.id,
          window: event.window,
          start_date: event.start_date,
        },
      });
      if (!notifError) notifCount++;

      // Email reminder
      if (resend) {
        await resend.emails.send({
          from: `StartupMinds <${process.env.RESEND_FROM_EMAIL ?? "noreply@startupminds.in"}>`,
          to: u.email,
          subject: `⏰ Reminder: ${event.title} starts ${timeLabel}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#6366f1">Event Reminder</h2>
              <h3>${event.title}</h3>
              <p style="color:#374151">
                This event starts <strong>${timeLabel}</strong>.
              </p>
              <table style="width:100%;border-collapse:collapse;margin:16px 0">
                <tr><td style="padding:8px;color:#6b7280;font-size:14px">📅 When:</td>
                    <td style="padding:8px;font-size:14px">${new Date(event.start_date as string).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td></tr>
                <tr><td style="padding:8px;color:#6b7280;font-size:14px">📍 Where:</td>
                    <td style="padding:8px;font-size:14px">${locationStr}</td></tr>
              </table>
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "https://startupminds.in"}/dashboard/events"
                 style="display:inline-block;padding:10px 20px;background:#6366f1;color:white;border-radius:6px;text-decoration:none">
                View Event
              </a>
            </div>
          `,
        }).then(() => emailCount++).catch(() => {});
      }
    }
  }

  return NextResponse.json({
    success: true,
    events_processed: allEvents.length,
    notifications_sent: notifCount,
    emails_sent: emailCount,
    timestamp: now.toISOString(),
  });
}
