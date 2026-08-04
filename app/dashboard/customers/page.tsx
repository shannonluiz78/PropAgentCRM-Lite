"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddCustomerForm, type ExistingCustomer } from "@/components/dashboard/add-customer-form";
import { Plus, Users, Pencil, Trash2, PhoneCall } from "lucide-react";

type Customer = ExistingCustomer & {
  status: string;
  created_at: string;
  last_contacted_at: string | null;
  calendar_events: { event_type: string }[];
};

const STATUS_TONE: Record<string, "success" | "pending" | "attention" | "info" | "neutral"> = {
  new: "info",
  contacted: "pending",
  qualified: "pending",
  viewing: "pending",
  offer: "success",
  closed: "success",
  lost: "neutral",
};

function formatLastContacted(iso: string | null) {
  if (!iso) return { text: "Never", stale: true };
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  const stale = days >= 7;
  const text =
    days === 0 ? "Today" : days === 1 ? "Yesterday" : `${days} days ago`;
  return { text, stale };
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .select(
        "id, full_name, type, status, phone, email, area_focus, source, requirements, created_at, last_contacted_at, calendar_events(event_type)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg(null);
      setCustomers((data as unknown as Customer[]) ?? []);
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

  async function markContacted(id: string) {
    const supabase = createClient();
    await supabase
      .from("customers")
      .update({ last_contacted_at: new Date().toISOString() })
      .eq("id", id);
    load();
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This can't be undone.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        alert(
          "Can't delete — this customer still owns a property. Delete or reassign that property first."
        );
      } else {
        alert(`Couldn't delete: ${error.message}`);
      }
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Customers</h1>
          <p className="text-sm text-ink-soft">
            Buyers, sellers, landlords, and tenants in your pipeline.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm((s) => !s);
          }}
        >
          <Plus size={16} />
          New lead
        </Button>
      </div>

      {(showForm || editing) && (
        <AddCustomerForm existing={editing ?? undefined} onClose={closeForm} />
      )}

      {errorMsg && (
        <Card className="border-attention/30 bg-attention/5 p-4 text-sm text-attention">
          Couldn&apos;t load customers: {errorMsg}. If this is your first time
          here, make sure you&apos;ve run <code>supabase/schema.sql</code> in the
          Supabase SQL Editor.
        </Card>
      )}

      {!loading && !errorMsg && customers.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <Users className="text-ink-soft" size={28} />
          <p className="text-sm font-medium text-ink">No leads yet</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Add your first customer to start the pipeline — the agent layer
            picks up from here once SOPs are configured.
          </p>
        </Card>
      )}

      {customers.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[1020px] text-sm">
            <thead className="border-b border-border bg-background text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Viewings</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Area focus</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Last contacted</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{c.full_name}</td>
                  <td className="px-4 py-3 capitalize text-ink-soft">{c.type}</td>
                  <td className="px-4 py-3">
                    {c.type === "buyer" ? (
                      (() => {
                        const count = c.calendar_events.filter(
                          (e) => e.event_type === "viewing"
                        ).length;
                        return (
                          <span
                            className={
                              count === 0
                                ? "text-xs font-medium text-attention"
                                : "text-xs text-ink-soft"
                            }
                          >
                            {count === 0 ? "No viewings yet" : `${count} viewing${count > 1 ? "s" : ""}`}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-xs text-ink-soft">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{c.area_focus ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{c.source ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {(() => {
                      const lc = formatLastContacted(c.last_contacted_at);
                      return (
                        <div className="flex items-center gap-2">
                          <span className={lc.stale ? "text-attention font-medium" : "text-ink-soft"}>
                            {lc.text}
                          </span>
                          <button
                            onClick={() => markContacted(c.id)}
                            className="rounded p-1 text-ink-soft hover:bg-background hover:text-ink"
                            aria-label={`Mark ${c.full_name} as contacted today`}
                            title="Mark contacted today"
                          >
                            <PhoneCall size={13} />
                          </button>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => {
                          setShowForm(false);
                          setEditing(c);
                        }}
                        className="rounded p-1.5 text-ink-soft hover:bg-background hover:text-ink"
                        aria-label={`Edit ${c.full_name}`}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.full_name)}
                        className="rounded p-1.5 text-ink-soft hover:bg-attention/10 hover:text-attention"
                        aria-label={`Delete ${c.full_name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
