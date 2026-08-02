"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Home,
  ListChecks,
  Calendar,
  CheckSquare,
  ShieldCheck,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/properties", label: "Properties", icon: Home },
  { href: "/dashboard/listings", label: "Listings", icon: ListChecks },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
];

export function Sidebar({ pendingApprovals }: { pendingApprovals: number }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-navy text-white">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brass font-mono text-xs font-semibold text-navy">
          PA
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">PropAgent</p>
          <p className="text-[11px] leading-tight text-white/50">CRM Lite</p>
        </div>
      </div>

      {/* Agent activity signature */}
      <div className="mx-4 mb-4 flex items-center gap-2 rounded-md bg-white/5 px-3 py-2">
        <span className="agent-pulse h-2 w-2 rounded-full bg-brass" />
        <span className="text-[11px] text-white/70">
          Lead Agent watching SOPs
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}

        <Link
          href="/dashboard/approvals"
          className={cn(
            "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
            pathname.startsWith("/dashboard/approvals")
              ? "bg-white/10 text-white font-medium"
              : "text-white/60 hover:bg-white/5 hover:text-white"
          )}
        >
          <span className="flex items-center gap-3">
            <ShieldCheck size={16} />
            Approvals
          </span>
          {pendingApprovals > 0 && (
            <span className="rounded-full bg-brass px-2 py-0.5 text-[11px] font-semibold text-navy">
              {pendingApprovals}
            </span>
          )}
        </Link>
      </nav>

      <button
        onClick={handleSignOut}
        className="mx-3 mb-5 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </aside>
  );
}
