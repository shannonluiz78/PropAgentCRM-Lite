"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddActivityForm, type ExistingActivity } from "@/components/dashboard/add-activity-form";
import { Plus, ClipboardList, Pencil, Trash2, X } from "lucide-react";

type Activity = {
  id: string;
  activity_type: ExistingActivity["activity_type"];
  content: string;
  created_at: string;
  customer_id: string | null;
  property_id: string | null;
  listing_id: string | null;
  customers: { full_name: string } | null;
  properties: { address: string } | null;
  listings: { properties: { address: string } | null } | null;
};

const TYPE_TONE: Record<string, "success" | "pending" | "attention" | "info" | "neutral"> = {
  call: "info",
  email: "info",
  meeting: "pending",
  viewing: "success",
  note: "neutral",
  other: "neutral",
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-SG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function toExisting(a: Activity): ExistingActivity {
  return {
    id: a.id,
    activity_type: a.activity_type,
    content: a.content,
    customer_id: a.customer_id,
    property_id: a.property_id,
    listing_id: a.listing_id,
  };
}

function ActivitiesPageInner() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customer");

  const [activities, setActivities] = useState<Activity[]>([]);
  const [filterName, setFilterName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();

    if (customerId) {
      const { data: customer } = await supabase
        .from("customers")
        .select("full_name")
        .eq("id", customerId)
        .single();
      setFilterName(customer?.full_name ?? null);
    } else {
      setFilterName(null);
    }

    let query = supabase
      .from("activities")
      .select(
        "id, activity_type, content, created_at, customer_id, property_id, listing_id, customers(full_name), properties(address), listings(properties(address))"
      )
      .order("created_at", { ascending: false });

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const { data, error } = await query;

    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg(null);
      setActivities((data as unknown as Activity[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch when the customer filter changes
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    load();
  }

  async function handleDelete(a: Activity) {
    if (!confirm("Delete this activity? This can't be undone.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("activities").delete().eq("id", a.id);
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
          <h1 className="text-2xl font-semibold text-ink">Activities</h1>
          <p className="text-sm text-ink-soft">
            What actually happened — calls, notes, viewings — separate from
            scheduled events and open tasks.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm((s) => !s);
          }}
        >
          <Plus size={16} />
          Log activity
        </Button>
      </div>

      {customerId && (
        <div className="flex items-center justify-between rounded-md border border-info/30 bg-info/5 px-4 py-2.5 text-sm">
          <span className="text-ink">
            Showing activities for{" "}
            <span className="font-medium">{filterName ?? "this customer"}</span>
          </span>
          <Link
            href="/dashboard/activities"
            className="flex items-center gap-1 text-xs text-ink-soft hover:text-ink"
          >
            <X size={13} />
            Clear filter
          </Link>
        </div>
      )}

      {(showForm || editing) && (
        <AddActivityForm
          existing={editing ? toExisting(editing) : undefined}
          defaultCustomerId={customerId ?? undefined}
          onClose={closeForm}
        />
      )}

      {errorMsg && (
        <Card className="border-attention/30 bg-attention/5 p-4 text-sm text-attention">
          Couldn&apos;t load activities: {errorMsg}. If you haven&apos;t run{" "}
          <code>supabase/migrations/005_activities_and_commission.sql</code>{" "}
          yet, run that in the Supabase SQL Editor first.
        </Card>
      )}

      {!loading && !errorMsg && activities.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <ClipboardList className="text-ink-soft" size={28} />
          <p className="text-sm font-medium text-ink">Nothing logged yet</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Log a call, a note from a viewing, or anything worth remembering
            about a customer, property, or listing.
          </p>
        </Card>
      )}

      {activities.length > 0 && (
        <Card className="overflow-hidden">
          {activities.map((a) => {
            const linkedAddress =
              a.properties?.address ?? a.listings?.properties?.address ?? null;
            return (
              <div
                key={a.id}
                className="flex items-start justify-between gap-4 border-b border-border px-4 py-3 last:border-0"
              >
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone={TYPE_TONE[a.activity_type] ?? "neutral"}>
                      {a.activity_type}
                    </Badge>
                    <span className="text-xs text-ink-soft">{formatWhen(a.created_at)}</span>
                    {a.customers?.full_name && (
                      <span className="text-xs text-ink-soft">· {a.customers.full_name}</span>
                    )}
                    {linkedAddress && (
                      <span className="text-xs text-ink-soft">· {linkedAddress}</span>
                    )}
                  </div>
                  <p className="text-sm text-ink">{a.content}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditing(a);
                    }}
                    className="rounded p-1.5 text-ink-soft hover:bg-background hover:text-ink"
                    aria-label="Edit activity"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    className="rounded p-1.5 text-ink-soft hover:bg-attention/10 hover:text-attention"
                    aria-label="Delete activity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

export default function ActivitiesPage() {
  return (
    <Suspense fallback={<div className="text-sm text-ink-soft">Loading…</div>}>
      <ActivitiesPageInner />
    </Suspense>
  );
}
