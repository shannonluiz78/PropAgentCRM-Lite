"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

const TYPES = [
  { value: "hdb", label: "HDB" },
  { value: "condo", label: "Condo" },
  { value: "ec", label: "Executive Condo (EC)" },
  { value: "landed", label: "Landed" },
] as const;

type CustomerOption = { id: string; full_name: string; type: string };

export type ExistingProperty = {
  id: string;
  address: string;
  property_type: string;
  owner_customer_id: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqft: number | null;
  notes: string | null;
  tenure: string | null;
  lease_remaining_years: number | null;
};

export function AddPropertyForm({
  existing,
  onClose,
}: {
  existing?: ExistingProperty;
  onClose: () => void;
}) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    address: existing?.address ?? "",
    property_type:
      (existing?.property_type as (typeof TYPES)[number]["value"]) ?? "hdb",
    owner_customer_id: existing?.owner_customer_id ?? "",
    bedrooms: existing?.bedrooms?.toString() ?? "",
    bathrooms: existing?.bathrooms?.toString() ?? "",
    size_sqft: existing?.size_sqft?.toString() ?? "",
    notes: existing?.notes ?? "",
    tenure: existing?.tenure ?? "",
    lease_remaining_years: existing?.lease_remaining_years?.toString() ?? "",
  });

  useEffect(() => {
    async function loadCustomers() {
      const supabase = createClient();
      const { data } = await supabase
        .from("customers")
        .select("id, full_name, type")
        .order("full_name");
      setCustomers(data ?? []);
    }
    loadCustomers();
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
      address: form.address,
      property_type: form.property_type,
      owner_customer_id: form.owner_customer_id,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      size_sqft: form.size_sqft ? Number(form.size_sqft) : null,
      notes: form.notes || null,
      tenure: form.tenure || null,
      lease_remaining_years: form.lease_remaining_years
        ? Number(form.lease_remaining_years)
        : null,
    };

    const { error } = existing
      ? await supabase.from("properties").update(payload).eq("id", existing.id)
      : await supabase.from("properties").insert(payload);

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
          {existing ? "Edit property" : "New property"}
        </h2>
        <button onClick={onClose} className="text-ink-soft hover:text-ink">
          <X size={18} />
        </button>
      </div>

      {customers.length === 0 ? (
        <p className="rounded-md bg-pending/10 px-3 py-3 text-sm text-pending">
          You need at least one customer before adding a property — every
          property has to be linked to its owner. Add a customer first,
          then come back here.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Owner *
            </label>
            <select
              required
              value={form.owner_customer_id}
              onChange={(e) => update("owner_customer_id", e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
            >
              <option value="" disabled>
                Select the customer who owns this property
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Address *
            </label>
            <Input
              required
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              placeholder="Blk 123 Yishun Ave 5, #08-123"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Type *
            </label>
            <select
              required
              value={form.property_type}
              onChange={(e) => update("property_type", e.target.value)}
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
              Tenure
            </label>
            <select
              value={form.tenure}
              onChange={(e) => update("tenure", e.target.value)}
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
            >
              <option value="">Not set</option>
              <option value="freehold">Freehold</option>
              <option value="99_leasehold">99-year leasehold</option>
              <option value="999_leasehold">999-year leasehold</option>
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Lease remaining (years)
            </label>
            <Input
              type="number"
              min="0"
              value={form.lease_remaining_years}
              onChange={(e) => update("lease_remaining_years", e.target.value)}
              placeholder="e.g. 62"
              disabled={form.tenure === "freehold"}
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Size (sqft)
            </label>
            <Input
              type="number"
              min="0"
              value={form.size_sqft}
              onChange={(e) => update("size_sqft", e.target.value)}
              placeholder="1000"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Bedrooms
            </label>
            <Input
              type="number"
              min="0"
              value={form.bedrooms}
              onChange={(e) => update("bedrooms", e.target.value)}
              placeholder="3"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Bathrooms
            </label>
            <Input
              type="number"
              min="0"
              value={form.bathrooms}
              onChange={(e) => update("bathrooms", e.target.value)}
              placeholder="2"
            />
          </div>

          <div className="col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-ink">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              placeholder="Renovation status, tenancy details, access arrangements…"
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
              {loading ? "Saving…" : existing ? "Save changes" : "Save property"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
