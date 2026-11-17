"use client";

import React, { useEffect, useState } from "react";
import { Activity, Shield, Wallet2, CheckCircle2, AlertTriangle } from "lucide-react";

export function Header() {
  const [walletStatus, setWalletStatus] = useState<"checking" | "detected" | "not_detected">("checking");
  const [testnetHeight, setTestnetHeight] = useState<number>(2749210);

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

    // Increment simulated testnet block counter periodically
    const interval = setInterval(() => {
      setTestnetHeight((prev) => prev + 1);
    }, 75000); // Zcash 75s block target

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-surface-border bg-surface/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Environment Badge & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-elevated border border-surface-border text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">Zcash Testnet</span>
          <span className="text-slate-500 text-[11px]">#{testnetHeight.toLocaleString()}</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Activity className="w-3.5 h-3.5 text-primary-400" />
          <span>Scanner Latency: <strong className="text-slate-300 font-mono">1.2s</strong></span>
        </div>
      </div>

      {/* Right: Wallet Status & Security Guard */}
      <div className="flex items-center gap-3">
        {/* Wallet Discovery Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs">
          <Wallet2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">Wallet:</span>
          {walletStatus === "detected" ? (
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Zucchini Ready
            </span>
          ) : (
            <span className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
              <AlertTriangle className="w-3 h-3 text-amber-500" /> No Ext Detected
            </span>
          )}
        </div>

        {/* Security Rule Pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-medium">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Viewing-Only Boundary Enforced</span>
        </div>
      </div>
    </header>
  );
}

