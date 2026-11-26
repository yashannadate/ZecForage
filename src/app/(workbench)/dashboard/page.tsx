"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  FileText,
  FlaskConical,
  QrCode,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Trash2,
  Wallet,
  Webhook,
} from "lucide-react";
import {
  InlineToolWorkspace,
  type InlineToolId,
} from "@/components/dashboard/InlineToolWorkspace";
import {
  DEFAULT_CHECKLIST,
  appendWorkbenchActivity,
  loadWorkbenchState,
  saveWorkbenchState,
  type OnboardingChecklistState,
  type WorkbenchActivityItem,
} from "@/lib/settings/store";
import { CONFIRMATION_THRESHOLD_DEFAULT, deriveConfirmationPolicy } from "@/lib/settings/types";
import { discoverZucchiniProvider } from "@/lib/zcash/wallet";
import { cn } from "@/lib/utils";

const QUICKSTART_SNIPPET = `zcash:utest1qqqqqq...qqq?amount=0.05&memo=b3JkZXJfMTA0Mg`;

const DEVELOPER_TOOLS: {
  id: InlineToolId;
  title: string;
  badge: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}[] = [
  {
    id: "builder",
    title: "ZIP-321 Builder",
    badge: "LOCAL URI",
    description: "Generate structured payment URIs, base64url memos, and QR payloads.",
    icon: QrCode,
    href: "/builder",
  },
  {
    id: "wallets",
    title: "Wallet Compatibility",
    badge: "SIMULATED / QR",
    description: "Test Zucchini Dapp SDK handoff or air-gapped Zodl QR workflows.",
    icon: Wallet,
    href: "/wallets",
  },
  {
    id: "scenarios",
    title: "Scenario Simulator",
    badge: "SIMULATED FSM",
    description: "Replay confirmations, underpayments, overpayments, expiry, and reorgs.",
    icon: FlaskConical,
    href: "/scenarios",
  },
  {
    id: "webhooks",
    title: "Webhook Workbench",
    badge: "LOCAL API",
    description: "Dispatch and verify HMAC-SHA256 webhooks with replay protection.",
    icon: Webhook,
    href: "/webhooks",
  },
];

const CHECKLIST_ITEMS: {
  key: keyof OnboardingChecklistState;
  step: string;
  title: string;
  detail: string;
  tool: InlineToolId;
}[] = [
  {
    key: "step1",
    step: "01",
    title: "Build & copy a ZIP-321 payment request",
    detail: "Construct a testnet URI with 8-decimal zatoshi precision and base64url memo.",
    tool: "builder",
  },
  {
    key: "step2",
    step: "02",
    title: "Simulate wallet handoff & block confirmations",
    detail: "Run the offline Zucchini simulator or confirmation state machine without live funds.",
    tool: "scenarios",
  },
  {
    key: "step3",
    step: "03",
    title: "Verify signed HMAC-SHA256 webhook delivery",
    detail: "Dispatch an event to the local reference receiver and inspect signature verification.",
    tool: "webhooks",
  },
];

export default function DashboardOverview() {
  const [activeTool, setActiveTool] = useState<InlineToolId | null>(null);
  const [checklist, setChecklist] = useState<OnboardingChecklistState>(DEFAULT_CHECKLIST);
  const [recentActivity, setRecentActivity] = useState<WorkbenchActivityItem[]>([]);
  const [threshold, setThreshold] = useState<number>(CONFIRMATION_THRESHOLD_DEFAULT);
  const [extensionDetected, setExtensionDetected] = useState<boolean | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  useEffect(() => {
    const syncState = () => {
      const saved = loadWorkbenchState();
      setChecklist(saved.checklist);
      setRecentActivity(saved.recentActivity);
      setThreshold(saved.settings.confirmationThreshold);
    };
    syncState();
    setExtensionDetected(Boolean(discoverZucchiniProvider()));
    window.addEventListener("zecforage:state-updated", syncState);
    return () => window.removeEventListener("zecforage:state-updated", syncState);
  }, []);

  const completedCount = [checklist.step1, checklist.step2, checklist.step3].filter(Boolean).length;
  const policy = deriveConfirmationPolicy(threshold);

  const handleToggleStep = (key: keyof OnboardingChecklistState, label: string) => {
    const nextVal = !checklist[key];
    const updated = { ...checklist, [key]: nextVal };
    setChecklist(updated);
    saveWorkbenchState({ checklist: updated });
    appendWorkbenchActivity({
      tool: "Onboarding",
      label: `${nextVal ? "Completed" : "Unchecked"}: ${label}`,
      kind: "local",
    });
  };

  const handleResetChecklist = () => {
    setChecklist(DEFAULT_CHECKLIST);
    saveWorkbenchState({ checklist: DEFAULT_CHECKLIST });
  };

  const handleClearActivity = () => {
    setRecentActivity([]);
    saveWorkbenchState({ recentActivity: [] });
  };

  const handleCopySnippet = async () => {
    try {
      await navigator.clipboard.writeText(QUICKSTART_SNIPPET);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
      appendWorkbenchActivity({
        tool: "Documentation",
        label: "Copied example ZIP-321 URI snippet",
        kind: "local",
      });
    } catch {
      setCopiedSnippet(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#262626] pb-5">
        <div className="space-y-1.5">
          <div className="text-xs font-mono uppercase tracking-wider text-[#929292]">
            Developer Onboarding · Local Browser Sandbox
          </div>
          <h1 className="text-[28px] sm:text-[30px] leading-tight font-medium tracking-tight text-white">
            ZecForage Workbench
          </h1>
          <p className="text-sm text-[#929292] leading-relaxed max-w-2xl">
            Build, simulate, and inspect Zcash merchant payment integrations locally. Progress saves only in this browser and does not connect to a live node.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTool("builder")}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black hover:bg-neutral-200 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span>Open Quick Builder</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            href="/reports"
            className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#262626] bg-transparent px-4 text-sm font-medium text-white hover:bg-neutral-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span>Audit Report</span>
          </Link>
        </div>
      </div>

      {/* Main Column + Narrow Right Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 space-y-6 min-w-0">
          {activeTool ? (
            <InlineToolWorkspace tool={activeTool} onBack={() => setActiveTool(null)} />
          ) : (
            <>
              {/* 1. Three-Step Onboarding Checklist */}
              <section
                aria-labelledby="onboarding-checklist-heading"
                className="rounded-lg border border-[#262626] bg-[#080808] p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262626]">
                  <div>
                    <h2
                      id="onboarding-checklist-heading"
                      className="text-base font-medium text-white tracking-tight"
                    >
                      Integration Checklist
                    </h2>
                    <p className="text-xs font-mono text-[#929292] mt-0.5">
                      Saved locally in browser · {completedCount}/3 completed
                    </p>
                  </div>
                  {completedCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetChecklist}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-[#262626] px-2.5 text-xs font-medium text-[#929292] hover:text-white hover:bg-neutral-900 transition-colors duration-200"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#262626]">
                  {CHECKLIST_ITEMS.map((item) => {
                    const checked = checklist[item.key];
                    return (
                      <div
                        key={item.key}
                        className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleStep(item.key, item.title)}
                          aria-pressed={checked}
                          className="flex items-start gap-3 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 rounded-md p-1 -m-1"
                        >
                          {checked ? (
                            <CheckCircle2 className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-5 h-5 text-[#929292] group-hover:text-white shrink-0 mt-0.5 transition-colors duration-200" />
                          )}
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-[#929292]">{item.step}</span>
                              <span
                                className={cn(
                                  "text-sm font-medium transition-colors duration-200",
                                  checked ? "text-[#929292] line-through" : "text-white"
                                )}
                              >
                                {item.title}
                              </span>
                            </div>
                            <p className="text-sm text-[#929292] leading-relaxed">{item.detail}</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTool(item.tool)}
                          className="shrink-0 inline-flex min-h-9 items-center justify-center rounded-md border border-[#262626] bg-transparent px-3 text-sm font-medium text-white hover:bg-neutral-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                        >
                          Open
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 2. 2x2 Tool Grid */}
              <section aria-labelledby="tool-grid-heading" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2
                    id="tool-grid-heading"
                    className="text-base font-medium text-white tracking-tight"
                  >
                    Developer Tools
                  </h2>
                  <span className="text-xs font-mono uppercase tracking-wider text-[#929292]">
                    Open inline or full view
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {DEVELOPER_TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <div
                        key={tool.id}
                        className="rounded-lg border border-[#262626] bg-[#080808] p-5 flex flex-col justify-between gap-4 hover:border-neutral-700 transition-colors duration-200"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="w-9 h-9 rounded-md border border-[#262626] bg-black flex items-center justify-center text-white">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-mono uppercase tracking-wider text-[#929292]">
                              {tool.badge}
                            </span>
                          </div>
                          <h3 className="text-base font-medium text-white tracking-tight">
                            {tool.title}
                          </h3>
                          <p className="text-sm text-[#929292] leading-relaxed">
                            {tool.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#262626]">
                          <button
                            type="button"
                            onClick={() => setActiveTool(tool.id)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-md bg-white px-3.5 text-sm font-medium text-black hover:bg-neutral-200 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                          >
                            <span>Open Tool</span>
                          </button>
                          <Link
                            href={tool.href}
                            className="inline-flex min-h-9 items-center gap-1 rounded-md border border-[#262626] px-3 text-sm font-medium text-[#929292] hover:text-white hover:bg-neutral-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                          >
                            <span>Full Page</span>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 3. Recent Activity (Honest Local Log) */}
              <section
                aria-labelledby="recent-activity-heading"
                className="rounded-lg border border-[#262626] bg-[#080808] p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262626]">
                  <div>
                    <h2
                      id="recent-activity-heading"
                      className="text-base font-medium text-white tracking-tight"
                    >
                      Recent Activity
                    </h2>
                    <p className="text-xs font-mono text-[#929292]">
                      Browser session log · No backend persistence
                    </p>
                  </div>
                  {recentActivity.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearActivity}
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-[#262626] px-2.5 text-xs font-medium text-[#929292] hover:text-white hover:bg-neutral-900 transition-colors duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                {recentActivity.length === 0 ? (
                  <p className="text-sm text-[#929292] py-2">
                    No local actions recorded yet. Open a tool or toggle an onboarding step to record activity in browser storage.
                  </p>
                ) : (
                  <ul className="divide-y divide-[#262626]">
                    {recentActivity.slice(0, 6).map((item) => (
                      <li
                        key={item.id}
                        className="py-2.5 first:pt-1 last:pb-1 flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">
                              {item.kind === "simulated"
                                ? "SIMULATED"
                                : item.kind === "api"
                                ? "LOCAL API"
                                : "LOCAL"}
                            </span>
                            <span className="text-white font-medium">{item.tool}</span>
                          </div>
                          <p className="text-sm text-[#929292] truncate">{item.label}</p>
                        </div>
                        <span className="text-xs font-mono text-[#929292] shrink-0">
                          {new Date(item.timestamp).toLocaleTimeString("en-US")}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>

        {/* Narrow Right Column */}
        <aside className="lg:col-span-4 space-y-6 min-w-0">
          {/* Environment Status Card */}
          <section
            aria-labelledby="env-status-heading"
            className="rounded-lg border border-[#262626] bg-[#080808] p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#262626]">
              <h2 id="env-status-heading" className="text-base font-medium text-white tracking-tight">
                Environment Status
              </h2>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-300">
                Preview
              </span>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#929292]">Network</dt>
                <dd className="font-mono text-xs text-cyan-300">Zcash Testnet Only</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#929292]">Mode</dt>
                <dd className="font-mono text-xs text-white">Local Browser Sandbox</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#929292]">Zucchini Ext</dt>
                <dd
                  className={cn(
                    "font-mono text-xs",
                    extensionDetected === true ? "text-emerald-400" : "text-[#929292]"
                  )}
                >
                  {extensionDetected === null
                    ? "Checking..."
                    : extensionDetected
                    ? "Detected"
                    : "Not Detected"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#929292]">Confirm Policy</dt>
                <dd className="font-mono text-xs text-white">
                  {threshold} Blocks (~{policy.estimatedMinutes}m)
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#929292]">Key Custody</dt>
                <dd className="font-mono text-xs text-white">Viewing-Only / Zero Keys</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#929292]">Live Scanner</dt>
                <dd className="font-mono text-xs text-amber-400">Not Implemented</dd>
              </div>
            </dl>

            <div className="pt-3 border-t border-[#262626] grid grid-cols-2 gap-2">
              <Link
                href="/validator"
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-[#262626] px-2.5 text-sm font-medium text-white hover:bg-neutral-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Validator</span>
              </Link>
              <Link
                href="/settings"
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-[#262626] px-2.5 text-sm font-medium text-white hover:bg-neutral-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <Settings2 className="w-4 h-4" />
                <span>Config</span>
              </Link>
            </div>
          </section>

          {/* Documentation Card */}
          <section
            aria-labelledby="docs-card-heading"
            className="rounded-lg border border-[#262626] bg-[#080808] p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#262626]">
              <h2 id="docs-card-heading" className="text-base font-medium text-white tracking-tight">
                Documentation
              </h2>
              <FileText className="w-4 h-4 text-[#929292]" />
            </div>

            <p className="text-sm text-[#929292] leading-relaxed">
              Wallet broadcasts alone do not confirm merchant receipt. Pair ZIP-321 URIs with a backend viewing-key scanner.
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-[#929292]">
                  ZIP-321 Example
                </span>
                <button
                  type="button"
                  onClick={handleCopySnippet}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-[#262626] px-2.5 text-xs font-medium text-white hover:bg-neutral-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  {copiedSnippet ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copiedSnippet ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <code className="block rounded-md border border-[#262626] bg-black p-3 text-sm font-mono text-neutral-300 break-all">
                {QUICKSTART_SNIPPET}
              </code>
            </div>

            <ul className="space-y-2 pt-2 border-t border-[#262626] text-sm">
              <li>
                <a
                  href="https://zips.z.cash/zip-0321"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-[#929292] hover:text-white transition-colors duration-200"
                >
                  <span>ZIP-321 Payment Requests</span>
                  <span className="font-mono text-xs">↗</span>
                </a>
              </li>
              <li>
                <a
                  href="https://zips.z.cash/zip-0316"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-[#929292] hover:text-white transition-colors duration-200"
                >
                  <span>ZIP-316 Unified Addresses</span>
                  <span className="font-mono text-xs">↗</span>
                </a>
              </li>
              <li>
                <Link
                  href="/reports"
                  className="flex items-center justify-between text-[#929292] hover:text-white transition-colors duration-200"
                >
                  <span>Integration Readiness Report</span>
                  <span className="font-mono text-xs">→</span>
                </Link>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
