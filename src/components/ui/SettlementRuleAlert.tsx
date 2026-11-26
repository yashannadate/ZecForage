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
        "rounded-xl border border-neutral-800 bg-[#080808] p-4 sm:p-5 flex items-start gap-3.5 text-xs text-neutral-300 transition-colors",
        isWarning && "border-amber-900/40 bg-amber-950/10",
        className
      )}
    >
      {isWarning ? (
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-cyan-300 shrink-0 mt-1 animate-pulse" />
      )}
      <div className="space-y-1">
        <h3 className="font-medium tracking-tight text-white text-sm">{title}</h3>
        <p className="text-[#929292] font-normal leading-relaxed text-sm">{description}</p>
      </div>
    </div>
  );
}
