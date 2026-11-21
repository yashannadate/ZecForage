"use client";

import React, { useState, useMemo } from "react";
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
} from "@/lib/reports/generator";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettlementRuleAlert } from "@/components/ui/SettlementRuleAlert";
import { cn } from "@/lib/utils";

export default function IntegrationReportPage() {
  const [copied, setCopied] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>("all");

  // Generate the report data
  const report = useMemo(() => generateIntegrationReport(), []);
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
        badge="Integration Readiness Audit · Phase 7"
        badgeIcon={FileCheck2}
        title="Integration Audit Report"
        description="Consolidated, reproducible technical compliance audit verifying address validation, ZIP-321 generation, wallet compatibility, scenario reconciliation, and HMAC webhook security."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-border text-slate-300 hover:text-white border border-surface-border text-xs font-mono transition-colors shadow-sm"
              title="Download GitHub Flavored Markdown report"
            >
              <FileText className="w-3.5 h-3.5 text-primary-400" />
              <span>Export .MD</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-border text-slate-300 hover:text-white border border-surface-border text-xs font-mono transition-colors shadow-sm"
              title="Download structured JSON report"
            >
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export .JSON</span>
            </button>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-border text-slate-300 hover:text-white border border-surface-border text-xs font-mono transition-colors"
              title="Copy JSON to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
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
      <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
                Overall Readiness
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                {report.overall.overallStatus} (SANDBOX ONLY)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-slate-400 border border-surface-border">
                {report.overall.targetNetwork}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Generated: <span className="font-mono text-slate-300">{report.meta.generatedAtIso}</span> · Checks:{" "}
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
          <div className="p-3.5 rounded-lg bg-surface-elevated border border-surface-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase">Tier 1: Unit Tests</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                PASS (80/80)
              </span>
            </div>
            <div className="text-slate-200 font-semibold text-xs">Automated Suites</div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Vitest address, builder, wallet, scenario, and HMAC test suites passing.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-elevated border border-surface-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase">Tier 2: Simulators</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                PASS (SIMULATED)
              </span>
            </div>
            <div className="text-slate-200 font-semibold text-xs">Offline FSM & RPC</div>
            <p className="text-[10px] text-slate-400 leading-tight">
              8 reconciliation states, BigInt zatoshis, and Dapp SDK provider emulator.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-elevated border border-surface-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase">Tier 3: Device Tests</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                WARNING
              </span>
            </div>
            <div className="text-slate-200 font-semibold text-xs">Manual Air-Gapped</div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Zodl mobile scanning requires manual physical device checklist confirmation.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-elevated border border-surface-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 uppercase">Tier 4: On-Chain</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                NOT VERIFIED
              </span>
            </div>
            <div className="text-slate-200 font-semibold text-xs">Live Chain Scanner</div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Backend viewing-key note decryption not implemented in current version.
            </p>
          </div>
        </div>
      </div>

      {/* Module Audits Grid */}
      <div className="space-y-6">
        {/* Section 1: Address Validation */}
        <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-primary-400" />
              <h2 className="text-sm font-semibold text-slate-200 font-mono">
                1. Receiving Address Validation Audit
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              {report.addressValidation.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-surface-elevated border border-surface-border">
              <span className="text-[10px] text-slate-500 uppercase block">Standard</span>
              <span className="text-slate-300 font-semibold">{report.addressValidation.standard}</span>
            </div>
            <div className="p-2.5 rounded bg-surface-elevated border border-surface-border">
              <span className="text-[10px] text-slate-500 uppercase block">Sample Checked</span>
              <span className="text-slate-300 truncate block">{report.addressValidation.sampleTested}</span>
            </div>
            <div className="p-2.5 rounded bg-surface-elevated border border-surface-border">
              <span className="text-[10px] text-slate-500 uppercase block">Type & Network</span>
              <span className="text-slate-300 capitalize">
                {report.addressValidation.detectedType} ({report.addressValidation.detectedNetwork})
              </span>
            </div>
            <div className="p-2.5 rounded bg-surface-elevated border border-surface-border">
              <span className="text-[10px] text-slate-500 uppercase block">Shielded & Memo</span>
              <span className="text-emerald-400">Supported (Max 512B)</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border text-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
              Validation Tier Limitations (Preliminary Format Check Only)
            </span>
            <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
              {report.addressValidation.limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 2: ZIP-321 Builder */}
        <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2.5">
              <QrCode className="w-4 h-4 text-primary-400" />
              <h2 className="text-sm font-semibold text-slate-200 font-mono">
                2. ZIP-321 Payment Request Audit
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              {report.zip321.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-surface-elevated border border-surface-border">
              <span className="text-[10px] text-slate-500 uppercase block">Single-Recipient</span>
              <span className="text-emerald-400 font-semibold">✓ Compliant</span>
            </div>
            <div className="p-2.5 rounded bg-surface-elevated border border-surface-border">
              <span className="text-[10px] text-slate-500 uppercase block">Zatoshi Precision</span>
              <span className="text-emerald-400 font-semibold">✓ 8 Decimals Max</span>
            </div>
            <div className="p-2.5 rounded bg-surface-elevated border border-surface-border">
              <span className="text-[10px] text-slate-500 uppercase block">Base64url Memo</span>
              <span className="text-emerald-400 font-semibold">✓ Unpadded</span>
            </div>
            <div className="p-2.5 rounded bg-surface-elevated border border-surface-border">
              <span className="text-[10px] text-slate-500 uppercase block">Transparent Memo</span>
              <span className="text-emerald-400 font-semibold">✓ Strict Rejection</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border text-xs space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-semibold block">
              Canonical Generated URI Output
            </span>
            <div className="p-2 rounded bg-surface border border-surface-border font-mono text-[11px] text-slate-300 break-all select-all">
              {report.zip321.uriBuilt}
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Scope: {report.zip321.supportedSubsetDescription}
            </p>
          </div>
        </div>

        {/* Section 3: Wallet Compatibility */}
        <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2.5">
              <Wallet className="w-4 h-4 text-primary-400" />
              <h2 className="text-sm font-semibold text-slate-200 font-mono">
                3. Wallet Compatibility Audit (Zucchini & Zodl)
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
              DUAL TARGET
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Zucchini Card */}
            <div className="p-4 rounded-lg bg-surface-elevated border border-surface-border space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-primary-400" /> Zucchini (Browser Extension)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {report.walletCompatibility.zucchini.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Standard: {report.walletCompatibility.zucchini.standard}
              </p>
              <div className="space-y-1 text-[11px] text-slate-300 pt-1 border-t border-surface-border/60">
                <div className="flex justify-between">
                  <span>Provider Discovery:</span>
                  <span className="text-emerald-400">EIP-1193 Verified</span>
                </div>
                <div className="flex justify-between">
                  <span>Contract Dispatch:</span>
                  <span className="text-emerald-400">requestPayment(uri)</span>
                </div>
                <div className="flex justify-between">
                  <span>Provider Emulation:</span>
                  <span className="text-slate-400">Virtual Provider Active</span>
                </div>
              </div>
            </div>

            {/* Zodl Card */}
            <div className="p-4 rounded-lg bg-surface-elevated border border-surface-border space-y-2.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Zodl (Mobile / Zashi)
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                  {report.walletCompatibility.zodl.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Standard: {report.walletCompatibility.zodl.standard}
              </p>
              <div className="space-y-1 text-[11px] text-slate-300 pt-1 border-t border-surface-border/60">
                <div className="flex justify-between">
                  <span>Browser Injected:</span>
                  <span className="text-rose-400 font-bold">FALSE (Air-gapped)</span>
                </div>
                <div className="flex justify-between">
                  <span>QR & Deep Link:</span>
                  <span className="text-emerald-400">Generated (zcash:...)</span>
                </div>
                <div className="flex justify-between">
                  <span>Device Verification:</span>
                  <span className="text-amber-400 capitalize">{report.walletCompatibility.zodl.manualTestStatus}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Payment Scenario Engine */}
        <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2.5">
              <FlaskConical className="w-4 h-4 text-primary-400" />
              <h2 className="text-sm font-semibold text-slate-200 font-mono">
                4. Payment Scenario Engine Audit
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              {report.paymentScenario.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            {report.paymentScenario.statesCovered.map((s) => (
              <div key={s} className="p-2 rounded bg-surface-elevated border border-surface-border flex items-center justify-between">
                <span className="text-slate-300">{s}</span>
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Arithmetic Precision:</span>
              <span className="text-slate-200 font-semibold">{report.paymentScenario.arithmeticPrecision}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Exception Precedence:</span>
              <span className="text-emerald-400 font-semibold">Enforced (Sticky exceptions block auto-fulfillment)</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Reorg Drop Recovery:</span>
              <span className="text-emerald-400 font-semibold">Tested (Transitions to reorg_review and back)</span>
            </div>
          </div>
        </div>

        {/* Section 5: Webhook Security */}
        <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <div className="flex items-center gap-2.5">
              <Webhook className="w-4 h-4 text-primary-400" />
              <h2 className="text-sm font-semibold text-slate-200 font-mono">
                5. HMAC-SHA256 Webhook Security Audit
              </h2>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
              {report.webhookSecurity.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-surface-elevated border border-surface-border">
              <span className="text-[10px] text-slate-500 uppercase block">HMAC-SHA256</span>
              <span className="text-emerald-400 font-semibold">✓ Validated</span>
            </div>
            <div className="p-2.5 rounded bg-surface-elevated border border-surface-border">
              <span className="text-[10px] text-slate-500 uppercase block">Replay Window</span>
              <span className="text-emerald-400 font-semibold">✓ 300s Tolerance</span>
            </div>
            <div className="p-2.5 rounded bg-surface-elevated border border-surface-border">
              <span className="text-[10px] text-slate-500 uppercase block">timingSafeEqual</span>
              <span className="text-emerald-400 font-semibold">✓ Constant-Time</span>
            </div>
            <div className="p-2.5 rounded bg-surface-elevated border border-surface-border">
              <span className="text-[10px] text-slate-500 uppercase block">Secret Isolation</span>
              <span className="text-emerald-400 font-semibold">✓ Server-Only</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border text-xs space-y-1 font-mono">
            <span className="text-[10px] uppercase text-slate-500 font-semibold block">
              Deduplication Persistence Limitation Note
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {report.webhookSecurity.persistenceLimitationNote}
            </p>
          </div>
        </div>

        {/* Section 6: Production Readiness Checklist */}
        <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h2 className="text-sm font-semibold text-slate-200 font-mono">
              6. Production Readiness Checklist
            </h2>
            <span className="text-xs text-slate-500 font-mono">8 Core Requirements</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-surface-border text-slate-500 text-[11px]">
                  <th className="pb-2">Architecture Requirement</th>
                  <th className="pb-2 text-center">ZecForge Status</th>
                  <th className="pb-2">Production Implementation Requirement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {report.productionReadinessChecklist.map((item, idx) => (
                  <tr key={idx} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-2.5 font-semibold text-slate-200">{item.requirement}</td>
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
                    <td className="py-2.5 text-slate-400 text-[11px]">{item.productionRequirement}</td>
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
