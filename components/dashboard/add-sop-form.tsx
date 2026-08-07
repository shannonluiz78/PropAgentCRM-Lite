"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X } from "lucide-react";

const AGENTS = [
  { value: "customer_agent", label: "Customer Agent — follow-ups, check-ins" },
  { value: "listing_agent", label: "Listing Agent — marketing, listing status" },
  { value: "scheduling_agent", label: "Scheduling Agent — viewings, reminders" },
  { value: "task_agent", label: "Task Agent — reminders, to-dos" },
] as const;

export type ExistingSop = {
  id: string;
  name: string;
  trigger_description: string;
  action_description: string;
  target_agent: (typeof AGENTS)[number]["value"];
  is_active: boolean;
};

export function AddSopForm({
  existing,
  onClose,
}: {
  existing?: ExistingSop;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    trigger_description: existing?.trigger_description ?? "",
    action_description: existing?.action_description ?? "",
    target_agent: existing?.target_agent ?? "customer_agent",
    is_active: existing?.is_active ?? true,
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const payload = {
      name: form.name,
      trigger_description: form.trigger_description,
      action_description: form.action_description,
      target_agent: form.target_agent,
      is_active: form.is_active,
    };

    const { error } = existing
      ? await supabase.from("sop_rules").update(payload).eq("id", existing.id)
      : await supabase.from("sop_rules").insert(payload);

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
          {existing ? "Edit SOP" : "New SOP"}
        </h2>
        <button onClick={onClose} className="text-ink-soft hover:text-ink">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Name *
          </label>
          <Input
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Follow up cold buyer leads"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            When should this trigger? *
          </label>
          <textarea
            required
            value={form.trigger_description}
            onChange={(e) => update("trigger_description", e.target.value)}
            rows={2}
            placeholder="A buyer lead hasn't been contacted in 4 hours"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          />
        </div>

        <div className="col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            What should the agent do? *
          </label>
          <textarea
            required
            value={form.action_description}
            onChange={(e) => update("action_description", e.target.value)}
            rows={2}
            placeholder="Draft a friendly WhatsApp follow-up asking if they're still interested"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          />
        </div>

        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1.5 block text-sm font-medium text-ink">
            Handled by
          </label>
          <select
            value={form.target_agent}
            onChange={(e) => update("target_agent", e.target.value)}
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brass/40 focus:border-brass"
          >
            {AGENTS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-1 flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_active: e.target.checked }))
              }
              className="h-4 w-4 rounded border-border text-brass focus:ring-brass/40"
            />
            Active
          </label>
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
            {loading ? "Saving…" : existing ? "Save changes" : "Save SOP"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
