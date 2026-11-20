"use client";

import React, { useState } from "react";
import {
  Webhook,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Send,
  RefreshCw,
  Copy,
  Check,
  Lock,
  Server,
  History,
  FileJson,
  Zap,
  Info,
  Sliders,
  RotateCcw,
} from "lucide-react";
import {
  type WebhookEventType,
  type WebhookEventPayload,
  createSampleWebhookEvent,
  WEBHOOK_SIGNATURE_HEADER,
  DEFAULT_TIMESTAMP_TOLERANCE_SECONDS,
} from "@/lib/zcash/webhooks";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettlementRuleAlert } from "@/components/ui/SettlementRuleAlert";
import { cn } from "@/lib/utils";

interface DispatchAuditEntry {
  id: string;
  timestamp: number;
  eventType: WebhookEventType;
  tamperMode: string;
  targetUrl: string;
  statusCode: number | null;
  success: boolean;
  isIdempotent: boolean;
  totalAttempts: number;
  message?: string;
}

export default function WebhooksPage() {
  const [selectedType, setSelectedType] = useState<WebhookEventType>("payment.paid");
  const [payload, setPayload] = useState<WebhookEventPayload>(() =>
    createSampleWebhookEvent("payment.paid")
  );
  const [targetUrl, setTargetUrl] = useState<string>("/api/webhooks/receiver");
  const [tamperMode, setTamperMode] = useState<
    "none" | "tampered_body" | "invalid_signature" | "expired_timestamp" | "duplicate" | "simulate_500"
  >("none");
  const [maxRetries, setMaxRetries] = useState<number>(3);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);
  const [auditLog, setAuditLog] = useState<DispatchAuditEntry[]>([]);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [copiedHeader, setCopiedHeader] = useState<boolean>(false);

  // Handle Event Preset Switch
  const handleSelectEventType = (type: WebhookEventType) => {
    setSelectedType(type);
    const newPayload = createSampleWebhookEvent(type);
    setPayload(newPayload);
  };

  // Regenerate random identifiers
  const handleRegenerateEvent = () => {
    const fresh = createSampleWebhookEvent(selectedType);
    setPayload(fresh);
  };

  // Copy JSON Payload
  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Copy Signature Header
  const handleCopyHeader = () => {
    if (dispatchResult?.signatureHeader) {
      navigator.clipboard.writeText(
        `${WEBHOOK_SIGNATURE_HEADER}: ${dispatchResult.signatureHeader}`
      );
      setCopiedHeader(true);
      setTimeout(() => setCopiedHeader(false), 2000);
    }
  };

  // Dispatch Webhook
  const handleDispatch = async () => {
    setIsDispatching(true);
    setDispatchResult(null);

    try {
      const response = await fetch("/api/webhooks/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          targetUrl,
          tamperMode,
          maxRetries,
        }),
      });

      const data = await response.json();
      setDispatchResult(data);

      // Record in audit log
      const primaryResult = data.result;
      const auditEntry: DispatchAuditEntry = {
        id: `aud_${Date.now()}`,
        timestamp: Date.now(),
        eventType: payload.type,
        tamperMode,
        targetUrl,
        statusCode: primaryResult?.finalStatus ?? null,
        success: data.success,
        isIdempotent: Boolean(primaryResult?.idempotentDuplicate || data.secondDeliveryResult?.idempotentDuplicate),
        totalAttempts: primaryResult?.totalAttempts ?? 1,
        message:
          primaryResult?.attempts?.[0]?.responseBody
            ? truncateMessage(primaryResult.attempts[0].responseBody)
            : undefined,
      };

      setAuditLog((prev) => [auditEntry, ...prev.slice(0, 19)]); // Keep last 20
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setDispatchResult({
        success: false,
        error: errorMsg,
      });
    } finally {
      setIsDispatching(false);
    }
  };

  function truncateMessage(str: string, maxLen = 80): string {
    try {
      const parsed = JSON.parse(str);
      return parsed.message || parsed.error || str.slice(0, maxLen);
    } catch {
      return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
    }
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <PageHeader
        badge="HMAC-SHA256 Merchant Webhook Protocol"
        badgeIcon={Webhook}
        title="HMAC-SHA256 Webhook Dispatcher"
        description="Cryptographically sign, dispatch, retry, and verify merchant webhook events with timestamp-bound replay protection and constant-time verification."
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs text-slate-300 font-mono">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>HMAC-SHA256</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-primary-400" />
              <span>Tolerance: {DEFAULT_TIMESTAMP_TOLERANCE_SECONDS}s</span>
            </span>
          </div>
        }
      />

      {/* Critical Settlement Boundary Education Banner */}
      <SettlementRuleAlert
        title="Cryptographic Webhook Boundary vs. Blockchain Settlement Rule"
        description="A valid HMAC-SHA256 signature guarantees that the HTTP payload was signed by a party possessing the shared secret and was not tampered with in transit. It does NOT prove that an on-chain Zcash payment took place. In production, webhook events must be emitted only by an authenticated backend scanner decrypting notes via an incoming viewing key."
      />

      {/* Main Grid: Left Column (Controls & Payload) / Right Column (Delivery & Receiver) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Event Selection & Payload Preview */}
        <div className="lg:col-span-6 space-y-6">
          {/* 1. Event Type Selector */}
          <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileJson className="w-4 h-4 text-primary-400" />
                Select Webhook Event Type
              </h2>
              <button
                onClick={handleRegenerateEvent}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition-colors"
                title="Regenerate IDs and timestamps"
              >
                <RefreshCw className="w-3 h-3" />
                Regenerate
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { type: "payment.paid", label: "payment.paid", badge: "10 confs", color: "border-emerald-700/50 text-emerald-300" },
                  { type: "payment.confirming", label: "payment.confirming", badge: "4 confs", color: "border-primary-700/50 text-primary-300" },
                  { type: "payment.detected", label: "payment.detected", badge: "0 confs", color: "border-sky-700/50 text-sky-300" },
                  { type: "payment.underpaid", label: "payment.underpaid", badge: "Exception", color: "border-rose-700/50 text-rose-300" },
                  { type: "payment.overpaid", label: "payment.overpaid", badge: "Exception", color: "border-amber-700/50 text-amber-300" },
                  { type: "payment.late", label: "payment.late", badge: "Expired", color: "border-amber-700/50 text-amber-300" },
                  { type: "payment.reorg_review", label: "payment.reorg_review", badge: "Reorg", color: "border-purple-700/50 text-purple-300" },
                ] as const
              ).map((item) => {
                const isSelected = selectedType === item.type;
                return (
                  <button
                    key={item.type}
                    onClick={() => handleSelectEventType(item.type)}
                    className={cn(
                      "p-2.5 rounded-lg text-left border transition-all text-xs font-mono flex flex-col justify-between gap-1.5",
                      isSelected
                        ? "bg-primary-950/70 border-primary-500 shadow-sm shadow-primary-950 text-white"
                        : "bg-surface-elevated/60 border-surface-border text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    )}
                  >
                    <span className="font-semibold truncate">{item.label}</span>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border inline-block w-fit", item.color)}>
                      {item.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Payload Preview with Quick Attributes */}
          <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Raw Payload Serialized JSON
              </h2>
              <button
                onClick={handleCopyPayload}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors font-mono"
              >
                {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedPayload ? "Copied" : "Copy JSON"}
              </button>
            </div>

            {/* Event Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-surface-elevated border border-surface-border">
                <span className="text-[10px] text-slate-500 block uppercase">Fulfill</span>
                <span className={cn("font-semibold", payload.data.canFulfill ? "text-emerald-400" : "text-rose-400")}>
                  {payload.data.canFulfill ? "true" : "false"}
                </span>
              </div>
              <div className="p-2 rounded bg-surface-elevated border border-surface-border">
                <span className="text-[10px] text-slate-500 block uppercase">Confs</span>
                <span className="text-slate-200 font-semibold">{payload.data.confirmations}</span>
              </div>
              <div className="p-2 rounded bg-surface-elevated border border-surface-border">
                <span className="text-[10px] text-slate-500 block uppercase">Requested</span>
                <span className="text-slate-200 font-semibold">{payload.data.requestedAmountZEC}</span>
              </div>
              <div className="p-2 rounded bg-surface-elevated border border-surface-border">
                <span className="text-[10px] text-slate-500 block uppercase">Received</span>
                <span className="text-slate-200 font-semibold">{payload.data.receivedAmountZEC}</span>
              </div>
            </div>

            {/* JSON Code Viewer */}
            <div className="relative">
              <pre className="p-3.5 rounded-lg bg-surface-elevated/90 border border-surface-border text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72 leading-relaxed selection:bg-primary-900">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>

            <p className="text-[11px] text-slate-500 font-mono">
              Note: Events explicitly carry <code className="text-slate-400">isSimulated: true</code> and simulated transaction references (<code className="text-slate-400">sim_tx_...</code>).
            </p>
          </div>
        </div>

        {/* Right Column: Dispatcher Controls & Receiver Verification */}
        <div className="lg:col-span-6 space-y-6">
          {/* 3. Dispatch Controls & Edge Case Tamper Options */}
          <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-5">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-primary-400" />
              Delivery & Simulation Controls
            </h2>

            {/* Target Endpoint Input */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-mono block">Target Receiver Endpoint</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Server className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="/api/webhooks/receiver"
                    className="w-full bg-surface-elevated border border-surface-border rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setTargetUrl("/api/webhooks/receiver")}
                  className="px-2.5 py-1.5 rounded-lg border border-surface-border bg-surface-elevated text-[11px] font-mono text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
                  title="Reset to local reference receiver"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tamper / Edge Case Selector */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>Simulation Condition / Tamper Mode</span>
                <span className="text-[10px] text-primary-400">Tests receiver security rules</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    mode: "none",
                    label: "Valid Delivery",
                    desc: "Authentic signature & fresh timestamp",
                    icon: ShieldCheck,
                    color: "text-emerald-400",
                  },
                  {
                    mode: "tampered_body",
                    label: "Tampered Body",
                    desc: "Alters amount to 999 ZEC after signing",
                    icon: AlertTriangle,
                    color: "text-rose-400",
                  },
                  {
                    mode: "invalid_signature",
                    label: "Invalid Signature",
                    desc: "Corrupts signature hex digest",
                    icon: ShieldAlert,
                    color: "text-rose-400",
                  },
                  {
                    mode: "expired_timestamp",
                    label: "Expired Timestamp",
                    desc: "Timestamp 10 min old (> 300s tolerance)",
                    icon: Clock,
                    color: "text-amber-400",
                  },
                  {
                    mode: "duplicate",
                    label: "Idempotency Replay",
                    desc: "Dispatches identical event twice",
                    icon: RefreshCw,
                    color: "text-sky-400",
                  },
                  {
                    mode: "simulate_500",
                    label: "Transient 500 (Retries)",
                    desc: "Simulates server error with 3 retries",
                    icon: History,
                    color: "text-purple-400",
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = tamperMode === item.mode;
                  return (
                    <button
                      key={item.mode}
                      onClick={() => setTamperMode(item.mode as any)}
                      className={cn(
                        "p-2.5 rounded-lg text-left border transition-all text-xs flex items-start gap-2.5",
                        isSelected
                          ? "bg-primary-950/80 border-primary-500 text-slate-100 shadow-sm"
                          : "bg-surface-elevated/70 border-surface-border text-slate-400 hover:border-slate-600 hover:text-slate-200"
                      )}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", item.color)} />
                      <div>
                        <p className="font-semibold font-mono text-[11px] text-slate-200">{item.label}</p>
                        <p className="text-[10px] text-slate-400 leading-tight">{item.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bounded Retries Config */}
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <span className="text-slate-400">Max Delivery Attempts:</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 5].map((count) => (
                  <button
                    key={count}
                    onClick={() => setMaxRetries(count)}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs transition-colors",
                      maxRetries === count
                        ? "bg-primary-600 text-white font-bold"
                        : "bg-surface-elevated border border-surface-border text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {count} {count === 1 ? "try" : "tries"}
                  </button>
                ))}
              </div>
            </div>

            {/* Dispatch Action Button */}
            <button
              onClick={handleDispatch}
              disabled={isDispatching}
              className={cn(
                "w-full py-2.5 px-4 rounded-lg font-medium text-xs font-mono flex items-center justify-center gap-2 shadow-lg transition-all",
                isDispatching
                  ? "bg-surface-elevated text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 text-white shadow-primary-950/50"
              )}
            >
              {isDispatching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Dispatching & Verifying...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Dispatch Webhook Event
                </>
              )}
            </button>
          </div>

          {/* 4. Receiver Response & Verification Status */}
          {dispatchResult && (
            <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Receiver Verification Result
                </h2>
                {dispatchResult.signatureHeader && (
                  <button
                    onClick={handleCopyHeader}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono transition-colors"
                  >
                    {copiedHeader ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    Copy Signature Header
                  </button>
                )}
              </div>

              {/* Status Header Bar */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                {dispatchResult.result?.finalStatus ? (
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded font-bold border",
                      dispatchResult.result.finalStatus >= 200 && dispatchResult.result.finalStatus < 300
                        ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                        : dispatchResult.result.finalStatus === 401
                        ? "bg-rose-950 text-rose-300 border-rose-800"
                        : "bg-amber-950 text-amber-300 border-amber-800"
                    )}
                  >
                    HTTP {dispatchResult.result.finalStatus}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                    FAILED
                  </span>
                )}

                <span
                  className={cn(
                    "px-2 py-0.5 rounded border text-[11px]",
                    dispatchResult.success
                      ? "bg-emerald-950/60 text-emerald-400 border-emerald-800/60"
                      : "bg-rose-950/60 text-rose-400 border-rose-800/60"
                  )}
                >
                  {dispatchResult.success ? "Signature Verified" : "Verification Rejected"}
                </span>

                {dispatchResult.result?.idempotentDuplicate && (
                  <span className="px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/60 text-[11px]">
                    Idempotent (Duplicate Detected)
                  </span>
                )}

                <span className="text-slate-400 text-[11px] ml-auto">
                  Attempts: {dispatchResult.result?.totalAttempts ?? 1}/{maxRetries}
                </span>
              </div>

              {/* Signature Header Preview */}
              {dispatchResult.signatureHeader && (
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">X-ZecForge-Signature Header</span>
                  <div className="p-2 rounded bg-surface-elevated border border-surface-border font-mono text-[11px] text-slate-300 break-all select-all">
                    {dispatchResult.signatureHeader}
                  </div>
                </div>
              )}

              {/* Delivery Attempts Trace */}
              {dispatchResult.result?.attempts && dispatchResult.result.attempts.length > 1 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Retry Attempt Log</span>
                  <div className="space-y-1">
                    {dispatchResult.result.attempts.map((att: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-[11px] font-mono p-1.5 rounded bg-surface-elevated/70 border border-surface-border text-slate-300"
                      >
                        <span>Attempt #{att.attemptNumber}</span>
                        <span className={att.success ? "text-emerald-400" : "text-amber-400"}>
                          HTTP {att.httpStatus ?? "Err"} {att.backoffDelayMs ? `(+${att.backoffDelayMs}ms backoff)` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Receiver Response Body */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Receiver Response Body</span>
                <pre className="p-3 rounded-lg bg-surface-elevated border border-surface-border text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                  {dispatchResult.result?.attempts?.[dispatchResult.result.attempts.length - 1]?.responseBody ||
                    JSON.stringify(dispatchResult, null, 2)}
                </pre>
              </div>

              {/* Second Delivery Result for Idempotency Test */}
              {dispatchResult.secondDeliveryResult && (
                <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-800/50 text-xs space-y-1">
                  <p className="font-semibold text-sky-200 font-mono flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                    Second Delivery (Idempotency Test):
                  </p>
                  <p className="text-slate-300 text-[11px]">
                    The exact same event was delivered a second time. The receiver detected the duplicate event ID and acknowledged it with HTTP 200 without executing duplicate fulfillment.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Audit Stream Table of Dispatches */}
      {auditLog.length > 0 && (
        <div className="rounded-xl border border-surface-border bg-surface p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <History className="w-4 h-4 text-primary-400" />
              Delivery Audit Stream ({auditLog.length})
            </h2>
            <button
              onClick={() => setAuditLog([])}
              className="text-xs text-slate-500 hover:text-slate-300 font-mono transition-colors"
            >
              Clear Log
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-surface-border text-slate-500 text-[11px]">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Event Type</th>
                  <th className="pb-2">Condition</th>
                  <th className="pb-2">Target</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Idempotent</th>
                  <th className="pb-2">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {auditLog.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-2.5 text-slate-400">{new Date(item.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 font-semibold text-slate-200">{item.eventType}</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded bg-surface-elevated text-slate-400 text-[10px]">
                        {item.tamperMode}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400 truncate max-w-[140px]">{item.targetUrl}</td>
                    <td className="py-2.5">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          item.statusCode === 200
                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                            : item.statusCode === 401
                            ? "bg-rose-950/80 text-rose-400 border-rose-800"
                            : "bg-amber-950/80 text-amber-400 border-amber-800"
                        )}
                      >
                        {item.statusCode ? `HTTP ${item.statusCode}` : "ERR"}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {item.isIdempotent ? (
                        <span className="text-sky-400 font-bold">Duplicate (OK)</span>
                      ) : (
                        <span className="text-slate-500">First Seen</span>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-400 truncate max-w-[200px]">{item.message || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Developer Reference & Security Invariants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-surface-border bg-surface space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Lock className="w-4 h-4 text-emerald-400" />
            Signature Canonical Format
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The signature signs <code className="text-slate-300 font-mono">{"${timestamp}.${rawBody}"}</code> using HMAC-SHA256 and transmits as <code className="text-slate-300 font-mono">t=&#123;ts&#125;,v1=&#123;hex&#125;</code>. This cryptographically binds the timestamp directly to the raw bytes.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-surface-border bg-surface space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Clock className="w-4 h-4 text-primary-400" />
            Replay & Tolerance Window
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Timestamps older than 300 seconds (5 minutes) or more than 5 seconds into the future are rejected before payload parsing, stopping attackers from capturing and replaying signed webhooks later.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-surface-border bg-surface space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            Constant-Time Verification
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Signature buffers are compared using <code className="text-slate-300 font-mono">crypto.timingSafeEqual</code> to prevent timing side-channel attacks from leaking signature bytes.
          </p>
        </div>
      </div>
    </div>
  );
}
