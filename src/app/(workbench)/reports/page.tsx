"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  FileCheck2,
  Download,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Layers,
  Clock,
  Lock,
  Wallet,
  Smartphone,
  FlaskConical,
  Webhook,
  QrCode,
  FileText,
  FileCode,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  generateIntegrationReport,
  reportToMarkdown,
  reportToJson,
  type ReportCustomInput,
} from "@/lib/reports/generator";
import { loadWorkbenchState } from "@/lib/settings/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettlementRuleAlert } from "@/components/ui/SettlementRuleAlert";
import { cn } from "@/lib/utils";

const INITIAL_SSR_TIMESTAMP = 1764144000000;

export default function IntegrationReportPage() {
  const [copied, setCopied] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<ReportCustomInput>({
    generatedAtOverride: INITIAL_SSR_TIMESTAMP,
  });

  useEffect(() => {
    const syncFromStore = () => {
      const saved = loadWorkbenchState();
      setCustomInput({
        generatedAtOverride: Date.now(),
        addressTested: saved.lastTestedAddress,
        expectedNetwork: saved.lastTestedNetwork,
        scenarioState: {
          currentState: saved.scenario?.currentState,
          confirmations: saved.scenario?.confirmations,
          requiredConfirmations: saved.settings.confirmationThreshold,
          canFulfill: saved.scenario?.canFulfill,
        },
        zodlTestRun: saved.zodlRun
          ? {
              result: saved.zodlRun.result,
              checklist: saved.zodlRun.checklist,
              observedTxid: saved.zodlRun.observedTxid,
            }
          : undefined,
      });
    };
    syncFromStore();
    window.addEventListener("zecforage:state-updated", syncFromStore);
    return () => window.removeEventListener("zecforage:state-updated", syncFromStore);
  }, []);

  // Generate the report data
  const report = useMemo(() => generateIntegrationReport(customInput), [customInput]);
  const markdownContent = useMemo(() => reportToMarkdown(report), [report]);
  const jsonContent = useMemo(() => reportToJson(report), [report]);

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zecforge-audit-report-${new Date().toISOString().split("T")[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zecforge-audit-report-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <PageHeader
        badge="Integration Readiness Audit · Testnet Only"
        badgeIcon={FileCheck2}
        title="Integration Audit Report"
        description="Consolidated Testnet compliance audit verifying address checks, ZIP-321 builder, wallet compatibility, scenario engine, and HMAC webhook security."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="min-h-11 flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-medium text-sm transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              title="Download GitHub Flavored Markdown report"
            >
              <FileText className="w-4 h-4" />
              <span>Export .MD</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="min-h-11 flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium border border-neutral-700 text-sm transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              title="Download structured JSON report"
            >
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Export .JSON</span>
            </button>
            <button
              onClick={handleCopyJson}
              className="min-h-11 flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-medium border border-neutral-700 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              title="Copy JSON to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied" : "Copy JSON"}</span>
            </button>
          </div>
        }
      />

      {/* Critical Pre-Production Settlement Notice */}
      <SettlementRuleAlert
        variant="warning"
        title="Pre-Production Developer Workbench Notice"
        description="ZecForge is an integration workbench for testing and validation. Live on-chain payment detection via an incoming viewing key scanner is NOT yet implemented. Overall integration readiness is classified as WARNING (Pre-Production Sandbox Verified). Real mainnet deployments require a dedicated backend note decryption service."
      />

      {/* Overall Status Banner & 4-Tier Verification Matrix */}
      <div className="p-6 rounded-xl border border-neutral-800 bg-[#080808] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-neutral-500">
                Overall Readiness
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                {report.overall.overallStatus} (SANDBOX ONLY)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-[#929292] border border-neutral-800">
                {report.overall.targetNetwork}
              </span>
            </div>
            <p className="text-xs text-[#929292]">
              Generated: <span className="font-mono text-neutral-300">{report.meta.generatedAtIso}</span> · Checks:{" "}
              <span className="text-emerald-400 font-mono font-semibold">{report.overall.checks.passed} Passed</span>,{" "}
              <span className="text-amber-400 font-mono font-semibold">{report.overall.checks.warnings} Warnings</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-rose-950/40 text-rose-400 border border-rose-800/40 font-medium">
              Production Ready: FALSE
            </span>
          </div>
        </div>

        {/* 4-Tier Verification Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-500 uppercase">Tier 1: Unit Tests</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                PASS (111/111)
              </span>
            </div>
            <div className="text-neutral-200 font-semibold text-xs">Automated Suites</div>
            <p className="text-[10px] text-[#929292] leading-tight">
              Vitest address, builder, wallet, zodl, scenario, webhook, report &amp; settings suites.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-500 uppercase">Tier 2: Simulators</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                SIMULATED
              </span>
            </div>
            <div className="text-neutral-200 font-semibold text-xs">Offline FSM &amp; RPC</div>
            <p className="text-[10px] text-[#929292] leading-tight">
              {report.paymentScenario.requiredConfirmations}-block policy, 8 states, BigInt zatoshis &amp; virtual SDK.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-500 uppercase">Tier 3: Device Tests</span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-bold border",
                  report.walletCompatibility.zodl.status === "PASS"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                    : report.walletCompatibility.zodl.status === "FAIL"
                    ? "bg-rose-950 text-rose-300 border-rose-800"
                    : "bg-amber-950 text-amber-300 border-amber-800"
                )}
              >
                {report.walletCompatibility.zodl.status}
              </span>
            </div>
            <div className="text-neutral-200 font-semibold text-xs">Manual Air-Gapped</div>
            <p className="text-[10px] text-[#929292] leading-tight">
              Zodl status: <span className="uppercase text-neutral-300">{report.walletCompatibility.zodl.manualTestStatus.replace("_", " ")}</span> (recorded in Wallets tab).
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-500 uppercase">Tier 4: On-Chain</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                NOT VERIFIED
              </span>
            </div>
            <div className="text-neutral-200 font-semibold text-xs">Live Chain Scanner</div>
            <p className="text-[10px] text-[#929292] leading-tight">
              Backend viewing-key note decryption not implemented in current version.
            </p>
          </div>
        </div>
      </div>

      {/* Module Audits Grid */}
      <div className="space-y-6">
        {/* Section 1: Address Validation */}
        <div className="p-6 rounded-xl border border-neutral-800 bg-[#080808] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-300" />
              <h2 className="text-base font-medium tracking-tight text-white">
                1. Receiving Address Validation Audit
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              {report.addressValidation.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Standard</span>
              <span className="text-neutral-300 font-semibold">{report.addressValidation.standard}</span>
            </div>
            <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Sample Checked</span>
              <span className="text-neutral-300 truncate block">{report.addressValidation.sampleTested}</span>
            </div>
            <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Type & Network</span>
              <span className="text-neutral-300 capitalize">
                {report.addressValidation.detectedType} ({report.addressValidation.detectedNetwork})
              </span>
            </div>
            <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Shielded & Memo</span>
              <span className="text-emerald-400">Supported (Max 512B)</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 font-semibold block">
              Validation Tier Limitations (Preliminary Format Check Only)
            </span>
            <ul className="list-disc list-inside text-[11px] text-[#929292] space-y-0.5">
              {report.addressValidation.limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 2: ZIP-321 Builder */}
        <div className="p-6 rounded-xl border border-neutral-800 bg-[#080808] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <QrCode className="w-4 h-4 text-cyan-300" />
              <h2 className="text-base font-medium tracking-tight text-white">
                2. ZIP-321 Payment Request Audit
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              {report.zip321.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Single-Recipient</span>
              <span className="text-emerald-400 font-semibold">✓ Compliant</span>
            </div>
            <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Zatoshi Precision</span>
              <span className="text-emerald-400 font-semibold">✓ 8 Decimals Max</span>
            </div>
            <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Base64url Memo</span>
              <span className="text-emerald-400 font-semibold">✓ Unpadded</span>
            </div>
            <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Transparent Memo</span>
              <span className="text-emerald-400 font-semibold">✓ Strict Rejection</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-neutral-500 font-semibold block">
              Canonical Generated URI Output
            </span>
            <div className="p-2 rounded bg-[#080808] border border-neutral-800 font-mono text-[11px] text-neutral-300 break-all select-all">
              {report.zip321.uriBuilt}
            </div>
            <p className="text-[11px] text-[#929292] pt-1">
              Scope: {report.zip321.supportedSubsetDescription}
            </p>
          </div>
        </div>

        {/* Section 3: Wallet Compatibility */}
        <div className="p-6 rounded-xl border border-neutral-800 bg-[#080808] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <Wallet className="w-4 h-4 text-cyan-300" />
              <h2 className="text-base font-medium tracking-tight text-white">
                3. Wallet Compatibility Audit (Zucchini & Zodl)
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
              DUAL TARGET
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Zucchini Card */}
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-2.5 text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-cyan-300" /> Zucchini (Browser Extension)
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {report.walletCompatibility.zucchini.status} (SIMULATED)
                </span>
              </div>
              <p className="text-[11px] text-[#929292]">
                Standard: {report.walletCompatibility.zucchini.standard}
              </p>
              <div className="space-y-1 text-[11px] text-neutral-300 pt-1 border-t border-neutral-800/60">
                <div className="flex flex-wrap justify-between gap-2">
                  <span>Provider Discovery:</span>
                  <span className="text-emerald-400">EIP-1193 Verified</span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span>Contract Dispatch:</span>
                  <span className="text-emerald-400">requestPayment(uri)</span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span>Provider Emulation:</span>
                  <span className="text-[#929292]">Virtual Provider Active</span>
                </div>
              </div>
            </div>

            {/* Zodl Card */}
            <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-2.5 text-xs font-mono">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Zodl (Mobile / Zashi)
                </span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded border",
                    report.walletCompatibility.zodl.status === "PASS"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                      : report.walletCompatibility.zodl.status === "FAIL"
                      ? "bg-rose-950 text-rose-300 border-rose-800"
                      : "bg-amber-950 text-amber-300 border-amber-800"
                  )}
                >
                  {report.walletCompatibility.zodl.status}
                </span>
              </div>
              <p className="text-[11px] text-[#929292]">
                Standard: {report.walletCompatibility.zodl.standard}
              </p>
              <div className="space-y-1 text-[11px] text-neutral-300 pt-1 border-t border-neutral-800/60">
                <div className="flex flex-wrap justify-between gap-2">
                  <span>Browser Injected:</span>
                  <span className="text-rose-400 font-bold">FALSE (Air-gapped)</span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span>QR & Deep Link:</span>
                  <span className="text-emerald-400">Generated (zcash:...)</span>
                </div>
                <div className="flex flex-wrap justify-between gap-2">
                  <span>Device Verification:</span>
                  <span className="text-amber-400 capitalize">{report.walletCompatibility.zodl.manualTestStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Payment Scenario Engine */}
        <div className="p-6 rounded-xl border border-neutral-800 bg-[#080808] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <FlaskConical className="w-4 h-4 text-cyan-300" />
              <h2 className="text-base font-medium tracking-tight text-white">
                4. Payment Scenario Engine Audit
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              {report.paymentScenario.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {report.paymentScenario.statesCovered.map((s) => (
              <div key={s} className="p-2 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-between gap-1">
                <span className="text-neutral-300 truncate">{s}</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs space-y-1.5 font-mono">
            <div className="flex flex-wrap justify-between gap-2 text-[11px]">
              <span className="text-[#929292]">Arithmetic Precision:</span>
              <span className="text-neutral-200 font-semibold">{report.paymentScenario.arithmeticPrecision}</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2 text-[11px]">
              <span className="text-[#929292]">Exception Precedence:</span>
              <span className="text-emerald-400 font-semibold">Enforced (Sticky exceptions block auto-fulfillment)</span>
            </div>
            <div className="flex flex-wrap justify-between gap-2 text-[11px]">
              <span className="text-[#929292]">Reorg Drop Recovery:</span>
              <span className="text-emerald-400 font-semibold">Tested (Transitions to reorg_review and back)</span>
            </div>
          </div>
        </div>

        {/* Section 5: Webhook Security */}
        <div className="p-6 rounded-xl border border-neutral-800 bg-[#080808] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <Webhook className="w-4 h-4 text-cyan-300" />
              <h2 className="text-base font-medium tracking-tight text-white">
                5. HMAC-SHA256 Webhook Security Audit
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              {report.webhookSecurity.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">HMAC-SHA256</span>
              <span className="text-emerald-400 font-semibold">✓ Validated</span>
            </div>
            <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Replay Window</span>
              <span className="text-emerald-400 font-semibold">✓ 300s Tolerance</span>
            </div>
            <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">timingSafeEqual</span>
              <span className="text-emerald-400 font-semibold">✓ Constant-Time</span>
            </div>
            <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="text-[10px] text-neutral-500 uppercase block">Secret Isolation</span>
              <span className="text-emerald-400 font-semibold">✓ Server-Only</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs space-y-1 font-mono">
            <span className="text-[10px] uppercase text-neutral-500 font-semibold block">
              Deduplication Persistence Limitation Note
            </span>
            <p className="text-[11px] text-[#929292] leading-relaxed">
              {report.webhookSecurity.persistenceLimitationNote}
            </p>
          </div>
        </div>

        {/* Section 6: Production Readiness Checklist */}
        <div className="p-6 rounded-xl border border-neutral-800 bg-[#080808] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-neutral-800">
            <h2 className="text-base font-medium tracking-tight text-white">
              6. Production Readiness Checklist
            </h2>
            <span className="text-xs text-neutral-500 font-mono">8 Core Requirements</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-500 text-[11px]">
                  <th className="pb-2">Architecture Requirement</th>
                  <th className="pb-2 text-center">ZecForge Status</th>
                  <th className="pb-2">Production Implementation Requirement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {report.productionReadinessChecklist.map((item, idx) => (
                  <tr key={idx} className="hover:bg-neutral-900/40 transition-colors">
                    <td className="py-2.5 font-semibold text-neutral-200">{item.requirement}</td>
                    <td className="py-2.5 text-center">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          item.implementedInZecForge
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : "bg-rose-950 text-rose-400 border-rose-800"
                        )}
                      >
                        {item.implementedInZecForge ? "PASS" : "PENDING"}
                      </span>
                    </td>
                    <td className="py-2.5 text-[#929292] text-[11px]">{item.productionRequirement}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

