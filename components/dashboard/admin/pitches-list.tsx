"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Search, Eye, Filter } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "secondary",
  submitted: "default",
  assigned: "default",
  under_review: "default",
  changes_requested: "secondary",
  resubmitted: "default",
  approved: "default",
  rejected: "destructive",
  published: "default",
  archived: "secondary",
};

const STATUSES = [
  "all",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
  "published",
];

interface Props {
  pitches: Record<string, unknown>[];
}

export default function AdminPitchesList({ pitches }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = pitches.filter((p) => {
    const startup = p.startup as Record<string, unknown>;
    const name = (startup?.name as string ?? "").toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pitch Management</h1>
        <p className="text-muted-foreground">Review and manage all submitted pitches</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search startups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Startup</th>
                  <th className="text-left px-4 py-3 font-medium">Stage</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Reviews</th>
                  <th className="text-left px-4 py-3 font-medium">Avg Score</th>
                  <th className="text-left px-4 py-3 font-medium">Submitted</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      No pitches found
                    </td>
                  </tr>
                ) : (
                  filtered.map((pitch) => {
                    const startup = pitch.startup as Record<string, unknown>;
                    const reviews = (pitch.reviews as Record<string, unknown>[]) ?? [];
                    const avgScore =
                      reviews.length > 0
                        ? reviews.reduce((sum, r) => sum + ((r.overall_score as number) ?? 0), 0) /
                          reviews.length
                        : null;

                    return (
                      <tr key={pitch.id as string} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium">{startup?.name as string}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {(startup?.industry as string ?? "").replace(/_/g, " ")}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize text-xs">{(pitch.stage as string ?? "").replace(/_/g, " ")}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={(STATUS_COLORS[pitch.status as string] ?? "secondary") as "default" | "secondary" | "destructive"}
                            className="capitalize text-xs"
                          >
                            {(pitch.status as string ?? "").replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {reviews.length}
                        </td>
                        <td className="px-4 py-3">
                          {avgScore !== null ? (
                            <span className="font-semibold">{avgScore.toFixed(1)}/10</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {pitch.submitted_at
                            ? formatDate(pitch.submitted_at as string)
                            : "Not submitted"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/dashboard/admin/pitches/${pitch.id as string}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
