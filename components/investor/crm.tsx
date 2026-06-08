"use client";

import { useState } from "react";
import { Briefcase, Search, Tag, Star, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { getInitials, formatRelativeTime } from "@/lib/utils";
import { toast } from "sonner";
import type { CRMStage } from "@/types";
import Link from "next/link";

const CRM_STAGES: { value: CRMStage; label: string; color: string }[] = [
  { value: "interested", label: "Interested", color: "bg-blue-100 text-blue-700" },
  { value: "contacted", label: "Contacted", color: "bg-purple-100 text-purple-700" },
  { value: "meeting_scheduled", label: "Meeting", color: "bg-yellow-100 text-yellow-700" },
  { value: "due_diligence", label: "Due Diligence", color: "bg-orange-100 text-orange-700" },
  { value: "negotiation", label: "Negotiation", color: "bg-indigo-100 text-indigo-700" },
  { value: "invested", label: "Invested", color: "bg-green-100 text-green-700" },
  { value: "passed", label: "Passed", color: "bg-gray-100 text-gray-700" },
  { value: "closed", label: "Closed", color: "bg-red-100 text-red-700" },
];

interface InvestorCRMProps {
  records: Array<Record<string, unknown>>;
  investorId: string;
}

export function InvestorCRM({ records, investorId }: InvestorCRMProps) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [localRecords, setLocalRecords] = useState(records);
  const supabase = createClient();

  const filtered = localRecords.filter((r) => {
    const startup = r.startups as Record<string, string>;
    const matchSearch = !search || startup?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === "all" || r.stage === stageFilter;
    return matchSearch && matchStage;
  });

  async function updateStage(recordId: string, stage: CRMStage) {
    await supabase.from("crm_records").update({ stage }).eq("id", recordId);
    setLocalRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, stage } : r))
    );
    toast.success("Pipeline stage updated");
  }

  const stageCounts = CRM_STAGES.map((s) => ({
    ...s,
    count: localRecords.filter((r) => r.stage === s.value).length,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Investment Pipeline</h1>
          <p className="text-muted-foreground">{localRecords.length} companies tracked</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/investor/discover">Add Startups</Link>
        </Button>
      </div>

      {/* Stage summary */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {stageCounts.map((stage) => (
          <button
            key={stage.value}
            onClick={() => setStageFilter(stageFilter === stage.value ? "all" : stage.value)}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              stageFilter === stage.value ? stage.color : "bg-muted text-muted-foreground"
            }`}
          >
            {stage.label}
            {stage.count > 0 && (
              <span className="bg-white/60 rounded-full px-1.5 text-xs">{stage.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Records */}
      <div className="space-y-3">
        {filtered.map((record) => {
          const startup = record.startups as Record<string, string | number>;
          const stageConfig = CRM_STAGES.find((s) => s.value === record.stage);

          return (
            <Card key={record.id as string} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-11 w-11 rounded-lg">
                    <AvatarImage src={startup?.logo_url as string} alt={startup?.name as string} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-sm">
                      {getInitials((startup?.name as string) ?? "?")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{startup?.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">
                          {(startup?.stage as string)?.replace("_", " ")} • {startup?.industry}
                        </p>
                      </div>
                      <Select
                        value={record.stage as string}
                        onValueChange={(v) => updateStage(record.id as string, v as CRMStage)}
                      >
                        <SelectTrigger className={`w-36 h-7 text-xs ${stageConfig?.color}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CRM_STAGES.map((s) => (
                            <SelectItem key={s.value} value={s.value} className="text-xs">
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-3 mt-2">
                      {(record.rating as number) > 0 && (
                        <div className="flex items-center gap-1">
                          {Array.from({ length: record.rating as number }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      )}

                      {(record.tags as string[])?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs h-5">
                          <Tag className="h-2.5 w-2.5 mr-1" />{tag}
                        </Badge>
                      ))}

                      {(record.next_follow_up as string) && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatRelativeTime(record.next_follow_up as string)}
                        </span>
                      )}
                    </div>

                    {(record.notes as string) && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{record.notes as string}</p>
                    )}
                  </div>

                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/startups/${startup?.id}`}>
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-medium">No companies in pipeline</p>
            <p className="text-muted-foreground mb-4">Discover startups to add them to your CRM</p>
            <Button asChild>
              <Link href="/dashboard/investor/discover">Discover Startups</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
