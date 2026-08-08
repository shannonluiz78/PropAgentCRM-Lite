"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddEventForm, type ExistingEvent } from "@/components/dashboard/add-event-form";
import { Plus, Calendar as CalendarIcon, MapPin, Pencil, Trash2 } from "lucide-react";

type Event = {
  id: string;
  title: string;
  event_type: ExistingEvent["event_type"];
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  customer_id: string | null;
  property_id: string | null;
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
    timeZone: "Asia/Singapore",
  });
}

function toExisting(e: Event): ExistingEvent {
  return {
    id: e.id,
    title: e.title,
    event_type: e.event_type,
    starts_at: e.starts_at,
    ends_at: e.ends_at,
    location: e.location,
    customer_id: e.customer_id,
    property_id: e.property_id,
  };
}

function EventRow({
  event,
  onEdit,
  onDelete,
}: {
  event: Event;
  onEdit: () => void;
  onDelete: () => void;
}) {
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
      <div className="flex gap-1">
        <button
          onClick={onEdit}
          className="rounded p-1.5 text-ink-soft hover:bg-background hover:text-ink"
          aria-label={`Edit ${event.title}`}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="rounded p-1.5 text-ink-soft hover:bg-attention/10 hover:text-attention"
          aria-label={`Delete ${event.title}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [upcoming, setUpcoming] = useState<Event[]>([]);
  const [past, setPast] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [showPast, setShowPast] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("calendar_events")
      .select(
        "id, title, event_type, starts_at, ends_at, location, customer_id, property_id, customers(full_name), properties(address)"
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

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function handleDelete(event: Event) {
    if (!confirm(`Delete "${event.title}"? This can't be undone.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("calendar_events").delete().eq("id", event.id);
    if (error) {
      alert(`Couldn't delete: ${error.message}`);
      return;
    }
    load();
  }

  const eventCount = upcoming.length + past.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Calendar</h1>
          <p className="text-sm text-ink-soft">
            Viewings, meetings, and follow-ups.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm((s) => !s);
          }}
        >
          <Plus size={16} />
          New event
        </Button>
      </div>

      {(showForm || editing) && (
        <AddEventForm existing={editing ? toExisting(editing) : undefined} onClose={closeForm} />
      )}

      {errorMsg && (
        <Card className="border-attention/30 bg-attention/5 p-4 text-sm text-attention">
          Couldn&apos;t load the calendar: {errorMsg}.
        </Card>
      )}

      {!loading && !errorMsg && eventCount === 0 && (
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
            <EventRow
              key={e.id}
              event={e}
              onEdit={() => {
                setShowForm(false);
                setEditing(e);
              }}
              onDelete={() => handleDelete(e)}
            />
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
                <EventRow
                  key={e.id}
                  event={e}
                  onEdit={() => {
                    setShowForm(false);
                    setEditing(e);
                  }}
                  onDelete={() => handleDelete(e)}
                />
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
