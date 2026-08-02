import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Defensive: table may not exist yet if the SQL schema hasn't been run.
  let pendingApprovals = 0;
  try {
    const { count } = await supabase
      .from("agent_actions")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");
    pendingApprovals = count ?? 0;
  } catch {
    pendingApprovals = 0;
  }

  return (
    <DashboardShell pendingApprovals={pendingApprovals}>
      {children}
    </DashboardShell>
  );
}
