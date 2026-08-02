"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

const STATUSES = [
  { value: "draft", label: "Draft — not public yet" },
  { value: "active", label: "Active — marketing now" },
  { value: "under_offer", label: "Under offer" },
  { value: "closed", label: "Closed" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

type PropertyOption = {
  id: string;
  address: string;
  customers: { full_name: string } | null;
};

export function AddListingForm({
  defaultPropertyId,
  onClose,
}: {
  defaultPropertyId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    property_id: defaultPropertyId ?? "",
    listing_type: "sale" as "sale" | "rental",
    price: "",
    status: "active" as (typeof STATUSES)[number]["value"],
    description: "",
  });

  useEffect(() => {
    async function loadProperties() {
      const supabase = createClient();
      const { data } = await supabase
        .from("properties")
        .select("id, address, customers(full_name)")
        .order("address");
      setProperties((data as unknown as PropertyOption[]) ?? []);
    }
    loadProperties();
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.from("listings").insert({
      property_id: form.property_id,
      listing_type: form.listing_type,
      price: form.price ? Number(form.price) : null,
      status: form.status,
      description: form.description || null,
    });

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
        <h2 className="text-sm font-semibold text-ink">New listing</h2>
        <button onClick={onClose} className="text-ink-soft hover:text-ink">
          <X size={18} />
        </button>
      </div>

      {properties.length === 0 ? (
        <p className="rounded-md bg-pending/10 px-3 py-3 text-sm text-pending">
          You need at least one property before creating a listing. Add a
          property first, then come back here.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Property *
            </label>
            <select
              required
              value={form.property_id}
              onChange={(e) => update("property_id", e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
            >
              <option value="" disabled>
                Select the property to market
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address}
                  {p.customers?.full_name ? ` — owner: ${p.customers.full_name}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              For sale or rent? *
            </label>
            <select
              required
              value={form.listing_type}
              onChange={(e) => update("listing_type", e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
            >
              <option value="sale">Sale</option>
              <option value="rental">Rental</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Price {form.listing_type === "rental" ? "(per month)" : "(asking)"}
            </label>
            <Input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              placeholder={form.listing_type === "rental" ? "3200" : "580000"}
            />
          </div>

          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Marketing description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              rows={4}
              placeholder="Write it yourself for now — the Listing Agent will be able to draft this for you once the agent layer is wired up."
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
              {loading ? "Saving…" : "Save listing"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
