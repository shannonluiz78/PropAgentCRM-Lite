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

export type ExistingListing = {
  id: string;
  property_id: string;
  listing_type: "sale" | "rental";
  price: number | null;
  status: (typeof STATUSES)[number]["value"];
  description: string | null;
  is_exclusive: boolean;
  exclusive_expiry: string | null;
  commission_rate: number | null;
  commission_amount: number | null;
};

export function AddListingForm({
  existing,
  defaultPropertyId,
  onClose,
}: {
  existing?: ExistingListing;
  defaultPropertyId?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    property_id: existing?.property_id ?? defaultPropertyId ?? "",
    listing_type: existing?.listing_type ?? "sale",
    price: existing?.price?.toString() ?? "",
    status: existing?.status ?? "active",
    description: existing?.description ?? "",
    is_exclusive: existing?.is_exclusive ?? false,
    exclusive_expiry: existing?.exclusive_expiry ?? "",
    commission_rate: existing?.commission_rate?.toString() ?? "",
    commission_amount: existing?.commission_amount?.toString() ?? "",
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
    const payload = {
      property_id: form.property_id,
      listing_type: form.listing_type,
      price: form.price ? Number(form.price) : null,
      status: form.status,
      description: form.description || null,
      is_exclusive: form.is_exclusive,
      exclusive_expiry: form.is_exclusive && form.exclusive_expiry ? form.exclusive_expiry : null,
      commission_rate: form.commission_rate ? Number(form.commission_rate) : null,
      commission_amount: form.commission_amount ? Number(form.commission_amount) : null,
    };

    const { error } = existing
      ? await supabase.from("listings").update(payload).eq("id", existing.id)
      : await supabase.from("listings").insert(payload);

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
          {existing ? "Edit listing" : "New listing"}
        </h2>
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

          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Commission rate (%)
            </label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={form.commission_rate}
              onChange={(e) => update("commission_rate", e.target.value)}
              placeholder="1.5"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Or fixed commission ($)
            </label>
            <Input
              type="number"
              min="0"
              value={form.commission_amount}
              onChange={(e) => update("commission_amount", e.target.value)}
              placeholder="Leave blank if using rate above"
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

          <div className="col-span-2 flex items-center gap-2">
            <input
              id="is_exclusive"
              type="checkbox"
              checked={form.is_exclusive}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_exclusive: e.target.checked }))
              }
              className="h-4 w-4 rounded border-border text-brass focus:ring-brass/40"
            />
            <label htmlFor="is_exclusive" className="text-sm font-medium text-ink">
              Exclusive mandate
            </label>
          </div>

          {form.is_exclusive && (
            <div className="col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-ink">
                Exclusive expires
              </label>
              <Input
                type="date"
                value={form.exclusive_expiry}
                onChange={(e) => update("exclusive_expiry", e.target.value)}
              />
            </div>
          )}

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
              {loading ? "Saving…" : existing ? "Save changes" : "Save listing"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
