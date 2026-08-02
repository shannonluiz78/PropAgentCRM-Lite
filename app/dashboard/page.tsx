import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { CalendarClock, CheckSquare, ShieldCheck, TrendingUp } from "lucide-react";

type Supabase = Awaited<ReturnType<typeof createClient>>;
type CountQuery = ReturnType<Supabase["from"]>["select"] extends (
  ...args: infer _A
) => infer R
  ? R
  : never;
type CountFilter = (q: CountQuery) => CountQuery;

async function safeCount(supabase: Supabase, table: string, filters?: CountFilter) {
  try {
    let q = supabase.from(table).select("*", { count: "exact", head: true }) as CountQuery;
    if (filters) q = filters(q);
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  const [todaysEvents, openTasks, pendingApprovals, pipelineCount] =
    await Promise.all([
      safeCount(supabase, "calendar_events", (q) =>
        q.gte("starts_at", startOfDay).lte("starts_at", endOfDay)
      ),
      safeCount(supabase, "tasks", (q) => q.eq("status", "open")),
      safeCount(supabase, "agent_actions", (q) => q.eq("status", "pending")),
      safeCount(supabase, "customers", (q) => q.not("status", "in", "(closed,lost)")),
    ]);

  const stats = [
    {
      label: "Today's appointments",
      value: todaysEvents,
      icon: CalendarClock,
      href: "/dashboard/calendar",
    },
    {
      label: "Open tasks",
      value: openTasks,
      icon: CheckSquare,
      href: "/dashboard/tasks",
    },
    {
      label: "Awaiting your approval",
      value: pendingApprovals,
      icon: ShieldCheck,
      href: "/dashboard/approvals",
      highlight: pendingApprovals > 0,
    },
    {
      label: "Active pipeline",
      value: pipelineCount,
      icon: TrendingUp,
      href: "/dashboard/customers",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-soft">
          Your day at a glance. Agents draft below — nothing goes out without you.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href, highlight }) => (
          <Link key={label} href={href}>
            <Card
              className={`p-5 transition-shadow hover:shadow-md ${
                highlight ? "border-brass/60 bg-brass/5" : ""
              }`}
            >
              <Icon
                size={18}
                className={highlight ? "text-brass-dark" : "text-ink-soft"}
              />
              <p className="mt-3 text-2xl font-semibold text-ink">{value}</p>
              <p className="text-xs text-ink-soft">{label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">AI Assistant</h2>
          <Badge tone="info">Draft-only mode</Badge>
        </div>
        <p className="text-sm text-ink-soft">
          The Lead Agent is set up but has no SOPs yet — it won&apos;t take any
          action until you add your first rule. Once active, anything it
          drafts for a customer (a WhatsApp reply, a listing description,
          a reminder) will show up under{" "}
          <Link href="/dashboard/approvals" className="text-brass-dark underline">
            Approvals
          </Link>{" "}
          for you to approve, edit, or reject — never sent automatically.
        </p>
      </Card>
    </div>
  );
}
