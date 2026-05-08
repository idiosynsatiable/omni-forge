"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Control Plane", icon: "⚡" },
  { href: "/apps", label: "App Fleet", icon: "🚀" },
  { href: "/marketplace", label: "Marketplace", icon: "🏪" },
  { href: "/revenue", label: "Revenue Intel", icon: "💰" },
  { href: "/deploy", label: "Deploy Center", icon: "📦" },
  { href: "/agents", label: "Agent Swarm", icon: "🤖" },
  { href: "/validation", label: "Validation Gate", icon: "🔬" },
];

export default function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-forge-bg text-forge-text flex">
      <aside className="w-64 bg-forge-surface border-r border-forge-border flex flex-col">
        <div className="p-5 border-b border-forge-border">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-lg font-bold bg-gradient-to-r from-forge-cyan to-forge-violet bg-clip-text text-transparent">
              Omni-Forge
            </span>
          </Link>
          <p className="text-xs text-forge-muted mt-1">Phase 3 — Autonomous Foundry</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  active
                    ? "bg-forge-cyan/10 text-forge-cyan border border-forge-cyan/20"
                    : "text-forge-muted hover:text-forge-text hover:bg-forge-border/50"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-forge-border">
          <div className="text-xs text-forge-muted">
            <p>Omni-Forge Phase 3</p>
            <p className="text-forge-cyan/60 mt-1">Micro-SaaS Command Center</p>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
