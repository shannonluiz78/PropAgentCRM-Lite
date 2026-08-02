"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddListingForm } from "@/components/dashboard/add-listing-form";
import { Plus, ListChecks } from "lucide-react";

type Listing = {
  id: string;
  listing_type: string;
  price: number | null;
  status: string;
  created_at: string;
  properties: {
    address: string;
    customers: { full_name: string } | null;
  } | null;
};

const STATUS_SELECT_CLASS: Record<string, string> = {
  draft: "bg-ink/5 text-ink-soft",
  active: "bg-success/10 text-success",
  under_offer: "bg-pending/10 text-pending",
  closed: "bg-info/10 text-info",
  withdrawn: "bg-attention/10 text-attention",
};

const STATUS_OPTIONS = ["draft", "active", "under_offer", "closed", "withdrawn"];

function formatPrice(price: number | null, type: string) {
  if (price === null) return "—";
  const formatted = new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0,
  }).format(price);
  return type === "rental" ? `${formatted}/mo` : formatted;
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, listing_type, price, status, created_at, properties(address, customers(full_name))"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg(null);
      setListings((data as unknown as Listing[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("listings").update({ status }).eq("id", id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Listings</h1>
          <p className="text-sm text-ink-soft">
            Active marketing campaigns, each tied back to a property.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} />
          New listing
        </Button>
      </div>

      {showForm && (
        <AddListingForm
          onClose={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {errorMsg && (
        <Card className="border-attention/30 bg-attention/5 p-4 text-sm text-attention">
          Couldn&apos;t load listings: {errorMsg}. If you haven&apos;t run{" "}
          <code>supabase/migrations/003_listings_update.sql</code> yet, run
          that in the Supabase SQL Editor first.
        </Card>
      )}

      {!loading && !errorMsg && listings.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <ListChecks className="text-ink-soft" size={28} />
          <p className="text-sm font-medium text-ink">No listings yet</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Create one once an owner is ready to sell or rent — pick the
            property, it&apos;ll carry the owner&apos;s name along with it.
          </p>
        </Card>
      )}

      {listings.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border bg-background text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    {l.properties?.address ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {l.properties?.customers?.full_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 capitalize text-ink-soft">{l.listing_type}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {formatPrice(l.price, l.listing_type)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={l.status}
                      onChange={(e) => updateStatus(l.id, e.target.value)}
                      className={`rounded-full border-0 px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brass/40 ${
                        STATUS_SELECT_CLASS[l.status] ?? "bg-ink/5 text-ink-soft"
                      }`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
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
