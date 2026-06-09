"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, Video, Loader2, CheckCircle } from "lucide-react";

const EVENT_TYPE_LABELS: Record<string, string> = {
  demo_day: "Demo Day",
  networking: "Networking",
  workshop: "Workshop",
  webinar: "Webinar",
  pitch_competition: "Pitch Competition",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  demo_day: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  networking: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  workshop: "bg-green-500/10 text-green-700 dark:text-green-400",
  webinar: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  pitch_competition: "bg-red-500/10 text-red-700 dark:text-red-400",
};

interface EventsPageProps {
  events: Array<Record<string, unknown>>;
  myRegistrations: Array<Record<string, unknown>>;
  userId: string;
}

export function EventsPage({ events, myRegistrations, userId }: EventsPageProps) {
  const supabase = createClient();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const registeredEventIds = new Set(
    myRegistrations.map(r => (r.events as Record<string, unknown>)?.id as string ?? r.event_id as string)
  );

  async function register(eventId: string) {
    setLoadingId(eventId);
    const { error } = await supabase.from("event_registrations").insert({
      event_id: eventId,
      user_id: userId,
      registration_type: "attendee",
    });
    if (error) toast.error(error.message);
    else { toast.success("Registered successfully!"); router.refresh(); }
    setLoadingId(null);
  }

  async function cancelRegistration(eventId: string) {
    setLoadingId(eventId);
    const { error } = await supabase
      .from("event_registrations")
      .delete()
      .eq("event_id", eventId)
      .eq("user_id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Registration cancelled"); router.refresh(); }
    setLoadingId(null);
  }

  function EventCard({ event }: { event: Record<string, unknown> }) {
    const isRegistered = registeredEventIds.has(event.id as string);
    const isLoading = loadingId === event.id;
    const startDate = new Date(event.start_date as string);
    const isPast = startDate < new Date();

    return (
      /* flex flex-col makes the card a column so footer can be pushed to bottom */
      <Card className="hover:border-primary/30 transition-colors flex flex-col">
        {!!(event.banner_url) && (
          <div className="h-32 rounded-t-lg overflow-hidden shrink-0">
            <img
              src={event.banner_url as string}
              alt={event.title as string}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* ── Header: title + type badge ── */}
        <CardHeader className="pb-2 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">{event.title as string}</CardTitle>
            <Badge
              variant="outline"
              className={`text-xs shrink-0 ${EVENT_TYPE_COLORS[event.event_type as string] ?? ""}`}
            >
              {EVENT_TYPE_LABELS[event.event_type as string] ?? (event.event_type as string)}
            </Badge>
          </div>
        </CardHeader>

        {/* ── Body: flex-1 fills available card height ── */}
        <CardContent className="flex flex-col flex-1 gap-3">

          {/* Description — 2-line clamp with reserved minimum height */}
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
            {(event.description as string) ?? ""}
          </p>

          {/* Metadata rows — each row is always rendered at same height;
              optional items use consistent icon+text pattern */}
          <div className="space-y-1.5 text-sm">
            {/* Date — always present */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>
                {startDate.toLocaleDateString("en-GB", {
                  weekday: "short", day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            </div>

            {/* Location OR Virtual — mutually exclusive, always occupies one row */}
            {!!(event.location) ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{event.location as string}</span>
              </div>
            ) : !!(event.is_virtual) ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Video className="h-3.5 w-3.5 shrink-0" />
                <span>Virtual Event</span>
              </div>
            ) : (
              /* Placeholder row keeps height consistent */
              <div className="h-5" />
            )}

            {/* Max participants — always occupies one row */}
            {!!(event.max_participants) ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5 shrink-0" />
                <span>Up to {event.max_participants as number} participants</span>
              </div>
            ) : (
              <div className="h-5" />
            )}
          </div>

          {/* Spacer pushes CTA to card bottom */}
          <div className="flex-1" />

          {/* ── CTA — always at bottom of every card ── */}
          <div className="pt-1">
            {isPast ? (
              <Button variant="outline" size="sm" className="w-full" disabled>
                Event ended
              </Button>
            ) : isRegistered ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => cancelRegistration(event.id as string)}
                disabled={isLoading}
              >
                {isLoading
                  ? <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  : <CheckCircle className="mr-2 h-3 w-3 text-green-500" />
                }
                Registered
              </Button>
            ) : (
              <Button
                size="sm"
                className="w-full"
                onClick={() => register(event.id as string)}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                Register
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Events &amp; Demo Days</h1>
        <p className="text-muted-foreground">Discover events, workshops, and demo days</p>
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="registered">
            My Registrations ({myRegistrations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-4">
          {events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <Calendar className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No upcoming events scheduled</p>
              </CardContent>
            </Card>
          ) : (
            /* items-stretch makes all cards in a row the same height */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {events.map(event => (
                <EventCard key={event.id as string} event={event} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="registered" className="mt-4">
          {myRegistrations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <Calendar className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">You haven&apos;t registered for any events yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-stretch">
              {myRegistrations.map(reg => {
                const event = reg.events as Record<string, unknown>;
                if (!event) return null;
                return <EventCard key={reg.id as string} event={event} />;
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
