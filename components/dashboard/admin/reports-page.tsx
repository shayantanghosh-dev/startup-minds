"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle, X } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-700",
  under_review: "bg-blue-500/10 text-blue-700",
  resolved: "bg-green-500/10 text-green-700",
  dismissed: "bg-gray-500/10 text-gray-700",
};

interface AdminReportsPageProps {
  reports: Array<Record<string, unknown>>;
  adminId: string;
}

export function AdminReportsPage({ reports: initialReports, adminId }: AdminReportsPageProps) {
  const supabase = createClient();
  const [reports, setReports] = useState(initialReports);
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);
  const [resolution, setResolution] = useState("");
  const [updating, setUpdating] = useState(false);

  const filtered = filter === "all" ? reports : reports.filter(r => r.status === filter);

  async function resolveReport(id: string, status: "resolved" | "dismissed") {
    setUpdating(true);
    const { error } = await supabase.from("reports").update({
      status, moderator_id: adminId, resolution, resolved_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Report ${status}`);
      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      setSelected(null);
      setResolution("");
    }
    setUpdating(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reports & Moderation</h1>
        <p className="text-muted-foreground">Review and resolve user reports</p>
      </div>

      <div className="flex gap-2">
        {["all", "pending", "under_review", "resolved", "dismissed"].map(s => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)} className="capitalize">
            {s === "all" ? `All (${reports.length})` : `${s.replace("_", " ")} (${reports.filter(r => r.status === s).length})`}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                <CheckCircle className="h-8 w-8" />
                <p>No {filter !== "all" ? filter.replace("_", " ") : ""} reports</p>
              </div>
            ) : filtered.map(report => {
              const reporter = report.users as Record<string, unknown> | null;
              return (
                <div key={report.id as string} className="flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelected(report)}>
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs capitalize">{report.category as string}</Badge>
                      <Badge variant="outline" className={`text-xs ${STATUS_COLORS[report.status as string] ?? ""}`}>
                        {(report.status as string).replace("_", " ")}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{report.entity_type as string}</span>
                    </div>
                    <p className="text-sm truncate">{report.description as string}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      by {(reporter?.full_name as string) ?? "Unknown"} · {formatRelativeTime(report.created_at as string)}
                    </p>
                  </div>
                  {report.status === "pending" && (
                    <Button size="sm" variant="outline" className="h-8 shrink-0">Review</Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => { setSelected(null); setResolution(""); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Report</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex gap-2"><span className="text-muted-foreground w-24">Category:</span><Badge variant="outline">{selected.category as string}</Badge></div>
                <div className="flex gap-2"><span className="text-muted-foreground w-24">Entity Type:</span><span className="capitalize">{selected.entity_type as string}</span></div>
                <div className="flex gap-2 items-start"><span className="text-muted-foreground w-24 shrink-0">Description:</span><span>{selected.description as string}</span></div>
              </div>
              <div className="space-y-1">
                <Label>Resolution Notes</Label>
                <Textarea value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Describe the action taken..." rows={3} />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => resolveReport(selected.id as string, "resolved")} disabled={updating}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Resolve
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => resolveReport(selected.id as string, "dismissed")} disabled={updating}>
                  <X className="mr-2 h-4 w-4" /> Dismiss
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
