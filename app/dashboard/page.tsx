import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RunAgentButton } from "@/components/dashboard/run-agent-button";
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

  // This server runs in UTC on Vercel, but "today" and "tomorrow" need to
  // mean Singapore's calendar day, not UTC's — otherwise anything scheduled
  // before 8am SGT gets bucketed into the wrong day. en-CA gives a plain
  // YYYY-MM-DD string, which we then anchor explicitly to +08:00.
  function sgDateString(date: Date): string {
    return date.toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
  }

  const now = new Date();
  const todaySG = sgDateString(now);
  const tomorrowSG = sgDateString(new Date(now.getTime() + 86400000));

  const startOfDay = new Date(`${todaySG}T00:00:00+08:00`).toISOString();
  const endOfDay = new Date(`${todaySG}T23:59:59.999+08:00`).toISOString();
  const startOfTomorrow = new Date(`${tomorrowSG}T00:00:00+08:00`).toISOString();
  const endOfTomorrow = new Date(`${tomorrowSG}T23:59:59.999+08:00`).toISOString();
  const nowIso = now.toISOString();

  const [todaysEvents, openTasks, pendingApprovals, pipelineCount] =
    await Promise.all([
      safeCount(supabase, "calendar_events", (q) =>
        q.gte("starts_at", startOfDay).lte("starts_at", endOfDay)
      ),
      safeCount(supabase, "tasks", (q) => q.eq("status", "open")),
      safeCount(supabase, "agent_actions", (q) => q.eq("status", "pending")),
      safeCount(supabase, "customers", (q) => q.not("status", "in", "(closed,lost)")),
    ]);

  let overdueTasks: { id: string; title: string; due_at: string }[] = [];
  let todaysAppointments: { id: string; title: string; starts_at: string }[] = [];
  let tomorrowsAppointments: { id: string; title: string; starts_at: string }[] = [];
  try {
    const { data } = await supabase
      .from("tasks")
      .select("id, title, due_at")
      .eq("status", "open")
      .lt("due_at", nowIso)
      .order("due_at", { ascending: true })
      .limit(3);
    overdueTasks = data ?? [];
  } catch {
    overdueTasks = [];
  }
  try {
    const { data } = await supabase
      .from("calendar_events")
      .select("id, title, starts_at")
      .gte("starts_at", startOfDay)
      .lte("starts_at", endOfDay)
      .order("starts_at", { ascending: true })
      .limit(3);
    todaysAppointments = data ?? [];
  } catch {
    todaysAppointments = [];
  }
  try {
    const { data } = await supabase
      .from("calendar_events")
      .select("id, title, starts_at")
      .gte("starts_at", startOfTomorrow)
      .lte("starts_at", endOfTomorrow)
      .order("starts_at", { ascending: true })
      .limit(3);
    tomorrowsAppointments = data ?? [];
  } catch {
    tomorrowsAppointments = [];
  }

  let commissionPipeline = { potential: 0, likely: 0, earned: 0 };
  try {
    const { data } = await supabase
      .from("listings")
      .select("price, status, commission_rate, commission_amount")
      .not("status", "eq", "withdrawn");
    for (const l of data ?? []) {
      const commission =
        l.commission_amount != null
          ? l.commission_amount
          : l.commission_rate != null && l.price != null
            ? (l.price * l.commission_rate) / 100
            : 0;
      if (l.status === "closed") commissionPipeline.earned += commission;
      else if (l.status === "under_offer") commissionPipeline.likely += commission;
      else commissionPipeline.potential += commission;
    }
  } catch {
    commissionPipeline = { potential: 0, likely: 0, earned: 0 };
  }

  const activeSopCount = await safeCount(supabase, "sop_rules", (q) => q.eq("is_active", true));

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="p-5">
          <p className="mb-3 text-xs font-medium uppercase text-attention">
            Overdue tasks
          </p>
          {overdueTasks.length > 0 ? (
            <ul className="space-y-2">
              {overdueTasks.map((t) => (
                <li key={t.id} className="text-sm text-ink">
                  {t.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">Nothing overdue.</p>
          )}
          <Link
            href="/dashboard/tasks"
            className="mt-3 inline-block text-xs text-brass-dark underline"
          >
            View all tasks
          </Link>
        </Card>

        <Card className="p-5">
          <p className="mb-3 text-xs font-medium uppercase text-ink-soft">
            Today&apos;s appointments
          </p>
          {todaysAppointments.length > 0 ? (
            <ul className="space-y-2">
              {todaysAppointments.map((e) => (
                <li key={e.id} className="flex justify-between text-sm text-ink">
                  <span>{e.title}</span>
                  <span className="text-ink-soft">
                    {new Date(e.starts_at).toLocaleTimeString("en-SG", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "Asia/Singapore",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">Nothing scheduled today.</p>
          )}
          <Link
            href="/dashboard/calendar"
            className="mt-3 inline-block text-xs text-brass-dark underline"
          >
            View calendar
          </Link>
        </Card>

        <Card className="p-5">
          <p className="mb-3 text-xs font-medium uppercase text-ink-soft">
            Tomorrow&apos;s appointments
          </p>
          {tomorrowsAppointments.length > 0 ? (
            <ul className="space-y-2">
              {tomorrowsAppointments.map((e) => (
                <li key={e.id} className="flex justify-between text-sm text-ink">
                  <span>{e.title}</span>
                  <span className="text-ink-soft">
                    {new Date(e.starts_at).toLocaleTimeString("en-SG", {
                      hour: "numeric",
                      minute: "2-digit",
                      timeZone: "Asia/Singapore",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">Nothing scheduled yet.</p>
          )}
          <Link
            href="/dashboard/calendar"
            className="mt-3 inline-block text-xs text-brass-dark underline"
          >
            View calendar
          </Link>
        </Card>
      </div>

      {(commissionPipeline.potential > 0 ||
        commissionPipeline.likely > 0 ||
        commissionPipeline.earned > 0) && (
        <Card className="p-6">
          <h2 className="mb-4 text-sm font-semibold text-ink">Commission pipeline</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase text-ink-soft">Potential</p>
              <p className="mt-1 text-xl font-semibold text-ink">
                {new Intl.NumberFormat("en-SG", {
                  style: "currency",
                  currency: "SGD",
                  maximumFractionDigits: 0,
                }).format(commissionPipeline.potential)}
              </p>
              <p className="text-xs text-ink-soft">Draft &amp; active listings</p>
            </div>
            <div>
              <p className="text-xs uppercase text-pending">Likely</p>
              <p className="mt-1 text-xl font-semibold text-ink">
                {new Intl.NumberFormat("en-SG", {
                  style: "currency",
                  currency: "SGD",
                  maximumFractionDigits: 0,
                }).format(commissionPipeline.likely)}
              </p>
              <p className="text-xs text-ink-soft">Under offer</p>
            </div>
            <div>
              <p className="text-xs uppercase text-success">Earned</p>
              <p className="mt-1 text-xl font-semibold text-ink">
                {new Intl.NumberFormat("en-SG", {
                  style: "currency",
                  currency: "SGD",
                  maximumFractionDigits: 0,
                }).format(commissionPipeline.earned)}
              </p>
              <p className="text-xs text-ink-soft">Closed listings</p>
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Lead Agent</h2>
          <Badge tone="info">Draft-only mode</Badge>
        </div>
        <p className="mb-4 text-sm text-ink-soft">
          Checks your{" "}
          <Link href="/dashboard/sops" className="text-brass-dark underline">
            standing instructions
          </Link>{" "}
          against your current customers, listings, and tasks, and drafts
          anything that matches into{" "}
          <Link href="/dashboard/approvals" className="text-brass-dark underline">
            Approvals
          </Link>
          . Nothing is ever sent automatically — you run it, you review it.
        </p>
        <RunAgentButton hasActiveSops={activeSopCount > 0} />
      </Card>
    </div>
  );
}
