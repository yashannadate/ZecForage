"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Layers,
  ArrowRightLeft,
  Sparkles,
  Lock,
} from "lucide-react";
import { inspectAddress, type AddressInspection } from "@/lib/zcash/addresses";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettlementRuleAlert } from "@/components/ui/SettlementRuleAlert";
import { saveWorkbenchState } from "@/lib/settings/store";
import { cn } from "@/lib/utils";

const SAMPLE_FIXTURES = [
  {
    name: "Unified Testnet",
    address:
      "utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  },
  {
    name: "Sapling Testnet",
    address:
      "ztestsapling1000000000000000000000000000000000000000000000000000000000000000000000000000",
  },
  {
    name: "Transparent Testnet",
    address: "tm9iMLAuYMzJ6kWYEqQCzNhpW9gSnhmXv2X",
  },
  {
    name: "Mainnet Mismatch",
    address: "t1VpYagocmrPfBqLdwwkDej8sJ1zL84gQeY",
  },
];

export default function AddressValidatorPage() {
  const [addressInput, setAddressInput] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const inspection: AddressInspection | null = useMemo(
    () => (addressInput.length > 0 ? inspectAddress(addressInput, "testnet") : null),
    [addressInput]
  );

  useEffect(() => {
    if (inspection && inspection.isValidFormat && inspection.networkMatch) {
      saveWorkbenchState({
        lastTestedAddress: inspection.trimmed,
        lastTestedNetwork: "testnet",
      });
    }
  }, [inspection]);

  const handleCopy = () => {
    if (!addressInput) return;
    navigator.clipboard.writeText(addressInput.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        badge="ZIP-316 & ZIP-32 · Zcash Testnet Only"
        badgeIcon={ShieldCheck}
        title="Receiving Address Validator"
        description="Inspect Unified (utest1), Sapling (ztestsapling1), and Transparent (tm/t2) Testnet structures and detect network mismatches."
        actions={
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#080808] border border-[#262626] text-xs text-[#929292] font-mono uppercase tracking-wider">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Format Check Only</span>
          </span>
        }
      />

      <SettlementRuleAlert
        title="Preliminary Structural Check (Testnet Only)"
        description="Validates address prefixes, character sets (Bech32m/Base58), and length bounds against Zcash Testnet. Does not verify polynomial checksums, curve points, or on-chain existence."
      />

      <div className="border border-[#262626] bg-[#080808] rounded-lg p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#262626]">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#929292]">
            <span className="w-2 h-2 rounded-full bg-cyan-300" />
            <span>Target Network: Zcash Testnet</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-[#929292] font-mono uppercase tracking-wider flex items-center gap-1.5 mr-1">
              <Sparkles className="w-4 h-4 text-cyan-300" /> Samples:
            </span>
            {SAMPLE_FIXTURES.map((fix) => (
              <button
                key={fix.name}
                type="button"
                onClick={() => setAddressInput(fix.address)}
                className="min-h-9 text-sm font-medium px-3 py-1 rounded-md bg-black hover:bg-neutral-900 border border-[#262626] text-[#929292] hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                {fix.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="address-input" className="text-sm font-medium text-white">
              Testnet Address
            </label>
            {addressInput.length > 0 && (
              <button
                type="button"
                onClick={() => setAddressInput("")}
                className="min-h-8 px-2.5 rounded-md text-sm font-medium text-[#929292] hover:text-white transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="relative">
            <textarea
              id="address-input"
              rows={3}
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Paste a Zcash Testnet address (utest1..., ztestsapling1..., tm..., t2...)..."
              className="w-full bg-black border border-[#262626] rounded-md p-3 pr-12 text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-cyan-300 resize-none leading-relaxed"
            />
            {addressInput.length > 0 && (
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-3 bottom-3 min-h-9 min-w-9 flex items-center justify-center rounded-md border border-[#262626] bg-[#080808] hover:bg-neutral-900 text-[#929292] hover:text-white transition-colors"
                aria-label="Copy address"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {inspection ? (
          <div className="pt-4 border-t border-[#262626] space-y-4">
            <div
              className={cn(
                "p-4 rounded-lg border flex items-start gap-3 text-sm",
                inspection.isValidFormat && inspection.networkMatch
                  ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                  : !inspection.networkMatch && inspection.isValidFormat
                  ? "bg-amber-950/20 border-amber-800/40 text-amber-300"
                  : "bg-rose-950/20 border-rose-800/40 text-rose-300"
              )}
            >
              {inspection.isValidFormat && inspection.networkMatch ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : !inspection.networkMatch && inspection.isValidFormat ? (
                <ArrowRightLeft className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}

              <div className="space-y-1">
                <div className="font-medium text-white">
                  {inspection.isValidFormat && inspection.networkMatch
                    ? "Preliminary Format Check Passed"
                    : !inspection.networkMatch && inspection.isValidFormat
                    ? "Network Mismatch Detected"
                    : "Invalid Address Structure"}
                </div>
                <p className="text-sm text-[#929292]">
                  {inspection.isValidFormat && inspection.networkMatch
                    ? `Matches structural rules for ${inspection.addressType.toUpperCase()} on TESTNET.`
                    : !inspection.networkMatch && inspection.isValidFormat
                    ? `Formatted for ${inspection.detectedNetwork.toUpperCase()}, but this workbench is locked to Zcash TESTNET.`
                    : inspection.errors[0] || "Structural check failed."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-md bg-black border border-[#262626] space-y-1">
                <span className="text-[#929292] uppercase block">Type</span>
                <div className="text-white capitalize flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-300" />
                  {inspection.addressType}
                </div>
              </div>

              <div className="p-3 rounded-md bg-black border border-[#262626] space-y-1">
                <span className="text-[#929292] uppercase block">Network</span>
                <div className="text-white capitalize">{inspection.detectedNetwork}</div>
              </div>

              <div className="p-3 rounded-md bg-black border border-[#262626] space-y-1">
                <span className="text-[#929292] uppercase block">Pool</span>
                <div className={inspection.isShielded ? "text-emerald-400 flex items-center gap-1" : "text-amber-400 flex items-center gap-1"}>
                  {inspection.isShielded ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  {inspection.isShielded ? "Shielded" : "Unshielded"}
                </div>
              </div>

              <div className="p-3 rounded-md bg-black border border-[#262626] space-y-1">
                <span className="text-[#929292] uppercase block">Memo</span>
                <div className={inspection.isShielded ? "text-emerald-400" : "text-rose-400"}>
                  {inspection.isShielded ? "Yes (Max 512B)" : "Forbidden"}
                </div>
              </div>
            </div>

            {inspection.warnings.length > 0 && (
              <div className="p-3.5 rounded-md bg-amber-950/20 border border-amber-800/40 space-y-1 text-sm">
                <div className="font-medium text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Merchant Advisory
                </div>
                <ul className="list-disc list-inside text-sm text-[#929292] space-y-0.5">
                  {inspection.warnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-md bg-black border border-[#262626] text-center text-sm text-[#929292]">
            Select a Testnet fixture or paste an address to inspect structure.
          </div>
        )}
      </div>
    </div>
  );
}
