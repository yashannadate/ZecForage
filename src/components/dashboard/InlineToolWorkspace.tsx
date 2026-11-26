"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  FlaskConical,
  QrCode,
  RefreshCw,
  RotateCcw,
  Send,
  Wallet,
  Webhook,
} from "lucide-react";
import { buildZip321Uri } from "@/lib/zcash/zip321";
import {
  createVirtualZucchiniProvider,
  createZucchiniClient,
  discoverZucchiniProvider,
  withWalletTimeout,
} from "@/lib/zcash/wallet";
import {
  createScenarioSession,
  transitionScenario,
  type ScenarioSession,
} from "@/lib/zcash/scenarios";
import { createSampleWebhookEvent, type WebhookEventPayload } from "@/lib/zcash/webhooks";
import {
  appendWorkbenchActivity,
  loadWorkbenchState,
  saveWorkbenchState,
} from "@/lib/settings/store";
import { cn } from "@/lib/utils";

export type InlineToolId = "builder" | "wallets" | "scenarios" | "webhooks";

interface InlineToolWorkspaceProps {
  tool: InlineToolId;
  onBack: () => void;
}

const TOOL_META: Record<
  InlineToolId,
  { title: string; badge: string; fullHref: string; description: string }
> = {
  builder: {
    title: "ZIP-321 Payment Builder",
    badge: "LOCAL URI PREVIEW",
    fullHref: "/builder",
    description:
      "Construct and copy a local ZIP-321 payment request URI. Formatting only — does not broadcast transactions.",
  },
  wallets: {
    title: "Wallet Compatibility",
    badge: "SIMULATED PROVIDER & QR",
    fullHref: "/wallets",
    description:
      "Test browser extension discovery (window.zucchini) or run the deterministic virtual simulator without real funds.",
  },
  scenarios: {
    title: "Payment Scenario Simulator",
    badge: "SIMULATED OFFLINE FSM",
    fullHref: "/scenarios",
    description:
      "Step through simulated settlement states using exact integer zatoshi accounting. No blockchain connection.",
  },
  webhooks: {
    title: "Webhook Workbench",
    badge: "LOCAL LOOPBACK API",
    fullHref: "/webhooks",
    description:
      "Dispatch an HMAC-SHA256 signed event to the local reference receiver route (/api/webhooks/receiver).",
  },
};

export function InlineToolWorkspace({ tool, onBack }: InlineToolWorkspaceProps) {
  const meta = TOOL_META[tool];

  return (
    <section
      aria-label={meta.title}
      className="rounded-lg border border-[#262626] bg-[#080808] p-5 space-y-5"
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#262626]">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#262626] bg-transparent px-3 text-sm font-medium text-white hover:bg-neutral-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <div>
            <h2 className="text-base font-medium text-white tracking-tight">{meta.title}</h2>
            <p className="text-sm text-[#929292] leading-relaxed">{meta.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2.5 py-1 rounded-md border border-[#262626] bg-black text-xs font-mono uppercase tracking-wider text-cyan-300">
            {meta.badge}
          </span>
          <Link
            href={meta.fullHref}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[#262626] bg-transparent px-3 text-sm font-medium text-[#929292] hover:text-white hover:bg-neutral-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <span>Full View</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {tool === "builder" && <InlineBuilderTool />}
      {tool === "wallets" && <InlineWalletTool />}
      {tool === "scenarios" && <InlineScenarioTool />}
      {tool === "webhooks" && <InlineWebhookTool />}
    </section>
  );
}

// ---------------------------------------------------------------------------
// 1. Inline ZIP-321 Builder
// ---------------------------------------------------------------------------
function InlineBuilderTool() {
  const [recipient, setRecipient] = useState(
    "utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq"
  );
  const [amount, setAmount] = useState("0.05");
  const [memo, setMemo] = useState("Order #1042");
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  let uriResult: ReturnType<typeof buildZip321Uri> | null = null;
  let errorMsg: string | null = null;
  try {
    if (recipient.trim() && amount.trim()) {
      uriResult = buildZip321Uri({
        recipient: recipient.trim(),
        amount: amount.trim(),
        memo: memo.trim() || undefined,
        network: "testnet",
      });
    }
  } catch (err) {
    errorMsg = err instanceof Error ? err.message : "Invalid ZIP-321 parameters.";
  }

  useEffect(() => {
    let active = true;
    if (!uriResult?.uri) {
      setQrUrl("");
      return;
    }
    QRCode.toDataURL(uriResult.uri, { width: 180, margin: 1 })
      .then((url) => {
        if (active) setQrUrl(url);
      })
      .catch(() => {
        if (active) setQrUrl("");
      });
    return () => {
      active = false;
    };
  }, [uriResult?.uri]);

  const handleCopy = async () => {
    if (!uriResult?.uri) return;
    try {
      await navigator.clipboard.writeText(uriResult.uri);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      saveWorkbenchState({
        lastGeneratedUri: uriResult.uri,
        checklist: { ...loadWorkbenchState().checklist, step1: true },
      });
      appendWorkbenchActivity({
        tool: "ZIP-321 Builder",
        label: `Copied ${uriResult.amount} ZEC payment request URI`,
        kind: "local",
      });
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
      <div className="md:col-span-7 space-y-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-mono uppercase tracking-wider text-[#929292]">
            Testnet Recipient Address
          </span>
          <textarea
            rows={2}
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full rounded-md border border-[#262626] bg-black p-2.5 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 resize-none"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#929292]">
              Amount (ZEC)
            </span>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full min-h-10 rounded-md border border-[#262626] bg-black px-3 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-300"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-mono uppercase tracking-wider text-[#929292]">
              Shielded Memo (UTF-8)
            </span>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full min-h-10 rounded-md border border-[#262626] bg-black px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-300"
            />
          </label>
        </div>

        {errorMsg && (
          <p className="rounded-md border border-rose-800/50 bg-rose-950/30 p-3 text-sm text-rose-300">
            {errorMsg}
          </p>
        )}

        <div className="space-y-1.5">
          <span className="text-xs font-mono uppercase tracking-wider text-[#929292] block">
            Canonical URI Output
          </span>
          <code className="block rounded-md border border-[#262626] bg-black p-3 text-sm font-mono text-neutral-200 break-all">
            {uriResult ? uriResult.uri : "Awaiting valid parameters..."}
          </code>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!uriResult}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied URI" : "Copy URI"}</span>
          </button>
        </div>
      </div>

      <div className="md:col-span-5 flex flex-col items-center justify-center rounded-lg border border-[#262626] bg-black p-4 space-y-3">
        {qrUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrUrl} alt="ZIP-321 QR" className="w-40 h-40 rounded bg-white p-2" />
        ) : (
          <QrCode className="w-10 h-10 text-[#929292]" />
        )}
        <span className="text-xs font-mono text-[#929292]">
          {uriResult ? `${uriResult.amountZatoshis} zatoshis` : "Invalid parameters"}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Inline Wallet Compatibility
// ---------------------------------------------------------------------------
function InlineWalletTool() {
  const [hasRealExt, setHasRealExt] = useState(false);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string>("");
  const [simTxid, setSimTxid] = useState<string>("");
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  const providerRef = useRef<ReturnType<typeof createVirtualZucchiniProvider> | null>(null);

  useEffect(() => {
    setHasRealExt(Boolean(discoverZucchiniProvider()));
  }, []);

  const handleSimulatedConnect = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const provider =
        providerRef.current || createVirtualZucchiniProvider({ network: "testnet" });
      providerRef.current = provider;
      const client = createZucchiniClient(provider);
      const conn = await withWalletTimeout(
        client.connect({ permissions: ["view_addresses", "send_transaction"] }),
        15000
      );
      setConnected(conn.connected);
      setAccount(conn.accounts[0]?.address || "");
      setStatusMsg("Connected to Virtual Simulator (mock testnet provider, not a live wallet).");
      appendWorkbenchActivity({
        tool: "Wallet Compatibility",
        label: "Connected virtual Zucchini simulator session",
        kind: "simulated",
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Simulator connection failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleSimulatedPayment = async () => {
    if (!providerRef.current || !connected) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const client = createZucchiniClient(providerRef.current);
      const sampleUri =
        "zcash:utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq?amount=0.001";
      const res = await withWalletTimeout(client.requestPayment(sampleUri), 15000);
      setSimTxid(res.txid);
      setStatusMsg(
        "Simulated wallet broadcast returned a mock txid. Does NOT prove on-chain confirmation."
      );
      saveWorkbenchState({
        checklist: { ...loadWorkbenchState().checklist, step2: true },
      });
      appendWorkbenchActivity({
        tool: "Wallet Compatibility",
        label: "Simulated requestPayment handoff returned mock txid",
        kind: "simulated",
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Payment request failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (providerRef.current) {
      await providerRef.current.disconnect();
      providerRef.current = null;
    }
    setConnected(false);
    setAccount("");
    setSimTxid("");
    setStatusMsg("Simulator session disconnected.");
  };

  const handleCopyTxid = async () => {
    if (!simTxid) return;
    try {
      await navigator.clipboard.writeText(simTxid);
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } catch {
      setCopiedTx(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#262626] bg-black p-3.5">
        <div className="space-y-0.5">
          <span className="text-xs font-mono uppercase tracking-wider text-[#929292] block">
            Browser Extension Detection (window.zucchini)
          </span>
          <span className="text-sm text-white">
            {hasRealExt
              ? "Real Zucchini extension detected in browser"
              : "No browser extension detected — using offline Virtual Simulator"}
          </span>
        </div>
        <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded border border-[#262626] bg-[#080808] text-cyan-300">
          {hasRealExt ? "Ext Ready" : "Simulated Only"}
        </span>
      </div>

      {errorMsg && (
        <p className="rounded-md border border-rose-800/50 bg-rose-950/30 p-3 text-sm text-rose-300">
          {errorMsg}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {!connected ? (
          <button
            type="button"
            onClick={handleSimulatedConnect}
            disabled={busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <Wallet className="w-4 h-4" />
            <span>{busy ? "Connecting..." : "Connect Virtual Simulator"}</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleSimulatedPayment}
              disabled={busy}
              className="inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <Send className="w-4 h-4" />
              <span>{busy ? "Simulating..." : "Simulate Payment Handoff"}</span>
            </button>
            <button
              type="button"
              onClick={handleDisconnect}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#262626] bg-transparent px-4 text-sm font-medium text-white hover:bg-neutral-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Disconnect
            </button>
          </>
        )}
      </div>

      {(statusMsg || account || simTxid) && (
        <div className="rounded-md border border-[#262626] bg-black p-3.5 space-y-2 text-sm">
          {statusMsg && <p className="text-[#929292]">{statusMsg}</p>}
          {account && (
            <div className="text-xs font-mono text-neutral-300 truncate">
              Mock Account: {account}
            </div>
          )}
          {simTxid && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#262626]">
              <code className="text-sm font-mono text-cyan-300 break-all">
                [SIMULATED TXID] {simTxid}
              </code>
              <button
                type="button"
                onClick={handleCopyTxid}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-[#262626] px-2.5 text-xs font-medium text-white hover:bg-neutral-900"
              >
                {copiedTx ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedTx ? "Copied" : "Copy"}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. Inline Scenario Simulator
// ---------------------------------------------------------------------------
function InlineScenarioTool() {
  const [threshold, setThreshold] = useState(10);
  const [session, setSession] = useState<ScenarioSession>(() =>
    createScenarioSession({ expectedZEC: "0.05", requiredConfirmations: 10 })
  );

  useEffect(() => {
    const saved = loadWorkbenchState().settings.confirmationThreshold;
    setThreshold(saved);
    setSession(createScenarioSession({ expectedZEC: "0.05", requiredConfirmations: saved }));
  }, []);

  const apply = (next: ScenarioSession, note: string) => {
    setSession(next);
    saveWorkbenchState({
      checklist: { ...loadWorkbenchState().checklist, step2: true },
      scenario: {
        currentState: next.currentState,
        confirmations: next.confirmations,
        requiredConfirmations: next.invoice.requiredConfirmations,
        canFulfill: next.canFulfill,
        timestamp: Date.now(),
      },
    });
    appendWorkbenchActivity({
      tool: "Scenario Simulator",
      label: note,
      kind: "simulated",
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-md border border-[#262626] bg-black p-3">
          <span className="text-xs font-mono uppercase tracking-wider text-[#929292] block">
            State (Simulated)
          </span>
          <span className="text-sm font-mono text-white uppercase">{session.currentState}</span>
        </div>
        <div className="rounded-md border border-[#262626] bg-black p-3">
          <span className="text-xs font-mono uppercase tracking-wider text-[#929292] block">
            Confirmations
          </span>
          <span className="text-sm font-mono text-white">
            {session.confirmations} / {threshold}
          </span>
        </div>
        <div className="rounded-md border border-[#262626] bg-black p-3">
          <span className="text-xs font-mono uppercase tracking-wider text-[#929292] block">
            Fulfillment Gate
          </span>
          <span
            className={cn(
              "text-sm font-mono",
              session.canFulfill ? "text-emerald-400" : "text-[#929292]"
            )}
          >
            {session.canFulfill ? "AUTHORIZED" : "WITHHELD"}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            apply(
              transitionScenario(session, { type: "PAYMENT_DETECTED", amountZEC: "0.05" }),
              "Simulated exact 0.05 ZEC detection"
            )
          }
          className="inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black hover:bg-neutral-200 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <FlaskConical className="w-4 h-4" />
          <span>Detect Exact (0.05)</span>
        </button>

        <button
          type="button"
          disabled={session.currentState === "awaiting_payment"}
          onClick={() =>
            apply(
              transitionScenario(session, { type: "CONFIRMATIONS_ADVANCED", count: threshold }),
              `Advanced simulated confirmations to ${threshold}/${threshold}`
            )
          }
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#262626] bg-transparent px-4 text-sm font-medium text-white hover:bg-neutral-900 transition-colors duration-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          Advance to {threshold} Blocks
        </button>

        <button
          type="button"
          onClick={() =>
            apply(
              transitionScenario(session, { type: "PAYMENT_DETECTED", amountZEC: "0.04" }),
              "Simulated underpayment exception (0.04 ZEC)"
            )
          }
          className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#262626] bg-transparent px-4 text-sm font-medium text-[#929292] hover:text-white hover:bg-neutral-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          Underpay (0.04)
        </button>

        <button
          type="button"
          onClick={() =>
            apply(
              createScenarioSession({ expectedZEC: "0.05", requiredConfirmations: threshold }),
              "Reset payment scenario session"
            )
          }
          className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-[#262626] bg-transparent px-3 text-sm font-medium text-[#929292] hover:text-white hover:bg-neutral-900 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      <p className="text-sm text-[#929292] leading-relaxed">
        {session.auditTrail[0]?.reason}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 4. Inline Webhook Workbench
// ---------------------------------------------------------------------------
function InlineWebhookTool() {
  const [tamperMode, setTamperMode] = useState<"none" | "tampered_body">("none");
  const [loading, setLoading] = useState(false);
  const [responseSummary, setResponseSummary] = useState<{
    status: number | null;
    verified: boolean;
    signatureHeader?: string;
    message: string;
  } | null>(null);
  const [copiedSig, setCopiedSig] = useState(false);

  const handleDispatch = async () => {
    setLoading(true);
    try {
      const payload: WebhookEventPayload = createSampleWebhookEvent("payment.paid");
      const res = await fetch("/api/webhooks/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload,
          targetUrl: "/api/webhooks/receiver",
          tamperMode,
          maxRetries: 1,
        }),
      });
      const data = await res.json();
      setResponseSummary({
        status: data.result?.finalStatus ?? res.status,
        verified: Boolean(data.success),
        signatureHeader: data.signatureHeader,
        message: data.success
          ? "HMAC-SHA256 signature verified against raw body."
          : data.error || "Receiver rejected tampered webhook with HTTP 401.",
      });
      saveWorkbenchState({
        checklist: { ...loadWorkbenchState().checklist, step3: true },
      });
      appendWorkbenchActivity({
        tool: "Webhook Workbench",
        label: `Dispatched ${payload.type} (${tamperMode}) → HTTP ${data.result?.finalStatus ?? res.status}`,
        kind: "api",
      });
    } catch (err) {
      setResponseSummary({
        status: null,
        verified: false,
        message: err instanceof Error ? err.message : "Dispatch failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopySig = async () => {
    if (!responseSummary?.signatureHeader) return;
    try {
      await navigator.clipboard.writeText(`x-zecforge-signature: ${responseSummary.signatureHeader}`);
      setCopiedSig(true);
      setTimeout(() => setCopiedSig(false), 2000);
    } catch {
      setCopiedSig(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTamperMode("none")}
          className={cn(
            "min-h-9 px-3 rounded-md text-sm font-medium border transition-colors duration-200",
            tamperMode === "none"
              ? "bg-white text-black border-white"
              : "bg-transparent text-[#929292] border-[#262626] hover:text-white"
          )}
        >
          Valid HMAC Delivery
        </button>
        <button
          type="button"
          onClick={() => setTamperMode("tampered_body")}
          className={cn(
            "min-h-9 px-3 rounded-md text-sm font-medium border transition-colors duration-200",
            tamperMode === "tampered_body"
              ? "bg-white text-black border-white"
              : "bg-transparent text-[#929292] border-[#262626] hover:text-white"
          )}
        >
          Tampered Body (Expect 401)
        </button>
      </div>

      <button
        type="button"
        onClick={handleDispatch}
        disabled={loading}
        className="inline-flex min-h-10 items-center gap-2 rounded-md bg-white px-4 text-sm font-medium text-black hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Webhook className="w-4 h-4" />}
        <span>{loading ? "Dispatching..." : "Dispatch Signed Test Event"}</span>
      </button>

      {responseSummary && (
        <div className="rounded-md border border-[#262626] bg-black p-3.5 space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-wider">
            <span className={responseSummary.verified ? "text-emerald-400" : "text-rose-400"}>
              HTTP {responseSummary.status ?? "ERR"} ·{" "}
              {responseSummary.verified ? "VERIFIED" : "REJECTED"}
            </span>
          </div>
          <p className="text-[#929292]">{responseSummary.message}</p>
          {responseSummary.signatureHeader && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#262626]">
              <code className="text-sm font-mono text-neutral-300 truncate max-w-full">
                {responseSummary.signatureHeader}
              </code>
              <button
                type="button"
                onClick={handleCopySig}
                className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-[#262626] px-2.5 text-xs font-medium text-white hover:bg-neutral-900"
              >
                {copiedSig ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedSig ? "Copied" : "Copy Header"}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
