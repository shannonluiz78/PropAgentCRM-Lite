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

export function AddPropertyForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    address: "",
    property_type: "hdb" as (typeof TYPES)[number]["value"],
    owner_customer_id: "",
    bedrooms: "",
    bathrooms: "",
    size_sqft: "",
    notes: "",
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
    const { error } = await supabase.from("properties").insert({
      address: form.address,
      property_type: form.property_type,
      owner_customer_id: form.owner_customer_id,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      size_sqft: form.size_sqft ? Number(form.size_sqft) : null,
      notes: form.notes || null,
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
        <h2 className="text-sm font-semibold text-ink">New property</h2>
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
              {loading ? "Saving…" : "Save property"}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
