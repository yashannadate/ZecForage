"use client";

import React, { useState, useCallback } from "react";
import {
  Settings2,
  Server,
  Clock,
  Code2,
  Copy,
  Check,
  Download,
  Shield,
  AlertTriangle,
  Info,
  Lock,
  Globe,
  Wifi,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettlementRuleAlert } from "@/components/ui/SettlementRuleAlert";
import {
  RPC_PRESETS,
  RpcEndpointPreset,
  CONFIRMATION_THRESHOLD_MIN,
  CONFIRMATION_THRESHOLD_MAX,
  CONFIRMATION_THRESHOLD_DEFAULT,
  deriveConfirmationPolicy,
  WEBHOOK_TEMPLATES,
  WebhookTemplate,
  TemplateFramework,
} from "@/lib/settings/types";

// ---------------------------------------------------------------------------
// Sub-component: Section shell
// ---------------------------------------------------------------------------
function Section({
  title,
  badge,
  icon: Icon,
  children,
}: {
  title: string;
  badge?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-surface-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border bg-surface-elevated/40">
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-semibold text-slate-200 tracking-tight">{title}</span>
        </div>
        {badge && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated border border-surface-border text-primary-300">
            {badge}
          </span>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: RPC Endpoint Selector
// ---------------------------------------------------------------------------
function RpcSelector() {
  const [selected, setSelected] = useState<RpcEndpointPreset>(RPC_PRESETS[0]);
  const [customUrl, setCustomUrl] = useState("");
  const [customTls, setCustomTls] = useState(true);
  const [copied, setCopied] = useState(false);

  const displayUrl =
    selected.id === "custom" ? customUrl || "hostname:9067" : selected.url;

  const handleCopy = useCallback(() => {
    if (!displayUrl) return;
    navigator.clipboard.writeText(displayUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [displayUrl]);

  const statusColors: Record<RpcEndpointPreset["status"], string> = {
    official: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40",
    community: "text-amber-400 bg-amber-950/40 border-amber-800/40",
    custom: "text-primary-300 bg-primary-950/40 border-primary-800/40",
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        Select the lightwalletd RPC endpoint for your integration. This configures where your backend
        scanner will connect to scan for incoming Orchard/Sapling notes. This tool displays recommended
        endpoints — it does not establish a live connection.
      </p>

      {/* Preset grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {RPC_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setSelected(preset)}
            className={cn(
              "text-left p-3.5 rounded-lg border transition-all",
              selected.id === preset.id
                ? "border-primary-500/50 bg-primary-950/20 text-slate-100"
                : "border-surface-border bg-surface-elevated/40 text-slate-400 hover:border-surface-border/80 hover:text-slate-300 hover:bg-surface-elevated/60"
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-xs font-semibold tracking-tight">{preset.label}</span>
              <span
                className={cn(
                  "shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded border capitalize",
                  statusColors[preset.status]
                )}
              >
                {preset.status}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 block truncate">
              {preset.id === "custom" ? "user-defined endpoint" : preset.url}
            </span>
          </button>
        ))}
      </div>

      {/* Custom URL input */}
      {selected.id === "custom" && (
        <div className="space-y-2.5 pt-1">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-mono">
              Custom endpoint (host:port)
            </label>
            <input
              type="text"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="192.168.1.100:9067"
              className="w-full px-3 py-2 rounded-lg border border-surface-border bg-surface-elevated text-sm text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/20 transition-colors"
            />
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={customTls}
              onChange={(e) => setCustomTls(e.target.checked)}
              className="w-4 h-4 rounded border-surface-border bg-surface-elevated accent-primary-500 cursor-pointer"
            />
            <span className="text-xs text-slate-400">
              Require TLS <span className="text-slate-600">(recommended for all non-localhost endpoints)</span>
            </span>
          </label>
        </div>
      )}

      {/* Active endpoint display */}
      <div className="mt-2 p-3.5 rounded-lg bg-surface-elevated border border-surface-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
            Active Endpoint
          </span>
          <div className="flex items-center gap-2">
            {(selected.id === "custom" ? customTls : selected.tls) ? (
              <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                <Lock className="w-3 h-3" />
                TLS
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                <AlertTriangle className="w-3 h-3" />
                No TLS
              </span>
            )}
            <span
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.5 rounded border capitalize",
                statusColors[selected.status]
              )}
            >
              {selected.network === "custom" ? "custom" : selected.network}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs font-mono text-slate-300 bg-background rounded px-2.5 py-1.5 border border-surface-border truncate">
            {displayUrl}
          </code>
          <button
            onClick={handleCopy}
            disabled={!displayUrl}
            className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Copy endpoint"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="mt-2 text-[10px] text-slate-500 leading-relaxed">{selected.note}</p>
      </div>

      {/* Mainnet warning */}
      {(selected.network === "mainnet") && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-800/40 bg-amber-950/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            <strong>Mainnet endpoint selected.</strong> ZecForge is a testnet development workbench.
            Connecting to mainnet from this tool poses no risk — but your production scanning backend
            must never use test keys or test addresses on mainnet.
          </p>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Confirmation Threshold Manager
// ---------------------------------------------------------------------------
function ConfirmationThresholdManager() {
  const [threshold, setThreshold] = useState(CONFIRMATION_THRESHOLD_DEFAULT);
  const policy = deriveConfirmationPolicy(threshold);

  const riskColorMap: Record<string, string> = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    rose: "text-rose-400",
  };
  const riskBgMap: Record<string, string> = {
    emerald: "border-emerald-800/40 bg-emerald-950/20",
    amber: "border-amber-800/40 bg-amber-950/20",
    rose: "border-rose-800/40 bg-rose-950/20",
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        Configure how many block confirmations your merchant backend requires before treating a
        payment as settled. This is a <strong className="text-slate-300">merchant policy decision</strong>,
        not a Zcash protocol requirement. The default of 10 blocks (~12 min) is a commonly used
        conservative threshold. Adjust based on your fraud tolerance and customer UX requirements.
      </p>

      {/* Slider + input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-mono text-slate-400">
            Confirmation threshold
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={CONFIRMATION_THRESHOLD_MIN}
              max={CONFIRMATION_THRESHOLD_MAX}
              value={threshold}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= CONFIRMATION_THRESHOLD_MIN && v <= CONFIRMATION_THRESHOLD_MAX) {
                  setThreshold(v);
                }
              }}
              className="w-16 text-center px-2 py-1 rounded-lg border border-surface-border bg-surface-elevated text-sm font-mono text-slate-200 focus:outline-none focus:border-primary-500/60 focus:ring-1 focus:ring-primary-500/20 transition-colors"
            />
            <span className="text-xs font-mono text-slate-500">blocks</span>
          </div>
        </div>

        <input
          type="range"
          min={CONFIRMATION_THRESHOLD_MIN}
          max={CONFIRMATION_THRESHOLD_MAX}
          value={threshold}
          onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
          className="w-full h-1.5 rounded-full bg-surface-elevated appearance-none accent-primary-500 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-600">
          <span>{CONFIRMATION_THRESHOLD_MIN}</span>
          <span>10 (default)</span>
          <span>{CONFIRMATION_THRESHOLD_MAX}</span>
        </div>
      </div>

      {/* Policy summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-lg border border-surface-border bg-surface-elevated/40 space-y-0.5">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Blocks</p>
          <p className="text-xl font-bold font-mono text-slate-100">{policy.threshold}</p>
        </div>
        <div className="p-3 rounded-lg border border-surface-border bg-surface-elevated/40 space-y-0.5">
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Est. Time</p>
          <p className="text-xl font-bold font-mono text-slate-100">
            ~{policy.estimatedMinutes}
            <span className="text-sm text-slate-400 ml-1">min</span>
          </p>
        </div>
        <div className={cn("p-3 rounded-lg border space-y-0.5", riskBgMap[policy.riskColor])}>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Double-Spend Risk</p>
          <p className={cn("text-xl font-bold font-mono", riskColorMap[policy.riskColor])}>
            {policy.riskLabel}
          </p>
        </div>
      </div>

      {threshold < 3 && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-rose-800/40 bg-rose-950/20">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-300 leading-relaxed">
            <strong>Low threshold warning.</strong> Thresholds below 3 blocks offer minimal
            reorg protection. Strongly discouraged for any value-bearing integration.
          </p>
        </div>
      )}

      {threshold >= 10 && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-emerald-800/40 bg-emerald-950/20">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-300 leading-relaxed">
            10+ block threshold provides strong finality for most merchant use cases. This matches
            the ZecForge scenario simulator&apos;s default policy and integration report baseline.
          </p>
        </div>
      )}

      <div className="flex items-start gap-2 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-600" />
        <span>
          Block time is approximately 75 seconds (target). Actual settlement time varies with
          network conditions. These estimates are advisory only.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Webhook Boilerplate Templates
// ---------------------------------------------------------------------------
function WebhookTemplatePanel() {
  const [activeId, setActiveId] = useState<TemplateFramework>("express");
  const [copied, setCopied] = useState(false);

  const template = WEBHOOK_TEMPLATES.find((t) => t.id === activeId) as WebhookTemplate;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(template.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [template.code]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([template.code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = template.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [template]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        Production-ready webhook receiver starters, pre-wired with HMAC-SHA256 verification,
        replay protection, and idempotency. These match the ZecForge Phase 6 signing format exactly.
        Load your <code className="font-mono text-primary-300">ZECFORGE_WEBHOOK_SECRET</code> from
        an environment variable — never hardcode it.
      </p>

      {/* Framework tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-surface-elevated border border-surface-border w-fit">
        {WEBHOOK_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveId(t.id)}
            className={cn(
              "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
              activeId === t.id
                ? "bg-primary-600/20 text-primary-200 border border-primary-500/30"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Template description */}
      <p className="text-xs text-slate-500 leading-relaxed">{template.description}</p>

      {/* Code block */}
      <div className="relative rounded-xl border border-surface-border bg-surface-elevated overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border bg-surface-subtle/40">
          <div className="flex items-center gap-2">
            <Code2 className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-mono text-slate-500">{template.filename}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors"
              aria-label="Copy code"
            >
              {copied ? (
                <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
              ) : (
                <><Copy className="w-3.5 h-3.5" /><span>Copy</span></>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-slate-400 hover:text-slate-200 hover:bg-surface-elevated transition-colors"
              aria-label="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>
        <pre className="p-4 overflow-x-auto text-[11px] leading-relaxed font-mono text-slate-300 max-h-96">
          <code>{template.code}</code>
        </pre>
      </div>

      {/* Security reminders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {[
          {
            icon: Lock,
            color: "text-emerald-400",
            bg: "border-emerald-800/30 bg-emerald-950/10",
            text: "ZECFORGE_WEBHOOK_SECRET must be a server-side env var only — never NEXT_PUBLIC_ or client-side.",
          },
          {
            icon: Shield,
            color: "text-primary-400",
            bg: "border-primary-800/30 bg-primary-950/10",
            text: "Raw body bytes must be read before any JSON parsing to ensure the HMAC covers the exact payload.",
          },
        ].map(({ icon: Icon, color, bg, text }) => (
          <div key={text} className={cn("flex items-start gap-2.5 p-3 rounded-lg border", bg)}>
            <Icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", color)} />
            <p className="text-[11px] text-slate-400 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: Env Config Reference
// ---------------------------------------------------------------------------
function EnvConfigReference() {
  const [copied, setCopied] = useState<string | null>(null);

  const vars = [
    {
      key: "ZECFORGE_WEBHOOK_SECRET",
      example: "# generate with: openssl rand -hex 32",
      description: "HMAC-SHA256 signing secret. 32+ byte random hex string. Never expose client-side.",
      risk: "critical",
    },
    {
      key: "LIGHTWALLETD_URL",
      example: "lightwalletd.testnet.electriccoin.co:9067",
      description: "Lightwalletd RPC endpoint for your backend scanner.",
      risk: "low",
    },
    {
      key: "ZECFORGE_CONFIRMATION_THRESHOLD",
      example: "10",
      description: "Block confirmation threshold for settlement finality (merchant policy).",
      risk: "low",
    },
    {
      key: "ZECFORGE_WEBHOOK_TOLERANCE_MS",
      example: "300000",
      description: "Maximum age in ms for a webhook timestamp before rejection (default: 5 minutes).",
      risk: "low",
    },
  ];

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(`${key}=${value}`);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400 leading-relaxed">
        Required and optional environment variables for a ZecForge-compatible merchant backend.
        Copy the <code className="text-primary-300 font-mono">.env.example</code> format below.
        Never commit actual secrets.
      </p>

      <div className="rounded-lg border border-surface-border overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-surface-border bg-surface-elevated/40">
              <th className="px-4 py-2.5 text-left font-mono text-slate-500 font-medium text-[10px] uppercase tracking-wider w-1/3">Variable</th>
              <th className="px-4 py-2.5 text-left font-mono text-slate-500 font-medium text-[10px] uppercase tracking-wider hidden sm:table-cell">Example</th>
              <th className="px-4 py-2.5 text-left font-mono text-slate-500 font-medium text-[10px] uppercase tracking-wider w-16">Risk</th>
              <th className="px-4 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/50">
            {vars.map((v) => (
              <tr key={v.key} className="hover:bg-surface-elevated/20 transition-colors">
                <td className="px-4 py-3 align-top">
                  <code className="text-primary-300 font-mono text-[11px]">{v.key}</code>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed sm:hidden">{v.description}</p>
                </td>
                <td className="px-4 py-3 align-top hidden sm:table-cell">
                  <code className="text-slate-400 font-mono text-[11px]">{v.example}</code>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{v.description}</p>
                </td>
                <td className="px-4 py-3 align-top">
                  <span className={cn(
                    "text-[9px] font-mono px-1.5 py-0.5 rounded border capitalize",
                    v.risk === "critical"
                      ? "text-rose-400 bg-rose-950/40 border-rose-800/40"
                      : "text-slate-500 bg-surface-elevated border-surface-border"
                  )}>
                    {v.risk}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <button
                    onClick={() => handleCopy(v.key, v.example)}
                    className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
                    aria-label={`Copy ${v.key}`}
                  >
                    {copied === v.key ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-slate-500">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-600" />
        <span>
          A <code className="font-mono text-primary-300">.env.example</code> file with placeholder
          values is included in the ZecForge repository. The actual{" "}
          <code className="font-mono text-primary-300">.env</code> file is git-ignored.
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MerchantConfigPage() {
  return (
    <div className="space-y-8 font-sans">
      <PageHeader
        badge="Phase 8 · Merchant Config"
        badgeIcon={Settings2}
        title="Merchant Configuration Hub"
        description="Configure RPC endpoints, confirmation threshold policies, and production webhook receiver templates for your Zcash merchant integration backend."
      />

      <SettlementRuleAlert
        title="Configuration Reference Only"
        description="This page displays developer configuration references. It does not connect to any live Zcash node, store configuration, or sign transactions. Apply these settings in your backend environment."
      />

      {/* Sections */}
      <div className="space-y-6">
        <Section title="Lightwalletd RPC Endpoint" badge="gRPC · TLS" icon={Server}>
          <RpcSelector />
        </Section>

        <Section title="Confirmation Threshold Policy" badge="Merchant Policy" icon={Clock}>
          <ConfirmationThresholdManager />
        </Section>

        <Section title="Production Webhook Receiver Templates" badge="HMAC-SHA256" icon={Code2}>
          <WebhookTemplatePanel />
        </Section>

        <Section title="Environment Variable Reference" badge=".env.example" icon={Globe}>
          <EnvConfigReference />
        </Section>
      </div>
    </div>
  );
}
