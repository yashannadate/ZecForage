"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Activity, Shield, Wallet2, CheckCircle2, AlertTriangle, Menu } from "lucide-react";
import { navItems } from "./Sidebar";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const pathname = usePathname();
  const [walletStatus, setWalletStatus] = useState<"checking" | "detected" | "not_detected">("checking");
  const [testnetHeight, setTestnetHeight] = useState<number>(2749210);

  // Active module breadcrumb
  const currentNav = navItems.find((n) => n.href === pathname);
  const pageTitle = currentNav?.name || "Developer Workbench";

  useEffect(() => {
    // SSR-safe wallet provider check
    if (typeof window !== "undefined") {
      try {
        const hasZucchini = !!(window as unknown as { zucchini?: unknown }).zucchini;
        setWalletStatus(hasZucchini ? "detected" : "not_detected");
      } catch {
        setWalletStatus("not_detected");
      }
    }

    // Increment simulated testnet block counter periodically (Zcash 75s target)
    const interval = setInterval(() => {
      setTestnetHeight((prev) => prev + 1);
    }, 75000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-surface-border bg-surface/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-surface-elevated transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs font-mono text-slate-500">ZecForge</span>
          <span className="hidden sm:inline-block text-slate-600 text-xs">/</span>
          <h2 className="text-xs sm:text-sm font-semibold text-slate-200 tracking-tight">
            {pageTitle}
          </h2>
        </div>

        {currentNav?.badge && (
          <span className="hidden md:inline-flex text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-slate-400 border border-surface-border">
            {currentNav.badge}
          </span>
        )}
      </div>

      {/* Right: Environment Badge & Wallet Guard */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Network & Block Height */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-elevated border border-surface-border text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="hidden sm:inline text-slate-300 font-medium">Testnet</span>
          <span className="text-slate-400 text-[11px]">#{testnetHeight.toLocaleString()}</span>
        </div>

        {/* Scanner Latency (Desktop only) */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-400 font-medium font-mono px-2 py-1 rounded bg-surface-elevated/50 border border-surface-border/50">
          <Activity className="w-3.5 h-3.5 text-primary-400" />
          <span>Scanner: <strong className="text-slate-300">1.2s</strong></span>
        </div>

        {/* Wallet Discovery Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated border border-surface-border text-xs">
          <Wallet2 className="w-3.5 h-3.5 text-slate-400" />
          {walletStatus === "detected" ? (
            <span className="flex items-center gap-1 text-emerald-400 font-medium text-[11px]">
              <CheckCircle2 className="w-3 h-3" /> Zucchini
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
              <AlertTriangle className="w-3 h-3 text-amber-500/80" /> Ext Offline
            </span>
          )}
        </div>

        {/* Security Rule Pill (Desktop only) */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-[11px] font-mono">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Viewing-Only Isolated</span>
        </div>
      </div>
    </header>
  );
}
