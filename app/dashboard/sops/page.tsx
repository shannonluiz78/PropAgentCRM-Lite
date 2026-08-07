"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddSopForm, type ExistingSop } from "@/components/dashboard/add-sop-form";
import { Plus, ListTree, Pencil, Trash2 } from "lucide-react";

type Sop = ExistingSop & { created_at: string };

const AGENT_LABEL: Record<string, string> = {
  customer_agent: "Customer Agent",
  listing_agent: "Listing Agent",
  scheduling_agent: "Scheduling Agent",
  task_agent: "Task Agent",
};

export default function SopsPage() {
  const [sops, setSops] = useState<Sop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sop | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sop_rules")
      .select("id, name, trigger_description, action_description, target_agent, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg(null);
      setSops(data ?? []);
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

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("sop_rules").update({ is_active: !current }).eq("id", id);
    load();
  }

  async function handleDelete(s: Sop) {
    if (!confirm(`Delete "${s.name}"? This can't be undone.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("sop_rules").delete().eq("id", s.id);
    if (error) {
      alert(`Couldn't delete: ${error.message}`);
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Standing instructions</h1>
          <p className="text-sm text-ink-soft">
            Plain-English rules the Lead Agent checks each time you run it.
            Nothing acts on its own — matches land in Approvals for you to
            review.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm((s) => !s);
          }}
        >
          <Plus size={16} />
          New SOP
        </Button>
      </div>

      {(showForm || editing) && (
        <AddSopForm existing={editing ?? undefined} onClose={closeForm} />
      )}

      {errorMsg && (
        <Card className="border-attention/30 bg-attention/5 p-4 text-sm text-attention">
          Couldn&apos;t load SOPs: {errorMsg}.
        </Card>
      )}

      {!loading && !errorMsg && sops.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <ListTree className="text-ink-soft" size={28} />
          <p className="text-sm font-medium text-ink">No standing instructions yet</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Write your first rule — the Lead Agent won&apos;t draft anything
            until at least one is active.
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {sops.map((s) => (
          <Card key={s.id} className={`p-5 ${!s.is_active ? "opacity-60" : ""}`}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-ink">{s.name}</p>
                <Badge tone={s.is_active ? "success" : "neutral"}>
                  {s.is_active ? "active" : "inactive"}
                </Badge>
                <Badge tone="info">{AGENT_LABEL[s.target_agent]}</Badge>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => toggleActive(s.id, s.is_active)}
                  className="rounded px-2 py-1 text-xs text-ink-soft hover:bg-background hover:text-ink"
                >
                  {s.is_active ? "Deactivate" : "Activate"}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditing(s);
                  }}
                  className="rounded p-1.5 text-ink-soft hover:bg-background hover:text-ink"
                  aria-label={`Edit ${s.name}`}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  className="rounded p-1.5 text-ink-soft hover:bg-attention/10 hover:text-attention"
                  aria-label={`Delete ${s.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <p className="text-sm text-ink-soft">
              <span className="font-medium text-ink">When:</span> {s.trigger_description}
            </p>
            <p className="text-sm text-ink-soft">
              <span className="font-medium text-ink">Then:</span> {s.action_description}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
