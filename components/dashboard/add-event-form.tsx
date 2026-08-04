"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

const EVENT_TYPES = [
  { value: "viewing", label: "Viewing" },
  { value: "meeting", label: "Meeting" },
  { value: "follow_up", label: "Follow-up" },
  { value: "other", label: "Other" },
] as const;

type CustomerOption = { id: string; full_name: string };
type PropertyOption = { id: string; address: string };

function toLocalInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type ExistingEvent = {
  id: string;
  title: string;
  event_type: (typeof EVENT_TYPES)[number]["value"];
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  customer_id: string | null;
  property_id: string | null;
};

export function AddEventForm({
  existing,
  onClose,
}: {
  existing?: ExistingEvent;
  onClose: () => void;
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: existing?.title ?? "",
    event_type: existing?.event_type ?? "viewing",
    starts_at: toLocalInputValue(existing?.starts_at ?? null),
    ends_at: toLocalInputValue(existing?.ends_at ?? null),
    location: existing?.location ?? "",
    customer_id: existing?.customer_id ?? "",
    property_id: existing?.property_id ?? "",
  });

  useEffect(() => {
    async function loadOptions() {
      const supabase = createClient();
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("customers").select("id, full_name").order("full_name"),
        supabase.from("properties").select("id, address").order("address"),
      ]);
      setCustomers(c ?? []);
      setProperties(p ?? []);
    }
    loadOptions();
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      title: form.title,
      event_type: form.event_type,
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      location: form.location || null,
      customer_id: form.customer_id || null,
      property_id: form.property_id || null,
    };

    const { error } = existing
      ? await supabase.from("calendar_events").update(payload).eq("id", existing.id)
      : await supabase.from("calendar_events").insert(payload);

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">
          {existing ? "Edit event" : "New event"}
        </h2>
        <button onClick={onClose} className="text-ink-soft hover:text-ink">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Title *
          </label>
          <Input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Viewing with Liang Cheng Mei"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Type
          </label>
          <select
            value={form.event_type}
            onChange={(e) => update("event_type", e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Location
          </label>
          <Input
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="Blk 340 Tampines St 31"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Starts *
          </label>
          <Input
            required
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => update("starts_at", e.target.value)}
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Ends
          </label>
          <Input
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => update("ends_at", e.target.value)}
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Customer
          </label>
          <select
            value={form.customer_id}
            onChange={(e) => update("customer_id", e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          >
            <option value="">None</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Property
          </label>
          <select
            value={form.property_id}
            onChange={(e) => update("property_id", e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          >
            <option value="">None</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.address}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="col-span-2 rounded-md bg-attention/10 px-3 py-2 text-sm text-attention">
            {error}
          </p>
        )}

        <div className="col-span-2 flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : existing ? "Save changes" : "Save event"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
