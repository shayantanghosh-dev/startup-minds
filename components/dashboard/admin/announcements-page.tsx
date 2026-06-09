"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Megaphone, Send, Clock, Users, Loader2 } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  body: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface AdminAnnouncementsPageProps {
  recentAnnouncements: Announcement[];
}

const AUDIENCE_OPTIONS = [
  { value: "all", label: "Everyone" },
  { value: "founders", label: "Founders only" },
  { value: "investors", label: "Investors only" },
  { value: "reviewers", label: "Reviewers only" },
];

export function AdminAnnouncementsPage({ recentAnnouncements }: AdminAnnouncementsPageProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [ctaUrl, setCtaUrl] = useState("");
  const [sendEmail, setSendEmail] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<Announcement[]>(recentAnnouncements);

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, audience, send_email: sendEmail, cta_url: ctaUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Failed to send"); return; }
      toast.success(`Announcement sent to ${data.recipients ?? "users"} recipients`);
      // Prepend to history
      setHistory(prev => [{
        id: crypto.randomUUID(),
        title,
        body,
        created_at: new Date().toISOString(),
        metadata: { audience, send_email: sendEmail },
      }, ...prev].slice(0, 20));
      setTitle(""); setBody(""); setCtaUrl(""); setSendEmail(false); setAudience("all");
    } catch {
      toast.error("Failed to send announcement");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Megaphone className="h-6 w-6" /> Announcements
        </h1>
        <p className="text-muted-foreground">Send platform-wide announcements to users</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Announcement</CardTitle>
          <CardDescription>This will create an in-app notification for all targeted users.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ann-title">Title</Label>
            <Input
              id="ann-title"
              placeholder="e.g. New feature: Deal Rooms upgraded"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ann-body">Message</Label>
            <Textarea
              id="ann-body"
              placeholder="Write your announcement here..."
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{body.length}/2000</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v: string | null) => { if (v) setAudience(v); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cta-url">CTA Link (optional)</Label>
              <Input
                id="cta-url"
                placeholder="https://..."
                value={ctaUrl}
                onChange={e => setCtaUrl(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Also send email</p>
              <p className="text-xs text-muted-foreground">Requires Resend to be configured</p>
            </div>
            <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
          </div>

          <Button onClick={handleSend} disabled={sending} className="w-full">
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            {sending ? "Sending..." : "Send Announcement"}
          </Button>
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {history.map(ann => (
                <div key={ann.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{ann.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{ann.body}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!!ann.metadata?.audience && (
                        <Badge variant="secondary" className="text-xs capitalize">
                          <Users className="h-2.5 w-2.5 mr-1" />
                          {String(ann.metadata!.audience)}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(ann.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
