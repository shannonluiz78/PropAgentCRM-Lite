"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddPropertyForm } from "@/components/dashboard/add-property-form";
import { Plus, Home } from "lucide-react";

type Property = {
  id: string;
  address: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqft: number | null;
  created_at: string;
  customers: { full_name: string } | null;
  listings: { status: string; created_at: string }[];
};

const TYPE_LABEL: Record<string, string> = {
  hdb: "HDB",
  condo: "Condo",
  ec: "EC",
  landed: "Landed",
};

const LISTING_STATUS_CLASS: Record<string, string> = {
  draft: "bg-ink/5 text-ink-soft",
  active: "bg-success/10 text-success",
  under_offer: "bg-pending/10 text-pending",
  closed: "bg-info/10 text-info",
  withdrawn: "bg-attention/10 text-attention",
};

function latestListingStatus(listings: Property["listings"]) {
  if (!listings || listings.length === 0) return null;
  return [...listings].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0].status;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("properties")
      .select(
        "id, address, property_type, bedrooms, bathrooms, size_sqft, created_at, customers(full_name), listings(status, created_at)"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setErrorMsg(null);
      setProperties((data as unknown as Property[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Properties</h1>
          <p className="text-sm text-ink-soft">
            Property records tied to their owner. Listings come next once a
            property is ready to market.
          </p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus size={16} />
          New property
        </Button>
      </div>

      {showForm && (
        <AddPropertyForm
          onClose={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {errorMsg && (
        <Card className="border-attention/30 bg-attention/5 p-4 text-sm text-attention">
          Couldn&apos;t load properties: {errorMsg}. If you haven&apos;t run{" "}
          <code>supabase/migrations/002_properties_update.sql</code> yet,
          run that in the Supabase SQL Editor first.
        </Card>
      )}

      {!loading && !errorMsg && properties.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <Home className="text-ink-soft" size={28} />
          <p className="text-sm font-medium text-ink">No properties yet</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Add a property once a customer owns one — either a seller/landlord
            bringing you a unit, or a buyer who&apos;s just closed.
          </p>
        </Card>
      )}

      {properties.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="border-b border-border bg-background text-left text-xs uppercase text-ink-soft">
              <tr>
                <th className="px-4 py-3 font-medium">Address</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Beds / Baths</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Listing</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => {
                const status = latestListingStatus(p.listings);
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{p.address}</td>
                    <td className="px-4 py-3">
                      <Badge tone="info">{TYPE_LABEL[p.property_type] ?? p.property_type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {p.customers?.full_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {p.bedrooms ?? "—"} / {p.bathrooms ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {p.size_sqft ? `${p.size_sqft} sqft` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {status ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            LISTING_STATUS_CLASS[status] ?? "bg-ink/5 text-ink-soft"
                          }`}
                        >
                          {status.replace("_", " ")}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-soft">No listing yet</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
