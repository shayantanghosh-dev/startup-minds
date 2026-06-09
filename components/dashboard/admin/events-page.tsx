"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Users, Loader2, Video, MapPin, Edit } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-700",
  published: "bg-green-500/10 text-green-700",
  ongoing: "bg-blue-500/10 text-blue-700",
  completed: "bg-purple-500/10 text-purple-700",
  cancelled: "bg-red-500/10 text-red-700",
};

interface AdminEventsPageProps {
  events: Array<Record<string, unknown>>;
  adminId: string;
}

export function AdminEventsPage({ events, adminId }: AdminEventsPageProps) {
  const supabase = createClient();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", event_type: "demo_day", start_date: "", end_date: "",
    location: "", is_virtual: false, virtual_link: "", max_participants: "",
  });

  async function createEvent() {
    setCreating(true);
    const { error } = await supabase.from("events").insert({
      title: form.title, description: form.description, event_type: form.event_type,
      start_date: form.start_date, end_date: form.end_date,
      location: form.location || null, is_virtual: form.is_virtual,
      virtual_link: form.virtual_link || null,
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      organizer_id: adminId, status: "draft",
    });
    if (error) toast.error(error.message);
    else { toast.success("Event created"); setOpen(false); router.refresh(); }
    setCreating(false);
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("events").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); router.refresh(); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Events Management</h1>
          <p className="text-muted-foreground">Create and manage platform events</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button><Plus className="mr-2 h-4 w-4" /> Create Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create New Event</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Event title" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={form.event_type} onValueChange={(v: string | null) => { if (v) setForm(p => ({ ...p, event_type: v })); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo_day">Demo Day</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="pitch_competition">Pitch Competition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Max Participants</Label>
                  <Input type="number" value={form.max_participants} onChange={e => setForm(p => ({ ...p, max_participants: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Start Date</Label>
                  <Input type="datetime-local" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>End Date</Label>
                  <Input type="datetime-local" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Location (or virtual link)</Label>
                <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="City, Venue or Zoom/Meet link" />
              </div>
              <Button className="w-full" onClick={createEvent} disabled={creating || !form.title || !form.start_date}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Event
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {events.length === 0 ? (
          <Card className="col-span-2">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
              <Calendar className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No events created yet</p>
            </CardContent>
          </Card>
        ) : events.map(event => {
          const registrations = (event.event_registrations as Array<unknown>) ?? [];
          return (
            <Card key={event.id as string}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm">{event.title as string}</CardTitle>
                  <Badge variant="outline" className={`text-xs ${STATUS_COLORS[event.status as string] ?? ""}`}>
                    {event.status as string}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">{event.description as string}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(event.start_date as string).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {registrations.length} registered</span>
                  {!!(event.is_virtual) && <span className="flex items-center gap-1"><Video className="h-3 w-3" /> Virtual</span>}
                </div>
                <div className="flex gap-2">
                  {event.status === "draft" && (
                    <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => updateStatus(event.id as string, "published")}>
                      Publish
                    </Button>
                  )}
                  {event.status === "published" && (
                    <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => updateStatus(event.id as string, "ongoing")}>
                      Mark Ongoing
                    </Button>
                  )}
                  {event.status === "ongoing" && (
                    <Button size="sm" variant="outline" className="flex-1 h-8" onClick={() => updateStatus(event.id as string, "completed")}>
                      Complete
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
