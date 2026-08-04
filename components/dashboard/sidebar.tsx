"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/ui/logo";
import {
  LayoutDashboard,
  Users,
  Home,
  ListChecks,
  Calendar,
  CheckSquare,
  ClipboardList,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/properties", label: "Properties", icon: Home },
  { href: "/dashboard/listings", label: "Listings", icon: ListChecks },
  { href: "/dashboard/activities", label: "Activities", icon: ClipboardList },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/tasks", label: "Tasks", icon: CheckSquare },
];

export function Sidebar({
  pendingApprovals,
  open,
  onNavigate,
}: {
  pendingApprovals: number;
  open: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    onNavigate();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-screen w-72 -translate-x-full flex-col bg-navy text-white transition-transform duration-200 ease-out",
        "lg:static lg:w-60 lg:translate-x-0 lg:border-r lg:border-border",
        open && "translate-x-0"
      )}
    >
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white p-1">
            <LogoMark className="h-full w-full" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">PropAgent</p>
            <p className="text-[11px] leading-tight text-white/50">CRM Lite</p>
          </div>
        </div>
        <button
          onClick={onNavigate}
          aria-label="Close menu"
          className="text-white/60 hover:text-white lg:hidden"
        >
          <X size={20} />
        </button>
      </div>

      {/* Agent activity signature */}
      <div className="mx-4 mb-4 flex items-center gap-2 rounded-md bg-white/5 px-3 py-2">
        <span className="agent-pulse h-2 w-2 rounded-full bg-brass" />
        <span className="text-[11px] text-white/70">
          Lead Agent watching SOPs
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
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
          onClick={onNavigate}
          className={cn(
            "flex items-center justify-between rounded-md px-3 py-2.5 text-sm transition-colors",
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
        className="mx-3 mb-5 flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white"
      >
        <LogOut size={16} />
        Sign out
      </button>
    </aside>
  );
}
