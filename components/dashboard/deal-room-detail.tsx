"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatRelativeTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInitials } from "@/lib/utils";
import {
  CheckCircle, Clock, Plus, FileText, Activity,
  StickyNote, Target, Loader2, Circle
} from "lucide-react";

interface DealRoomDetailPageProps {
  dealRoom: Record<string, unknown>;
  currentUserId: string;
}

export function DealRoomDetailPage({ dealRoom, currentUserId }: DealRoomDetailPageProps) {
  const supabase = createClient();
  const router = useRouter();
  const [noteContent, setNoteContent] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: "", due_date: "" });
  const [addingMilestone, setAddingMilestone] = useState(false);

  const milestones = (dealRoom.deal_room_milestones as Array<Record<string, unknown>>) ?? [];
  const activities = (dealRoom.deal_room_activities as Array<Record<string, unknown>>) ?? [];
  const notes = (dealRoom.deal_room_notes as Array<Record<string, unknown>>) ?? [];
  const startup = dealRoom.startups as Record<string, unknown> | null;
  const investor = dealRoom.investors as Record<string, unknown> | null;

  async function handleAddNote() {
    if (!noteContent.trim()) return;
    setAddingNote(true);
    const { error } = await supabase.from("deal_room_notes").insert({
      deal_room_id: dealRoom.id as string,
      author_id: currentUserId,
      content: noteContent.trim(),
    });
    if (error) toast.error(error.message);
    else { toast.success("Note added"); setNoteContent(""); router.refresh(); }
    setAddingNote(false);
  }

  async function handleAddMilestone() {
    if (!newMilestone.title.trim()) return;
    setAddingMilestone(true);
    const { error } = await supabase.from("deal_room_milestones").insert({
      deal_room_id: dealRoom.id as string,
      title: newMilestone.title.trim(),
      due_date: newMilestone.due_date || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Milestone added"); setNewMilestone({ title: "", due_date: "" }); router.refresh(); }
    setAddingMilestone(false);
  }

  async function toggleMilestone(milestoneId: string, current: string) {
    const newStatus = current === "completed" ? "pending" : "completed";
    await supabase.from("deal_room_milestones").update({
      status: newStatus,
      completed_at: newStatus === "completed" ? new Date().toISOString() : null,
    }).eq("id", milestoneId);
    router.refresh();
  }

  const completedCount = milestones.filter(m => m.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{dealRoom.title as string}</h1>
          <p className="text-muted-foreground">
            {startup ? `${startup.name as string}` : ""} · {investor ? (investor.organization as string || "Investor") : ""}
          </p>
        </div>
        <Badge variant={dealRoom.status === "active" ? "default" : "secondary"}>
          {dealRoom.status as string}
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Milestones", value: `${completedCount}/${milestones.length}`, icon: Target },
          { label: "Activities", value: activities.length, icon: Activity },
          { label: "Notes", value: notes.length, icon: StickyNote },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="milestones">
        <TabsList>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Milestones */}
        <TabsContent value="milestones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Milestone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g. Due Diligence Complete"
                    value={newMilestone.title}
                    onChange={e => setNewMilestone(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Due Date (optional)</Label>
                  <Input
                    type="date"
                    value={newMilestone.due_date}
                    onChange={e => setNewMilestone(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleAddMilestone} disabled={addingMilestone || !newMilestone.title.trim()}>
                {addingMilestone ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Add Milestone
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {milestones.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No milestones yet. Add one above.</p>
            ) : milestones.map(m => (
              <Card key={m.id as string} className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => toggleMilestone(m.id as string, m.status as string)}>
                <CardContent className="flex items-center gap-3 py-3">
                  {m.status === "completed"
                    ? <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    : <Circle className="h-5 w-5 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${m.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                      {m.title as string}
                    </p>
                    {!!(m.due_date) && (
                      <p className="text-xs text-muted-foreground">Due: {new Date(m.due_date as string).toLocaleDateString()}</p>
                    )}
                  </div>
                  <Badge variant={m.status === "completed" ? "default" : "outline"} className="text-xs">
                    {m.status as string}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity">
          <Card>
            <CardContent className="pt-4">
              {activities.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No activity yet.</p>
              ) : (
                <div className="space-y-3">
                  {activities.map(act => {
                    const actor = act.users as Record<string, unknown> | null;
                    return (
                      <div key={act.id as string} className="flex items-start gap-3">
                        <Avatar className="h-7 w-7 mt-0.5">
                          <AvatarImage src={(actor?.avatar_url as string) ?? ""} />
                          <AvatarFallback className="text-xs">{getInitials((actor?.full_name as string) ?? "?")}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{(actor?.full_name as string) ?? "Someone"}</span>{" "}
                            {act.description as string}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatRelativeTime(act.created_at as string)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Add Note</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Add a note visible to all deal room participants..."
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddNote} disabled={addingNote || !noteContent.trim()}>
                {addingNote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Add Note
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No notes yet.</p>
            ) : notes.map(note => {
              const author = note.users as Record<string, unknown> | null;
              return (
                <Card key={note.id as string}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{getInitials((author?.full_name as string) ?? "?")}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{(author?.full_name as string) ?? "Unknown"}</span>
                      <span className="text-xs text-muted-foreground ml-auto">{formatRelativeTime(note.created_at as string)}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.content as string}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
