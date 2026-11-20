"use client";

import React, { useEffect } from "react";
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
  X,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  ready?: boolean;
}

export const navItems: NavItem[] = [
  { name: "Overview", href: "/", icon: LayoutDashboard, ready: true },
  { name: "Address Validator", href: "/validator", icon: ShieldCheck, badge: "ZIP-316", ready: true },
  { name: "Payment Builder", href: "/builder", icon: QrCode, badge: "ZIP-321", ready: true },
  { name: "Wallet Compatibility", href: "/wallets", icon: Wallet, badge: "Dapp SDK", ready: true },
  { name: "Scenario Simulator", href: "/scenarios", icon: FlaskConical, badge: "State Machine", ready: true },
  { name: "Webhook Workbench", href: "/webhooks", icon: Webhook, badge: "HMAC-SHA256", ready: true },
  { name: "Integration Report", href: "/reports", icon: FileCheck2, ready: false },
  { name: "Merchant Config", href: "/settings", icon: Settings2, ready: false },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    if (onClose) onClose();
  }, [pathname]);

  const sidebarContent = (
    <aside className="w-64 border-r border-surface-border bg-surface flex flex-col shrink-0 h-full">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-surface-border">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center text-white shadow-md shadow-primary-950/40 border border-primary-500/40 group-hover:border-primary-400 transition-colors">
            <Anvil className="w-4 h-4 text-primary-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 tracking-tight text-sm font-sans group-hover:text-white transition-colors">
                Zec<span className="text-primary-400">Forge</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-primary-300 border border-surface-border font-medium">
                v0.1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Build · Test · Verify · Shield</p>
          </div>
        </Link>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold flex items-center justify-between">
          <span>Workbench Modules</span>
          <span className="text-[9px] text-slate-600 font-normal">Testnet v1</span>
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const isEnabled = item.ready !== false;

          return isEnabled ? (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all relative",
                isActive
                  ? "bg-primary-600/15 text-primary-200 border border-primary-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-surface-elevated/70"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-primary-400" : "text-slate-500 group-hover:text-slate-400"
                  )}
                />
                <span className="tracking-tight">{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors",
                    isActive
                      ? "bg-primary-950/80 text-primary-300 border-primary-800/60"
                      : "bg-surface-elevated text-slate-500 border-surface-border group-hover:text-slate-400"
                  )}
                >
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary-500 rounded-r" />
              )}
            </Link>
          ) : (
            <div
              key={item.name}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 cursor-not-allowed select-none"
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-slate-700" />
                <span className="tracking-tight">{item.name}</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle text-slate-600 border border-surface-border/40">
                Roadmap
              </span>
            </div>
          );
        })}
      </nav>

      {/* Safety & Protocol Footer */}
      <div className="p-4 border-t border-surface-border bg-surface-subtle/40 text-[11px] space-y-3">
        <div className="flex items-start gap-2.5 text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1 shrink-0 animate-pulse" />
          <div className="space-y-0.5">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
              <Lock className="w-3 h-3 text-emerald-400" />
              Testnet Isolated
            </p>
            <p className="text-[10px] text-slate-500 leading-tight">
              Viewing-only boundary. Zero private spending keys handled.
            </p>
          </div>
        </div>

        <div className="pt-2.5 border-t border-surface-border/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>Zcash India Build</span>
          <a
            href="https://zips.z.cash"
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

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <div className="hidden md:block h-screen sticky top-0 z-30">{sidebarContent}</div>

      {/* Mobile Drawer with Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
