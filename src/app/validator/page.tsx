"use client";

import React, { useState } from "react";
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
  Info,
} from "lucide-react";
import { inspectAddress, type ZcashNetwork, type AddressInspection } from "@/lib/zcash/addresses";
import { cn } from "@/lib/utils";

const SAMPLE_FIXTURES = [
  {
    name: "Unified Testnet",
    network: "testnet" as ZcashNetwork,
    type: "unified",
    address:
      "utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  },
  {
    name: "Sapling Testnet",
    network: "testnet" as ZcashNetwork,
    type: "sapling",
    address:
      "ztestsapling1000000000000000000000000000000000000000000000000000000000000000000000000000",
  },
  {
    name: "Transparent Testnet",
    network: "testnet" as ZcashNetwork,
    type: "transparent",
    address: "tm9iMLAuYMzJ6kWYEqQCzNhpW9gSnhmXv2X",
  },
  {
    name: "Unified Mainnet",
    network: "mainnet" as ZcashNetwork,
    type: "unified",
    address:
      "u1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  },
  {
    name: "Mismatch (Mainnet in Testnet)",
    network: "testnet" as ZcashNetwork,
    type: "mismatch",
    address: "t1VpYagocmrPfBqLdwwkDej8sJ1zL84gQeY",
  },
];

export default function AddressValidatorPage() {
  const [network, setNetwork] = useState<ZcashNetwork>("testnet");
  const [addressInput, setAddressInput] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const inspection: AddressInspection | null = addressInput.length > 0 ? inspectAddress(addressInput, network) : null;

  const handleCopy = () => {
    if (!addressInput) return;
    navigator.clipboard.writeText(addressInput.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadFixture = (addr: string, net: ZcashNetwork) => {
    setNetwork(net);
    setAddressInput(addr);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="border border-surface-border bg-surface rounded-xl p-6 relative overflow-hidden">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-primary-950 text-primary-300 border border-primary-800/60 text-xs font-mono font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            ZIP-316 & ZIP-32 Specification Audit
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100">
            Receiving Address Validator
          </h1>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            Validate Zcash address structures across Unified, Sapling, and Transparent formats. Detect network prefix mismatches, unshielded exposure risks, and memo compatibility constraints.
          </p>
        </div>
      </div>

      {/* Verification Tier Disclaimer Callout */}
      <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border flex items-start gap-3">
        <Info className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h2 className="font-semibold text-slate-200">Validation Tier: Preliminary Structural & Network Check</h2>
          <p className="text-slate-400 leading-relaxed">
            This module executes deterministic prefix and charset validation. In compliance with protocol safety standards, a format pass does <strong>not</strong> prove cryptographic curve point validity (e.g. Pallas/Jubjub decompression) or active UTXO existence. Full validation requires node RPC or lightwalletd scanning.
          </p>
        </div>
      </div>

      {/* Main Validation Card */}
      <div className="border border-surface-border bg-surface rounded-xl p-6 space-y-6">
        {/* Network & Fixtures Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          {/* Network Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Target Network:</span>
            <div className="inline-flex rounded-lg bg-surface-elevated p-1 border border-surface-border text-xs font-mono">
              <button
                type="button"
                onClick={() => setNetwork("testnet")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors",
                  network === "testnet"
                    ? "bg-primary-600 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                Testnet
              </button>
              <button
                type="button"
                onClick={() => setNetwork("mainnet")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors",
                  network === "mainnet"
                    ? "bg-primary-600 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                Mainnet
              </button>
            </div>
          </div>

          {/* Quick Fixture Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mr-1">
              <Sparkles className="w-3 h-3 text-primary-400" /> Samples:
            </span>
            {SAMPLE_FIXTURES.map((fix) => (
              <button
                key={fix.name}
                type="button"
                onClick={() => loadFixture(fix.address, fix.network)}
                className="text-[10px] font-mono px-2 py-1 rounded bg-surface-elevated hover:bg-primary-950 hover:text-primary-300 border border-surface-border hover:border-primary-800 transition-colors text-slate-400"
              >
                {fix.name}
              </button>
            ))}
          </div>
        </div>

        {/* Address Input Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="address-input" className="text-xs font-semibold text-slate-200">
              Zcash Address to Inspect
            </label>
            {addressInput.length > 0 && (
              <button
                type="button"
                onClick={() => setAddressInput("")}
                className="text-[11px] text-slate-500 hover:text-slate-300 font-mono"
              >
                Clear input
              </button>
            )}
          </div>
          <div className="relative">
            <textarea
              id="address-input"
              rows={3}
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Paste any Unified (u1/utest1), Sapling (zs1/ztestsapling1), or Transparent (t1/tm) address..."
              className="w-full bg-surface-subtle border border-surface-border focus:border-primary-500 rounded-lg p-3 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all resize-none"
            />
            {addressInput.length > 0 && (
              <button
                type="button"
                onClick={handleCopy}
                className="absolute right-3 bottom-3 p-1.5 rounded-md bg-surface-elevated hover:bg-surface-border text-slate-400 hover:text-slate-200 transition-colors"
                title="Copy address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Character count: {addressInput.trim().length}</span>
            <span>Charset: Bech32m / Base58</span>
          </div>
        </div>

        {/* Results Panel */}
        {inspection && (
          <div className="pt-4 border-t border-surface-border space-y-4">
            {/* Status Summary Banner */}
            <div
              className={cn(
                "p-4 rounded-lg border flex items-start gap-3 text-xs",
                inspection.isValidFormat && inspection.networkMatch
                  ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-300"
                  : !inspection.networkMatch && inspection.isValidFormat
                  ? "bg-amber-950/20 border-amber-800/40 text-amber-300"
                  : "bg-red-950/20 border-red-800/40 text-red-300"
              )}
            >
              {inspection.isValidFormat && inspection.networkMatch ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : !inspection.networkMatch && inspection.isValidFormat ? (
                <ArrowRightLeft className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}

              <div className="space-y-1">
                <div className="font-semibold text-sm">
                  {inspection.isValidFormat && inspection.networkMatch
                    ? "Preliminary Format Check Passed"
                    : !inspection.networkMatch && inspection.isValidFormat
                    ? "Network Mismatch Detected"
                    : "Invalid Address Structure"}
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  {inspection.isValidFormat && inspection.networkMatch
                    ? `Matches the structural rules for ${inspection.addressType.toUpperCase()} on ${inspection.detectedNetwork.toUpperCase()}.`
                    : !inspection.networkMatch && inspection.isValidFormat
                    ? `Address is structurally formatted for ${inspection.detectedNetwork.toUpperCase()}, but current target network is ${network.toUpperCase()}.`
                    : inspection.errors[0] || "Structural check failed."}
                </p>
              </div>
            </div>

            {/* Diagnostic Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500">Address Type</span>
                <div className="font-semibold text-slate-200 capitalize flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary-400" />
                  {inspection.addressType}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500">Detected Network</span>
                <div className="font-semibold text-slate-200 capitalize flex items-center gap-1.5">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      inspection.detectedNetwork === "testnet" ? "bg-emerald-400" : "bg-primary-400"
                    )}
                  />
                  {inspection.detectedNetwork}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500">Shielded Pool</span>
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  {inspection.isShielded ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Shielded
                    </span>
                  ) : (
                    <span className="text-amber-400 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Unshielded
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500">Memo Supported</span>
                <div className="font-semibold text-slate-200">
                  {inspection.isShielded ? (
                    <span className="text-emerald-400">Yes (Max 512B)</span>
                  ) : (
                    <span className="text-red-400">No (Forbidden)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Warnings or Invariants Callout */}
            {inspection.warnings.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 space-y-1 text-xs">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Merchant Advisory
                </div>
                <ul className="list-disc list-inside text-[11px] text-amber-200/80 space-y-0.5">
                  {inspection.warnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

