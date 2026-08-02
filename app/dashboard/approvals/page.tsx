"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck } from "lucide-react";

type AgentAction = {
  id: string;
  agent_name: string;
  action_type: string;
  draft_content: string;
  status: string;
  created_at: string;
};

export default function ApprovalsPage() {
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("agent_actions")
      .select("id, agent_name, action_type, draft_content, status, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) setErrorMsg(error.message);
    else {
      setErrorMsg(null);
      setActions(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function decide(id: string, status: "approved" | "rejected") {
    const supabase = createClient();
    await supabase
      .from("agent_actions")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Approvals</h1>
        <p className="text-sm text-ink-soft">
          Everything an agent drafts for a customer waits here. Nothing is
          sent or published until you approve it.
        </p>
      </div>

      {errorMsg && (
        <Card className="border-attention/30 bg-attention/5 p-4 text-sm text-attention">
          Couldn&apos;t load approvals: {errorMsg}. Run{" "}
          <code>supabase/schema.sql</code> in the Supabase SQL Editor if you
          haven&apos;t yet.
        </Card>
      )}

      {!loading && !errorMsg && actions.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
          <ShieldCheck className="text-ink-soft" size={28} />
          <p className="text-sm font-medium text-ink">Nothing waiting on you</p>
          <p className="max-w-sm text-sm text-ink-soft">
            Agents haven&apos;t drafted anything yet — this fills up once SOPs
            are active and agents start working the pipeline.
          </p>
        </Card>
      )}

      <div className="space-y-3">
        {actions.map((a) => (
          <Card key={a.id} className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="pending">{a.action_type.replace(/_/g, " ")}</Badge>
              <span className="text-xs text-ink-soft">
                drafted by {a.agent_name.replace(/_/g, " ")}
              </span>
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink">
              {a.draft_content}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => decide(a.id, "rejected")}>
                Reject
              </Button>
              <Button onClick={() => decide(a.id, "approved")}>Approve</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
