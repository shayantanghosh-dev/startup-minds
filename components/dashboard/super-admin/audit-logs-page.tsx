"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { Database, Search } from "lucide-react";

interface SuperAdminAuditLogsPageProps {
  logs: Array<Record<string, unknown>>;
}

const ACTION_COLORS: Record<string, string> = {
  user_registered: "bg-green-500/10 text-green-700",
  user_updated: "bg-blue-500/10 text-blue-700",
  pitch_submitted: "bg-purple-500/10 text-purple-700",
  pitch_approved: "bg-green-500/10 text-green-700",
  pitch_rejected: "bg-red-500/10 text-red-700",
  startup_created: "bg-blue-500/10 text-blue-700",
  investor_verified: "bg-yellow-500/10 text-yellow-700",
};

export function SuperAdminAuditLogsPage({ logs }: SuperAdminAuditLogsPageProps) {
  const [search, setSearch] = useState("");

  const filtered = logs.filter(log => {
    const q = search.toLowerCase();
    if (!q) return true;
    const user = log.users as Record<string, unknown> | null;
    const name = (user?.full_name as string ?? "").toLowerCase();
    const action = (log.action as string ?? "").toLowerCase();
    const entity = (log.entity_type as string ?? "").toLowerCase();
    return name.includes(q) || action.includes(q) || entity.includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">Complete audit trail of platform activity</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                <Database className="h-5 w-5" /> No audit logs found
              </div>
            ) : filtered.map(log => {
              const user = log.users as Record<string, unknown> | null;
              return (
                <div key={log.id as string} className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors">
                  <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                    <AvatarFallback className="text-xs">{getInitials((user?.full_name as string) ?? "?")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{(user?.full_name as string) ?? "System"}</span>
                      <Badge variant="outline" className={`text-xs ${ACTION_COLORS[log.action as string] ?? "bg-gray-500/10 text-gray-700"}`}>
                        {(log.action as string).replace(/_/g, " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{log.entity_type as string}</span>
                    </div>
                    {!!(log.entity_id) && (
                      <p className="text-xs text-muted-foreground mt-0.5">Entity: {log.entity_id as string}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(log.created_at as string)}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
