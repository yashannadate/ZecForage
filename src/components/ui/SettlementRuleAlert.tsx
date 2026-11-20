import React from "react";
import { Info, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettlementRuleAlertProps {
  title?: string;
  description?: string;
  variant?: "info" | "warning";
  className?: string;
}

export function SettlementRuleAlert({
  title = "The Merchant Settlement Rule",
  description = "A wallet transaction submission (txid) does not equal confirmed merchant receipt. Note decryption must occur independently via an incoming viewing key scanner on the merchant backend with canonical confirmation accumulation.",
  variant = "info",
  className,
}: SettlementRuleAlertProps) {
  const isWarning = variant === "warning";

  return (
    <div
      className={cn(
        "rounded-xl border p-4 flex items-start gap-3.5 text-xs transition-colors",
        isWarning
          ? "border-amber-900/60 bg-amber-950/20 text-amber-200"
          : "border-primary-900/50 bg-gradient-to-r from-primary-950/30 via-surface to-surface-elevated text-slate-300",
        className
      )}
    >
      {isWarning ? (
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      ) : (
        <Info className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
      )}
      <div className="space-y-1 leading-relaxed">
        <h3 className="font-semibold text-slate-200">{title}</h3>
        <p className="text-slate-400">{description}</p>
      </div>
    </div>
  );
}
