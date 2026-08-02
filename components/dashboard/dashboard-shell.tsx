"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, ShieldCheck } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";

export function DashboardShell({
  pendingApprovals,
  children,
}: {
  pendingApprovals: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* Mobile top bar — hidden at lg and above where the sidebar is static */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-navy px-4 py-3 text-white lg:hidden">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="p-1 text-white/80 hover:text-white"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brass font-mono text-[11px] font-semibold text-navy">
            PA
          </div>
          <span className="text-sm font-semibold">PropAgent</span>
        </div>

        <Link href="/dashboard/approvals" className="relative p-1 text-white/80 hover:text-white">
          <ShieldCheck size={20} />
          {pendingApprovals > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brass text-[10px] font-semibold text-navy">
              {pendingApprovals}
            </span>
          )}
        </Link>
      </div>

      {/* Backdrop for mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        pendingApprovals={pendingApprovals}
        open={open}
        onNavigate={() => setOpen(false)}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
