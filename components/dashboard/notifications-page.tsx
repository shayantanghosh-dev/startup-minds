"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Bell, CheckCheck, UserCheck, UserX, ArrowRight,
  MessageSquare, Users, Zap, Calendar, Briefcase,
  FileText, ShieldCheck, Star, Heart, Bookmark,
  AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

// ─── Icon map ────────────────────────────────────────────────────────────────
const TYPE_ICON: Record<string, React.ElementType> = {
  pitch_submitted:        FileText,
  pitch_status_changed:   FileText,
  review_feedback:        Star,
  pitch_approved:         CheckCircle2,
  pitch_rejected:         AlertTriangle,
  comment:                MessageSquare,
  like:                   Heart,
  bookmark:               Bookmark,
  connection_request:     Users,
  connection_accepted:    UserCheck,
  message:                MessageSquare,
  investor_interest:      Zap,
  ai_recommendation:      Zap,
  due_diligence_request:  Briefcase,
  kyc_approved:           ShieldCheck,
  kyc_rejected:           ShieldCheck,
  deal_room_invite:       Briefcase,
  event_reminder:         Calendar,
  milestone_achieved:     CheckCircle2,
  badge_earned:           Star,
  admin_announcement:     Bell,
  system:                 Bell,
};

const TYPE_ICON_COLOR: Record<string, string> = {
  pitch_approved:         "text-green-600 bg-green-100 dark:bg-green-900",
  pitch_rejected:         "text-red-600 bg-red-100 dark:bg-red-900",
  connection_request:     "text-amber-600 bg-amber-100 dark:bg-amber-900",
  connection_accepted:    "text-green-600 bg-green-100 dark:bg-green-900",
  message:                "text-blue-600 bg-blue-100 dark:bg-blue-900",
  investor_interest:      "text-purple-600 bg-purple-100 dark:bg-purple-900",
  ai_recommendation:      "text-purple-600 bg-purple-100 dark:bg-purple-900",
  kyc_approved:           "text-green-600 bg-green-100 dark:bg-green-900",
  kyc_rejected:           "text-red-600 bg-red-100 dark:bg-red-900",
  deal_room_invite:       "text-indigo-600 bg-indigo-100 dark:bg-indigo-900",
  event_reminder:         "text-sky-600 bg-sky-100 dark:bg-sky-900",
  review_feedback:        "text-amber-600 bg-amber-100 dark:bg-amber-900",
};

// ─── Contextual navigation ───────────────────────────────────────────────────
function getHref(type: string, role: string, relatedId?: string): string | null {
  const base = `/dashboard/${role.replace("_", "-")}`;
  switch (type) {
    case "connection_request":
    case "connection_accepted":
      return `${base}/connections`;
    case "message":
      return `${base}/messages`;
    case "investor_interest":
    case "ai_recommendation":
      return role === "founder" ? `${base}/investors` : `${base}/matches`;
    case "pitch_submitted":
    case "pitch_approved":
    case "pitch_rejected":
    case "pitch_status_changed":
    case "review_feedback":
    case "comment":
    case "like":
    case "bookmark":
      return role === "reviewer"
        ? `${base}/queue${relatedId ? `/${relatedId}` : ""}`
        : `${base}/pitch`;
    case "kyc_approved":
    case "kyc_rejected":
      return `${base}/kyc`;
    case "deal_room_invite":
    case "due_diligence_request":
    case "milestone_achieved":
      return relatedId ? `${base}/deal-rooms/${relatedId}` : `${base}/deal-rooms`;
    case "event_reminder":
      return `${base}/events`;
    default:
      return null;
  }
}

interface Props {
  notifications: Record<string, unknown>[];
  userId: string;
  role: string;
}

export default function NotificationsPage({ notifications: initialNotifs, userId, role }: Props) {
  const [notifications, setNotifications] = useState(initialNotifs);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  // ─── Mark single as read ─────────────────────────────────────────────────
  async function markRead(id: string) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  // ─── Mark all as read ─────────────────────────────────────────────────────
  async function markAllRead() {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read");
  }

  // ─── Navigate on click ───────────────────────────────────────────────────
  async function handleClick(n: Record<string, unknown>) {
    if (!n.is_read) await markRead(n.id as string);
    const href = getHref(n.type as string, role, n.related_id as string | undefined);
    if (href) router.push(href);
  }

  // ─── Accept connection request ────────────────────────────────────────────
  async function acceptConnection(n: Record<string, unknown>, e: React.MouseEvent) {
    e.stopPropagation();
    const requestId = n.related_id as string | undefined;
    if (!requestId) { toast.error("Cannot find connection request"); return; }
    setAcceptingId(n.id as string);
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "accepted" })
      .eq("id", requestId);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Connection accepted!");
      await markRead(n.id as string);
      router.refresh();
    }
    setAcceptingId(null);
  }

  // ─── Decline connection request ───────────────────────────────────────────
  async function declineConnection(n: Record<string, unknown>, e: React.MouseEvent) {
    e.stopPropagation();
    const requestId = n.related_id as string | undefined;
    if (!requestId) { toast.error("Cannot find connection request"); return; }
    setDecliningId(n.id as string);
    const { error } = await supabase
      .from("connection_requests")
      .update({ status: "rejected" })
      .eq("id", requestId);
    if (error) { toast.error(error.message); }
    else {
      toast.success("Connection declined");
      await markRead(n.id as string);
      // Remove from list
      setNotifications(prev => prev.filter(x => x.id !== n.id));
    }
    setDecliningId(null);
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <Badge className="text-xs">{unreadCount}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="gap-1.5">
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {/* ── Empty state ── */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-muted mb-4">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              When you receive activity, it will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {notifications.map((n) => {
            const type = n.type as string;
            const isUnread = !n.is_read;
            const href = getHref(type, role, n.related_id as string | undefined);
            const isConnectionRequest = type === "connection_request";
            const isAccepting = acceptingId === (n.id as string);
            const isDeclining = decliningId === (n.id as string);

            const IconComponent = TYPE_ICON[type] ?? Bell;
            const iconColorClass = TYPE_ICON_COLOR[type] ?? "text-muted-foreground bg-muted";

            return (
              <div
                key={n.id as string}
                role={href ? "button" : undefined}
                tabIndex={href ? 0 : undefined}
                onClick={() => handleClick(n)}
                onKeyDown={(e) => { if (e.key === "Enter" && href) handleClick(n); }}
                className={[
                  "group relative rounded-xl border transition-all",
                  isUnread
                    ? "bg-primary/[0.03] border-primary/20 dark:bg-primary/[0.06]"
                    : "bg-card border-border",
                  href
                    ? "cursor-pointer hover:border-primary/40 hover:shadow-sm hover:bg-muted/40"
                    : "cursor-default",
                ].join(" ")}
              >
                <div className="flex items-start gap-3 p-4">
                  {/* Icon */}
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${iconColorClass}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${isUnread ? "font-semibold" : "font-medium"}`}>
                      {n.title as string}
                    </p>
                    {!!(n.body) && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body as string}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {formatRelativeTime(n.created_at as string)}
                    </p>
                  </div>

                  {/* Right: unread dot + navigation hint */}
                  <div className="flex flex-col items-end gap-2 shrink-0 ml-1">
                    {isUnread && (
                      <div className="h-2 w-2 rounded-full bg-primary mt-1" />
                    )}
                    {href && !isConnectionRequest && (
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                </div>

                {/* ── Inline Accept / Decline for connection requests ── */}
                {isConnectionRequest && (
                  <div
                    className="flex gap-2 px-4 pb-4 -mt-1"
                    onClick={e => e.stopPropagation()}
                  >
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 h-8 text-xs"
                      onClick={(e) => acceptConnection(n, e)}
                      disabled={isAccepting || isDeclining}
                    >
                      {isAccepting
                        ? <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : <UserCheck className="h-3.5 w-3.5" />
                      }
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5 h-8 text-xs text-destructive hover:bg-destructive/10 hover:border-destructive/40"
                      onClick={(e) => declineConnection(n, e)}
                      disabled={isAccepting || isDeclining}
                    >
                      {isDeclining
                        ? <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        : <UserX className="h-3.5 w-3.5" />
                      }
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs px-2 text-muted-foreground"
                      asChild
                      onClick={e => e.stopPropagation()}
                    >
                      <a href={`/profile/${n.related_id as string ?? ""}`}>View profile</a>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
