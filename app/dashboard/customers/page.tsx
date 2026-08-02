"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddCustomerForm } from "@/components/dashboard/add-customer-form";
import { Plus, Users } from "lucide-react";

type Customer = {
  id: string;
  full_name: string;
  type: string;
  status: string;
  phone: string | null;
  area_focus: string | null;
  source: string | null;
  created_at: string;
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

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("customers")
      .select("id, full_name, type, status, phone, area_focus, source, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg(null);
      setCustomers(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Customers</h1>
          <p className="text-sm text-ink-soft">
            Buyers, sellers, landlords, and tenants in your pipeline.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} />
          New lead
        </Button>
      </div>

      {showForm && (
        <AddCustomerForm
          onClose={() => {
            setShowForm(false);
            load();
          }}
        />
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
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-background text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Area focus</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Phone</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{c.full_name}</td>
                  <td className="px-4 py-3 capitalize text-ink-soft">{c.type}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[c.status] ?? "neutral"}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{c.area_focus ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{c.source ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">{c.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
