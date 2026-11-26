"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  QrCode,
  Wallet,
  FlaskConical,
  Webhook,
  ShieldCheck,
  FileCheck2,
  Settings2,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

export const navItems: NavItem[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "ZIP-321 Builder", href: "/builder", icon: QrCode },
  { name: "Wallet Compatibility", href: "/wallets", icon: Wallet },
  { name: "Scenario Simulator", href: "/scenarios", icon: FlaskConical },
  { name: "Webhook Workbench", href: "/webhooks", icon: Webhook },
];

export const secondaryNavItems: NavItem[] = [
  { name: "Address Validator", href: "/validator", icon: ShieldCheck, badge: "ZIP-316" },
  { name: "Audit Report", href: "/reports", icon: FileCheck2 },
  { name: "Merchant Config", href: "/settings", icon: Settings2 },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const prevPathnameRef = useRef<string>(pathname);

  // Close mobile drawer only when route actually changes
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (onClose) onClose();
    }
  }, [pathname, onClose]);

  const sidebarContent = (
    <aside className="w-60 border-r border-[#262626] bg-[#080808] flex flex-col shrink-0 h-full">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#262626]">
        <Link href="/" className="flex items-center gap-2.5 group" title="Return to Landing Page">
          <svg width="24" height="26" viewBox="0 0 28 30" fill="none" aria-hidden="true" className="group-hover:opacity-80 transition-opacity duration-200">
            <path d="M5 5h19L6 25h18M12 0v5m5 20v5M2 15h24" stroke="white" strokeWidth="2.7" />
          </svg>
          <span className="font-medium text-white tracking-tight text-base font-sans">
            ZecForage
          </span>
        </Link>

        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[#262626] bg-black text-[#929292] hover:text-white transition-colors duration-200"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Primary Navigation: Overview + 4 Developer Tools */}
      <nav aria-label="Workbench navigation" className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-2.5 pb-2 text-xs font-mono uppercase tracking-wider text-[#929292] font-normal">
          Workspace
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex min-h-10 items-center justify-between px-2.5 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                isActive
                  ? "bg-neutral-900 text-white border border-[#262626]"
                  : "text-[#929292] hover:text-white hover:bg-neutral-900/50 border border-transparent"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors duration-200",
                    isActive ? "text-cyan-300" : "text-[#929292] group-hover:text-white"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </div>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shrink-0" />}
            </Link>
          );
        })}

        {/* Compact secondary utilities */}
        <div className="pt-4 mt-4 border-t border-[#262626] space-y-1">
          <div className="px-2.5 pb-1.5 text-xs font-mono uppercase tracking-wider text-[#929292] font-normal">
            Reference
          </div>
          {secondaryNavItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex min-h-9 items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                  isActive
                    ? "bg-neutral-900 text-white border border-[#262626]"
                    : "text-[#929292] hover:text-white hover:bg-neutral-900/50 border border-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0 transition-colors duration-200",
                    isActive ? "text-cyan-300" : "text-[#929292] group-hover:text-white"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Compact Footer */}
      <div className="p-3 border-t border-[#262626] bg-black space-y-2.5">
        <div className="px-2.5 py-2 rounded-md border border-[#262626] bg-[#080808] text-xs font-mono text-[#929292]">
          <span className="text-white block">Viewing-only sandbox</span>
          <span>No private keys stored</span>
        </div>

        <div className="flex items-center justify-between px-1 text-xs text-[#929292] font-mono">
          <Link href="/" className="hover:text-white transition-colors duration-200">
            ← Home
          </Link>
          <a
            href="https://zips.z.cash"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-white transition-colors duration-200"
          >
            ZIPs <ExternalLink className="w-4 h-4" />
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-200"
            onClick={onClose}
          />
          <div className="relative z-10 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
