"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

const TYPES = ["buyer", "seller", "landlord", "tenant"] as const;
const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "viewing", label: "Viewing" },
  { value: "offer", label: "Offer" },
  { value: "closed", label: "Closed — Won" },
  { value: "lost", label: "Closed — Lost" },
] as const;

export type ExistingCustomer = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  type: string;
  status: string;
  source: string | null;
  area_focus: string | null;
  requirements: string | null;
  closed_at: string | null;
};

export function AddCustomerForm({
  existing,
  onClose,
}: {
  existing?: ExistingCustomer;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: existing?.full_name ?? "",
    phone: existing?.phone ?? "",
    email: existing?.email ?? "",
    type: (existing?.type as (typeof TYPES)[number]) ?? "buyer",
    status: (existing?.status as (typeof STATUSES)[number]["value"]) ?? "new",
    source: existing?.source ?? "",
    area_focus: existing?.area_focus ?? "",
    requirements: existing?.requirements ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const wasClosed = existing ? ["closed", "lost"].includes(existing.status) : false;
    const isClosed = ["closed", "lost"].includes(form.status);
    // Stamp the moment it first closes; clear it if reopened; leave it
    // alone if it was already closed and stays closed (e.g. editing notes).
    const closed_at = isClosed
      ? wasClosed
        ? existing!.closed_at
        : new Date().toISOString()
      : null;

    const payload = {
      full_name: form.full_name,
      phone: form.phone || null,
      email: form.email || null,
      type: form.type,
      status: form.status,
      source: form.source || null,
      area_focus: form.area_focus || null,
      requirements: form.requirements || null,
      closed_at,
    };

    const { error } = existing
      ? await supabase.from("customers").update(payload).eq("id", existing.id)
      : await supabase.from("customers").insert(payload);

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
          {existing ? "Edit lead" : "New lead"}
        </h2>
        <button onClick={onClose} className="text-ink-soft hover:text-ink">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Full name *
          </label>
          <Input
            required
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            placeholder="Tan Wei Ming"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Type *
          </label>
          <select
            required
            value={form.type}
            onChange={(e) => update("type", e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t[0].toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1">
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
          {existing?.closed_at && ["closed", "lost"].includes(form.status) && (
            <p className="mt-1 text-xs text-ink-soft">
              Closed on{" "}
              {new Date(existing.closed_at).toLocaleDateString("en-SG", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Asia/Singapore",
              })}
            </p>
          )}
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Phone (with country code)
          </label>
          <Input
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="+65 9123 4567"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Email
          </label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="name@example.com"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Source
          </label>
          <Input
            value={form.source}
            onChange={(e) => update("source", e.target.value)}
            placeholder="Instagram, referral, PropertyGuru…"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Area focus
          </label>
          <Input
            value={form.area_focus}
            onChange={(e) => update("area_focus", e.target.value)}
            placeholder="Yishun, Sembawang, Woodlands"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Requirements
          </label>
          <textarea
            value={form.requirements}
            onChange={(e) => update("requirements", e.target.value)}
            rows={3}
            placeholder="Budget, unit type, timeline, must-haves…"
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
            {loading ? "Saving…" : existing ? "Save changes" : "Save lead"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
