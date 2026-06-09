"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserCheck, UserX, Clock, CheckCircle, MessageSquare, Loader2, Users, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ConnectionRequest {
  id: string;
  status: string;
  message: string | null;
  created_at: string;
  sender: { id: string; full_name: string; avatar_url: string | null; role: string };
  receiver: { id: string; full_name: string; avatar_url: string | null; role: string };
}

interface ConnectionsPageProps {
  connections: ConnectionRequest[];
  currentUserId: string;
}

const ROLE_LABELS: Record<string, string> = {
  founder: "Founder",
  investor: "Investor",
  reviewer: "Reviewer",
  sub_admin: "Admin",
  super_admin: "Super Admin",
};

export function ConnectionsPage({ connections: initial, currentUserId }: ConnectionsPageProps) {
  const [connections, setConnections] = useState(initial);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const router = useRouter();

  const pending  = connections.filter(c => c.status === "pending"  && c.receiver.id === currentUserId);
  const sent     = connections.filter(c => c.status === "pending"  && c.sender.id   === currentUserId);
  const accepted = connections.filter(c => c.status === "accepted");

  async function handleAction(requestId: string, action: "accept" | "reject") {
    setLoading(l => ({ ...l, [requestId]: true }));
    try {
      const res = await fetch("/api/connections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConnections(prev =>
        prev.map(c => c.id === requestId ? { ...c, status: data.status } : c)
      );
      toast.success(action === "accept" ? "Connection accepted!" : "Request declined");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(l => ({ ...l, [requestId]: false }));
    }
  }

  async function startConversation(otherUserId: string) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ other_user_id: otherUserId }),
    });
    const data = await res.json();
    if (data.conversation_id) {
      router.push(`/dashboard/${getDashboardSegment()}/messages`);
    }
  }

  function getDashboardSegment() {
    if (typeof window === "undefined") return "founder";
    const path = window.location.pathname;
    if (path.includes("/investor")) return "investor";
    if (path.includes("/reviewer")) return "reviewer";
    if (path.includes("/admin")) return "admin";
    if (path.includes("/super-admin")) return "super-admin";
    return "founder";
  }

  function ConnectionCard({ conn }: { conn: ConnectionRequest }) {
    const other = conn.sender.id === currentUserId ? conn.receiver : conn.sender;
    const isPending = conn.status === "pending" && conn.receiver.id === currentUserId;
    const isAccepted = conn.status === "accepted";
    const isSent = conn.status === "pending" && conn.sender.id === currentUserId;

    return (
      <Card key={conn.id}>
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarImage src={other.avatar_url ?? ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {getInitials(other.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{other.full_name}</p>
                <Badge variant="secondary" className="text-xs">
                  {ROLE_LABELS[other.role] ?? other.role}
                </Badge>
                {isAccepted && (
                  <Badge variant="default" className="text-xs bg-green-500">
                    <CheckCircle className="h-2.5 w-2.5 mr-1" /> Connected
                  </Badge>
                )}
                {isSent && (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-2.5 w-2.5 mr-1" /> Pending
                  </Badge>
                )}
              </div>
              {conn.message && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  &ldquo;{conn.message}&rdquo;
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatRelativeTime(conn.created_at)}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {isPending && (
                <>
                  <Button
                    size="sm"
                    className="h-8 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleAction(conn.id, "accept")}
                    disabled={loading[conn.id]}
                  >
                    {loading[conn.id] ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3.5 w-3.5 mr-1" />}
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleAction(conn.id, "reject")}
                    disabled={loading[conn.id]}
                  >
                    <UserX className="h-3.5 w-3.5 mr-1" /> Decline
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" className="h-8" asChild>
                <Link href={`/profile/${other.id}`}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Profile
                </Link>
              </Button>
              {isAccepted && (
                <Button size="sm" variant="outline" className="h-8" onClick={() => startConversation(other.id)}>
                  <MessageSquare className="h-3.5 w-3.5 mr-1" /> Message
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connections</h1>
        <p className="text-muted-foreground">Manage your network and connection requests</p>
      </div>

      <Tabs defaultValue={pending.length > 0 ? "requests" : "connections"}>
        <TabsList>
          <TabsTrigger value="requests" className="relative">
            Requests
            {pending.length > 0 && (
              <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="connections">
            Connected ({accepted.length})
          </TabsTrigger>
          <TabsTrigger value="sent">Sent ({sent.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4 space-y-3">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <Users className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">No pending connection requests</p>
              </CardContent>
            </Card>
          ) : (
            pending.map(conn => <ConnectionCard key={conn.id} conn={conn} />)
          )}
        </TabsContent>

        <TabsContent value="connections" className="mt-4 space-y-3">
          {accepted.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <Users className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">No connections yet</p>
                <p className="text-xs text-muted-foreground">Discover startups or investors to connect</p>
              </CardContent>
            </Card>
          ) : (
            accepted.map(conn => <ConnectionCard key={conn.id} conn={conn} />)
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-4 space-y-3">
          {sent.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
                <Users className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">No sent requests</p>
              </CardContent>
            </Card>
          ) : (
            sent.map(conn => <ConnectionCard key={conn.id} conn={conn} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
