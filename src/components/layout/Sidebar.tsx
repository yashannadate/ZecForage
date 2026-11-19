"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShieldCheck,
  QrCode,
  Wallet,
  FlaskConical,
  Webhook,
  FileCheck2,
  Settings2,
  Anvil,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  ready?: boolean;
}

const navItems: NavItem[] = [
  { name: "Overview", href: "/", icon: LayoutDashboard, ready: true },
  { name: "Address Validator", href: "/validator", icon: ShieldCheck, badge: "ZIP-316", ready: true },
  { name: "Payment Request Builder", href: "/builder", icon: QrCode, badge: "ZIP-321", ready: true },
  { name: "Wallet Compatibility", href: "/wallets", icon: Wallet, badge: "Dapp SDK", ready: true },
  { name: "Payment Scenarios", href: "/scenarios", icon: FlaskConical, badge: "State Machine", ready: true },
  { name: "Webhook Testing", href: "/webhooks", icon: Webhook, ready: false },
  { name: "Integration Report", href: "/reports", icon: FileCheck2, ready: false },
  { name: "Merchant Config", href: "/settings", icon: Settings2, ready: false },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-surface-border bg-surface flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-surface-border gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary-900/30 border border-primary-500/30">
          <Anvil className="w-4 h-4 text-primary-200" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-100 tracking-tight text-sm font-sans">
              Zec<span className="text-primary-400">Forge</span>
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary-950 text-primary-300 border border-primary-800/60 font-semibold">
              v0.1.0
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium font-mono">Build · Test · Verify</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
          Testbench Suite
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary-600/15 text-primary-300 border border-primary-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={cn("w-4 h-4", isActive ? "text-primary-400" : "text-slate-500")} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle text-slate-400 border border-surface-border">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Safety Notice Footer */}
      <div className="p-4 border-t border-surface-border bg-surface-subtle/50 text-[11px]">
        <div className="flex items-start gap-2 text-slate-400">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 animate-pulse" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-300">Testnet Isolated</p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              No private spending keys or seed phrases are ever handled.
            </p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-surface-border/60 flex items-center justify-between text-[10px] text-slate-500">
          <span>Zcash India Build</span>
          <a
            href="https://z.cash"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-primary-400 transition-colors"
          >
            ZIPs <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </aside>
  );
}

