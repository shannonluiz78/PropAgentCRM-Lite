"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddEventForm } from "@/components/dashboard/add-event-form";
import { Plus, Calendar as CalendarIcon, MapPin } from "lucide-react";

type Event = {
  id: string;
  title: string;
  event_type: string;
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  customers: { full_name: string } | null;
  properties: { address: string } | null;
};

const TYPE_TONE: Record<string, "success" | "pending" | "attention" | "info" | "neutral"> = {
  viewing: "success",
  meeting: "info",
  follow_up: "pending",
  other: "neutral",
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EventRow({ event }: { event: Event }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 last:border-0">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <Badge tone={TYPE_TONE[event.event_type] ?? "neutral"}>
            {event.event_type.replace("_", " ")}
          </Badge>
          <span className="text-xs text-ink-soft">{formatWhen(event.starts_at)}</span>
        </div>
        <p className="text-sm font-medium text-ink">{event.title}</p>
        <div className="mt-0.5 space-y-0.5 text-xs text-ink-soft">
          {event.customers?.full_name && <p>{event.customers.full_name}</p>}
          {(event.location || event.properties?.address) && (
            <p className="flex items-center gap-1">
              <MapPin size={11} />
              {event.location ?? event.properties?.address}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [past, setPast] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("calendar_events")
      .select(
        "id, title, event_type, starts_at, ends_at, location, customers(full_name), properties(address)"
      )
      .order("starts_at", { ascending: true });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg(null);
      const events = (data as unknown as Event[]) ?? [];
      const now = Date.now();
      setUpcoming(events.filter((e) => new Date(e.starts_at).getTime() >= now));
      setPast(
        events
          .filter((e) => new Date(e.starts_at).getTime() < now)
          .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
      );
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  const events = upcoming.length + past.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Calendar</h1>
          <p className="text-sm text-ink-soft">
            Viewings, meetings, and follow-ups.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} />
          New event
        </Button>
      </div>

      {showForm && (
        <AddEventForm
          onClose={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {errorMsg && (
        <Card className="border-attention/30 bg-attention/5 p-4 text-sm text-attention">
          Couldn&apos;t load the calendar: {errorMsg}.
        </Card>
      )}

      {!loading && !errorMsg && events === 0 && (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <CalendarIcon className="text-ink-soft" size={28} />
          <p className="text-sm font-medium text-ink">Nothing on the calendar</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Add a viewing or meeting — link it to a customer and property if
            relevant.
          </p>
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-background px-4 py-2 text-xs font-medium uppercase text-ink-soft">
            Upcoming
          </div>
          {upcoming.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </Card>
      )}

      {past.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast((s) => !s)}
            className="text-xs font-medium text-ink-soft underline"
          >
            {showPast ? "Hide" : "Show"} past events ({past.length})
          </button>
          {showPast && (
            <Card className="mt-3 overflow-hidden opacity-70">
              {past.map((e) => (
                <EventRow key={e.id} event={e} />
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
