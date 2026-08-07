import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { draftWithAi, parseAiJson } from "@/lib/ai/agent";

type SopRule = {
  name: string;
  trigger_description: string;
  action_description: string;
  target_agent: string;
};

type DraftedAction = {
  sop_name: string;
  target_agent: string;
  action_type: string;
  customer_id: string | null;
  draft_content: string;
};

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  // 1. Active SOPs — nothing to do if there are none.
  const { data: sops } = await supabase
    .from("sop_rules")
    .select("name, trigger_description, action_description, target_agent")
    .eq("is_active", true);

  if (!sops || sops.length === 0) {
    return NextResponse.json({ drafted: 0, message: "No active standing instructions." });
  }

  // 2. Snapshot of current data, scoped to this agent by RLS automatically.
  const nowIso = new Date().toISOString();
  const weekAheadIso = new Date(Date.now() + 7 * 86400000).toISOString();

  const [
    { data: customers },
    { data: listings },
    { data: tasks },
    { data: events },
    { data: pendingActions },
    { data: memories },
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, type, status, last_contacted_at, area_focus, requirements"),
    supabase
      .from("listings")
      .select("id, listing_type, price, status, created_at, is_exclusive, exclusive_expiry, properties(address, customers(full_name))"),
    supabase.from("tasks").select("id, title, due_at, status, priority").eq("status", "open"),
    supabase
      .from("calendar_events")
      .select("id, title, event_type, starts_at, customers(full_name)")
      .gte("starts_at", nowIso)
      .lte("starts_at", weekAheadIso),
    supabase.from("agent_actions").select("customer_id, action_type").eq("status", "pending"),
    supabase.from("agent_memory").select("customer_id, agent_name, note"),
  ]);

  const prompt = buildPrompt({
    sops: sops as SopRule[],
    customers: customers ?? [],
    listings: listings ?? [],
    tasks: tasks ?? [],
    events: events ?? [],
    pendingActions: pendingActions ?? [],
    memories: memories ?? [],
  });

  let aiText: string;
  let provider: string;
  try {
    const result = await draftWithAi(prompt);
    aiText = result.text;
    provider = result.provider;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI call failed" },
      { status: 502 }
    );
  }

  let parsed: { actions: DraftedAction[] };
  try {
    parsed = parseAiJson(aiText);
  } catch {
    return NextResponse.json(
      { error: "AI response wasn't valid JSON", raw: aiText.slice(0, 500) },
      { status: 502 }
    );
  }

  const actions = Array.isArray(parsed.actions) ? parsed.actions : [];

  if (actions.length === 0) {
    return NextResponse.json({ drafted: 0, provider, message: "Nothing currently matches your SOPs." });
  }

  const rows = actions.map((a) => ({
    agent_name: a.target_agent,
    action_type: a.action_type,
    customer_id: a.customer_id || null,
    draft_content: a.draft_content,
    status: "pending" as const,
  }));

  const { error: insertError } = await supabase.from("agent_actions").insert(rows);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ drafted: rows.length, provider });
}

function buildPrompt(data: {
  sops: SopRule[];
  customers: Record<string, unknown>[];
  listings: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  events: Record<string, unknown>[];
  pendingActions: Record<string, unknown>[];
  memories: Record<string, unknown>[];
}) {
  return `You are the Lead Agent for a Singapore property agent's CRM. You have a set of Standard Operating Procedures (SOPs) the agent configured, and a snapshot of their current data. Today's date/time is ${new Date().toISOString()}.

Your job: for each SOP, check whether any record in the data snapshot currently matches its trigger condition. If it does, draft the described action as a short, natural, ready-to-send message or note — written as if the agent is sending it themselves, no AI disclaimers.

Rules:
- Only draft an action for a genuine match. Do not force a match for every SOP.
- Do not draft an action for a customer+action_type combination that already appears in "Already pending" below — that one is still waiting for human review, don't duplicate it.
- If a customer has notes under "Existing memory," use them for context and continuity, don't contradict them.
- customer_id must be one of the real IDs listed below, or null if the action isn't tied to a specific customer.

Standing Instructions (SOPs):
${JSON.stringify(data.sops, null, 2)}

Customers:
${JSON.stringify(data.customers, null, 2)}

Listings:
${JSON.stringify(data.listings, null, 2)}

Open tasks:
${JSON.stringify(data.tasks, null, 2)}

Upcoming events (next 7 days):
${JSON.stringify(data.events, null, 2)}

Already pending in Approvals (do not duplicate):
${JSON.stringify(data.pendingActions, null, 2)}

Existing memory notes:
${JSON.stringify(data.memories, null, 2)}

Return ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{"actions": [{"sop_name": "string", "target_agent": "customer_agent|listing_agent|scheduling_agent|task_agent", "action_type": "string, e.g. whatsapp_followup", "customer_id": "uuid or null", "draft_content": "string"}]}

If nothing currently matches any SOP, return {"actions": []}.`;
}
