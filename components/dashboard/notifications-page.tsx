"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

const TYPE_ICONS: Record<string, string> = {
  pitch_submitted: "📄",
  review_feedback: "💬",
  pitch_approved: "✅",
  pitch_rejected: "❌",
  comment: "💬",
  like: "❤️",
  bookmark: "🔖",
  connection_request: "🤝",
  connection_accepted: "✅",
  message: "✉️",
  investor_interest: "💰",
  due_diligence_request: "🔍",
  kyc_approved: "✅",
  kyc_rejected: "❌",
  deal_room_invite: "🏢",
  event_reminder: "📅",
  milestone_achieved: "🏆",
  badge_earned: "🎖️",
  report_resolved: "✅",
  system: "🔔",
};

interface Props {
  notifications: Record<string, unknown>[];
  userId: string;
}

export default function NotificationsPage({ notifications: initialNotifs, userId }: Props) {
  const [notifications, setNotifications] = useState(initialNotifs);
  const supabase = createClient();

  async function markAllRead() {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read");
  }

  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge className="text-xs">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">Stay up to date with your activity</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No notifications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1">
          {notifications.map((n) => (
            <button
              key={n.id as string}
              onClick={() => !n.is_read && markRead(n.id as string)}
              className={`w-full text-left rounded-xl border p-4 transition-colors hover:bg-muted/50 ${
                !n.is_read ? "bg-primary/3 border-primary/20" : "bg-card"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">
                  {TYPE_ICONS[n.type as string] ?? "🔔"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? "font-medium" : ""}`}>
                    {n.title as string}
                  </p>
                  {!!(n.body) && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {n.body as string}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(n.created_at as string)}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
