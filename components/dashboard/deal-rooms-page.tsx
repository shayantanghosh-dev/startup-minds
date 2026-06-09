"use client";

import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, CheckCircle, Clock, ArrowRight, Plus } from "lucide-react";

interface DealRoom {
  id: string;
  title: string;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
  startups?: { id: string; name: string; logo_url?: string; industry?: string; stage?: string } | null;
  investors?: { id: string; organization?: string; users?: { full_name: string; avatar_url?: string } | null } | null;
  deal_room_milestones?: Array<{ id: string; status: string }>;
  deal_room_activities?: Array<{ id: string; created_at: string }>;
}

interface DealRoomsPageProps {
  dealRooms: DealRoom[];
  role: "founder" | "investor";
  userId: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-700 dark:text-green-400",
  completed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  cancelled: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function DealRoomsPage({ dealRooms, role }: DealRoomsPageProps) {
  const basePath = `/dashboard/${role}/deal-rooms`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Deal Rooms</h1>
          <p className="text-muted-foreground">
            Collaborate with {role === "founder" ? "investors" : "founders"} on active deals
          </p>
        </div>
        {role === "investor" && (
          <Button asChild>
            <Link href={`${basePath}/new`}>
              <Plus className="mr-2 h-4 w-4" /> New Deal Room
            </Link>
          </Button>
        )}
      </div>

      {dealRooms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg mb-1">No Deal Rooms Yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {role === "founder"
                  ? "When investors open deal rooms with you, they'll appear here."
                  : "Create a deal room with a startup to start collaborating."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dealRooms.map((room) => {
            const totalMilestones = room.deal_room_milestones?.length ?? 0;
            const completedMilestones = room.deal_room_milestones?.filter(m => m.status === "completed").length ?? 0;
            const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

            const counterpartName = role === "founder"
              ? (room.investors?.organization || room.investors?.users?.full_name || "Investor")
              : (room.startups?.name || "Startup");

            return (
              <Card
                key={room.id}
                className="hover:border-primary/50 transition-colors flex flex-col"
              >
                {/* ── Header: title + status badge ── */}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{room.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{counterpartName}</p>
                    </div>
                    <Badge className={STATUS_COLORS[room.status] ?? ""} variant="outline">
                      {room.status}
                    </Badge>
                  </div>
                </CardHeader>

                {/* ── Body: flex-1 so it fills available space ── */}
                <CardContent className="flex flex-col flex-1 gap-3">

                  {/* Description — fixed 2-line height regardless of content */}
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {room.description ?? ""}
                  </p>

                  {/* Milestones — fixed height slot: always occupies space,
                      progress bar shown only when milestones exist */}
                  <div className="h-[2.25rem]">
                    {totalMilestones > 0 ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> Milestones
                          </span>
                          <span>{completedMilestones}/{totalMilestones}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Spacer pushes footer to the bottom */}
                  <div className="flex-1" />

                  {/* ── Footer: always at the bottom of every card ── */}
                  <div className="flex items-center justify-between pt-1 border-t">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(room.updated_at)}
                    </span>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`${basePath}/${room.id}`}>
                        Open <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
