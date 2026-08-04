"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

const TYPES = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "viewing", label: "Viewing" },
  { value: "note", label: "Note" },
  { value: "other", label: "Other" },
] as const;

type CustomerOption = { id: string; full_name: string };
type PropertyOption = { id: string; address: string };
type ListingOption = { id: string; properties: { address: string } | null };

export type ExistingActivity = {
  id: string;
  activity_type: (typeof TYPES)[number]["value"];
  content: string;
  customer_id: string | null;
  property_id: string | null;
  listing_id: string | null;
};

export function AddActivityForm({
  existing,
  defaultCustomerId,
  onClose,
}: {
  existing?: ExistingActivity;
  defaultCustomerId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    activity_type: existing?.activity_type ?? "call",
    content: existing?.content ?? "",
    customer_id: existing?.customer_id ?? defaultCustomerId ?? "",
    property_id: existing?.property_id ?? "",
    listing_id: existing?.listing_id ?? "",
  });

  useEffect(() => {
    async function loadOptions() {
      const supabase = createClient();
      const [{ data: c }, { data: p }, { data: l }] = await Promise.all([
        supabase.from("customers").select("id, full_name").order("full_name"),
        supabase.from("properties").select("id, address").order("address"),
        supabase.from("listings").select("id, properties(address)"),
      ]);
      setCustomers(c ?? []);
      setProperties(p ?? []);
      setListings((l as unknown as ListingOption[]) ?? []);
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
      activity_type: form.activity_type,
      content: form.content,
      customer_id: form.customer_id || null,
      property_id: form.property_id || null,
      listing_id: form.listing_id || null,
    };

    const { error } = existing
      ? await supabase.from("activities").update(payload).eq("id", existing.id)
      : await supabase.from("activities").insert(payload);

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
          {existing ? "Edit activity" : "Log activity"}
        </h2>
        <button onClick={onClose} className="text-ink-soft hover:text-ink">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Type
          </label>
          <select
            value={form.activity_type}
            onChange={(e) => update("activity_type", e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
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

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Listing
          </label>
          <select
            value={form.listing_id}
            onChange={(e) => update("listing_id", e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          >
            <option value="">None</option>
            {listings.map((l) => (
              <option key={l.id} value={l.id}>
                {l.properties?.address ?? "Listing"}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            What happened *
          </label>
          <textarea
            required
            value={form.content}
            onChange={(e) => update("content", e.target.value)}
            rows={3}
            placeholder="Called Cheng Mei, she's keen but wants to see the unit again on the weekend"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          />
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
            {loading ? "Saving…" : existing ? "Save changes" : "Log activity"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
