"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  Wallet,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  PowerOff,
  Send,
  Info,
  QrCode,
  SmartphoneNfc,
  CheckSquare,
  FileCheck2,
} from "lucide-react";
import {
  createZucchiniClient,
  discoverZucchiniProvider,
  createVirtualZucchiniProvider,
  type WalletRpcLog,
  type WalletState,
} from "@/lib/zcash/wallet";
import {
  ZODL_PROFILE,
  generateZodlPaymentRequest,
  createZodlTestRun,
  type ZodlPlatform,
  type ZodlTestRunRecord,
  type ZodlPaymentResult,
} from "@/lib/zcash/zodl";
import { type ZcashNetwork, inspectAddress } from "@/lib/zcash/addresses";
import { utf8ToBytes } from "@/lib/zcash/zip321";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettlementRuleAlert } from "@/components/ui/SettlementRuleAlert";
import { cn } from "@/lib/utils";

const SAMPLE_PAYMENT_URI =
  "zcash:utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq?amount=0.001&memo=b3JkZXJfZGV2XzEwMQ";

const ZODL_PRESETS = [
  {
    name: "0.05 ZEC (Testnet Unified)",
    network: "testnet" as ZcashNetwork,
    recipient:
      "utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
    amount: "0.05",
    memo: "Zodl Testnet Invoice #1024",
  },
  {
    name: "0.01 ZEC (Mainnet Unified)",
    network: "mainnet" as ZcashNetwork,
    recipient:
      "u1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
    amount: "0.01",
    memo: "Merchant Order 849",
  },
  {
    name: "0.02 ZEC (Mainnet Sapling)",
    network: "mainnet" as ZcashNetwork,
    recipient: "zs1" + "0".repeat(75),
    amount: "0.02",
    memo: "Coffee & Croissant",
  },
];

export default function WalletSandboxPage() {
  const [activeTab, setActiveTab] = useState<"zucchini" | "zodl">("zucchini");

  // --- ZUCCHINI STATE ---
  const [hasExtension, setHasExtension] = useState<boolean>(false);
  const [useSimulator, setUseSimulator] = useState<boolean>(false);
  const [walletState, setWalletState] = useState<WalletState>({
    isInstalled: false,
    isConnected: false,
    isSimulatorActive: false,
    accounts: [],
    approvedPermissions: [],
  });

  const [paymentUriInput, setPaymentUriInput] = useState<string>(SAMPLE_PAYMENT_URI);
  const [logs, setLogs] = useState<WalletRpcLog[]>([]);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [zucchiniError, setZucchiniError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // --- ZODL STATE ---
  const [zodlNetwork, setZodlNetwork] = useState<ZcashNetwork>("testnet");
  const [zodlRecipient, setZodlRecipient] = useState<string>(ZODL_PRESETS[0].recipient);
  const [zodlAmount, setZodlAmount] = useState<string>(ZODL_PRESETS[0].amount);
  const [zodlMemo, setZodlMemo] = useState<string>(ZODL_PRESETS[0].memo);
  const [zodlResult, setZodlResult] = useState<ZodlPaymentResult | null>(null);
  const [zodlQrDataUrl, setZodlQrDataUrl] = useState<string>("");
  const [zodlError, setZodlError] = useState<string | null>(null);
  const [zodlPlatform, setZodlPlatform] = useState<ZodlPlatform>("ios");
  const [zodlChecklist, setZodlChecklist] = useState({
    scannedSuccessfully: true,
    addressMatched: true,
    amountMatched: true,
    memoDecoded: true,
    feeCalculated: true,
  });
  const [zodlObservedTxid, setZodlObservedTxid] = useState<string>("");
  const [zodlNotes, setZodlNotes] = useState<string>("");
  const [zodlHistory, setZodlHistory] = useState<ZodlTestRunRecord[]>([]);

  // Check for real extension on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const provider = discoverZucchiniProvider();
      const detected = !!provider;
      setHasExtension(detected);
      setWalletState((prev) => ({
        ...prev,
        isInstalled: detected,
      }));

      // Default to simulator if no real extension installed
      if (!detected) {
        setUseSimulator(true);
      }
    }
  }, []);

  // Update Zodl payment request dynamically
  useEffect(() => {
    setZodlError(null);
    if (!zodlRecipient.trim() || !zodlAmount.trim()) {
      setZodlResult(null);
      setZodlQrDataUrl("");
      return;
    }

    try {
      const result = generateZodlPaymentRequest({
        recipient: zodlRecipient.trim(),
        amount: zodlAmount.trim(),
        memo: zodlMemo.trim() ? zodlMemo.trim() : undefined,
        network: zodlNetwork,
      });
      setZodlResult(result);

      QRCode.toDataURL(result.uri, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0F1626",
          light: "#FFFFFF",
        },
      })
        .then((url) => setZodlQrDataUrl(url))
        .catch(() => setZodlQrDataUrl(""));
    } catch (err) {
      setZodlResult(null);
      setZodlQrDataUrl("");
      setZodlError(err instanceof Error ? err.message : "Failed to construct Zodl payment request.");
    }
  }, [zodlRecipient, zodlAmount, zodlMemo, zodlNetwork]);

  const addLog = (
    method: string,
    params: unknown,
    result: unknown,
    durationMs: number,
    err?: string
  ) => {
    const log: WalletRpcLog = {
      id: Math.random().toString(36).slice(2, 9),
      timestamp: Date.now(),
      method,
      params,
      result,
      error: err,
      durationMs,
      source: useSimulator ? "virtual_simulator" : "real_extension",
    };
    setLogs((prev) => [log, ...prev].slice(0, 30));
  };

  // Connect Wallet Handler
  const handleConnect = async () => {
    setZucchiniError(null);
    setIsConnecting(true);
    const start = Date.now();

    try {
      const activeProvider = useSimulator
        ? createVirtualZucchiniProvider({ network: "testnet" })
        : discoverZucchiniProvider();

      if (!activeProvider) {
        throw new Error(
          "Zucchini Wallet provider not found. Please enable the extension or use the Virtual Simulator."
        );
      }

      const client = createZucchiniClient(activeProvider);
      const conn = await client.connect({
        permissions: ["view_addresses", "send_transaction"],
      });
      const net = await client.network();

      const duration = Date.now() - start;
      addLog("zcash_connect", { permissions: ["view_addresses", "send_transaction"] }, conn, duration);

      setWalletState({
        isInstalled: true,
        isConnected: conn.connected,
        isSimulatorActive: useSimulator,
        network: net,
        accounts: conn.accounts,
        approvedPermissions: conn.approvedPermissions,
      });
    } catch (err) {
      const duration = Date.now() - start;
      const msg = err instanceof Error ? err.message : "Failed to connect to wallet.";
      setZucchiniError(msg);
      addLog("zcash_connect", null, null, duration, msg);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Handler
  const handleDisconnect = async () => {
    const start = Date.now();
    try {
      const activeProvider = useSimulator
        ? createVirtualZucchiniProvider({ network: "testnet" })
        : discoverZucchiniProvider();

      if (activeProvider) {
        const client = createZucchiniClient(activeProvider);
        await client.disconnect();
      }
      const duration = Date.now() - start;
      addLog("zcash_disconnect", null, { success: true }, duration);
    } catch {
      // Ignore disconnect error
    } finally {
      setWalletState((prev) => ({
        ...prev,
        isConnected: false,
        accounts: [],
        approvedPermissions: [],
        lastTxid: undefined,
      }));
    }
  };

  // Request Payment Handler
  const handleRequestPayment = async () => {
    setZucchiniError(null);
    setIsSubmitting(true);
    const start = Date.now();

    try {
      if (!walletState.isConnected) {
        throw new Error("Wallet must be connected before requesting payment approval.");
      }

      const activeProvider = useSimulator
        ? createVirtualZucchiniProvider({ network: "testnet" })
        : discoverZucchiniProvider();

      if (!activeProvider) {
        throw new Error("Provider not available.");
      }

      const client = createZucchiniClient(activeProvider);
      const result = await client.requestPayment(paymentUriInput.trim());

      const duration = Date.now() - start;
      addLog("zcash_requestPayment", { uri: paymentUriInput.trim() }, result, duration);

      setWalletState((prev) => ({
        ...prev,
        lastTxid: result.txid,
        isSimulatedTxid: useSimulator,
      }));
    } catch (err) {
      const duration = Date.now() - start;
      const msg = err instanceof Error ? err.message : "Payment request rejected by wallet.";
      setZucchiniError(msg);
      addLog("zcash_requestPayment", { uri: paymentUriInput.trim() }, null, duration, msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record Zodl manual test run
  const handleRecordZodlRun = (result: "passed" | "failed" | "parameter_rejected") => {
    if (!zodlResult) return;
    const run = createZodlTestRun({
      platform: zodlPlatform,
      network: zodlNetwork,
      uri: zodlResult.uri,
      checklist: zodlChecklist,
      result,
      observedTxid: zodlObservedTxid,
      notes: zodlNotes,
    });
    setZodlHistory((prev) => [run, ...prev]);
    setZodlObservedTxid("");
    setZodlNotes("");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const zodlRecipientInspection = zodlRecipient ? inspectAddress(zodlRecipient, zodlNetwork) : null;
  const isZodlTransparent = zodlRecipientInspection?.addressType === "transparent";
  const zodlMemoBytes = zodlMemo ? utf8ToBytes(zodlMemo).length : 0;

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <PageHeader
        badge="Multi-Wallet Standards Sandbox"
        badgeIcon={Layers}
        title="Wallet Compatibility Workbench"
        description="Test and validate shielded Zcash merchant payment flows across browser extension environments (Zucchini Wallet via Dapp SDK) and mobile air-gapped QR / deep-linking workflows (Zodl / Zashi)."
        actions={
          <div className="inline-flex rounded-lg bg-surface-elevated p-1 border border-surface-border text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("zucchini")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-all",
                activeTab === "zucchini"
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Zucchini (Browser)</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-primary-950 text-primary-300 border border-primary-800/60">
                SDK
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("zodl")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-all",
                activeTab === "zodl"
                  ? "bg-primary-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Zodl (Mobile)</span>
              <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                QR
              </span>
            </button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* TAB 1: ZUCCHINI WALLET (BROWSER EXTENSION / RPC) */}
      {/* ========================================================================= */}
      {activeTab === "zucchini" && (
        <div className="space-y-6">
          {/* Critical Settlement Rule Notice */}
          <SettlementRuleAlert
            title="The Broadcast vs. Settlement Rule"
            description="When requestPayment(uri) succeeds, the returned txid proves that the customer approved and broadcasted the transaction. It does NOT prove confirmed merchant receipt. Final merchant settlement must be verified by your backend viewing key scanner after block confirmations accumulate."
          />

          {/* Mode Selector & Detection Card */}
          <div className="p-4 rounded-xl border border-surface-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center border",
                  hasExtension
                    ? "bg-emerald-950/60 border-emerald-800/60 text-emerald-400"
                    : "bg-surface-elevated border-surface-border text-slate-400"
                )}
              >
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">Browser Wallet Provider</span>
                  {hasExtension ? (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Zucchini Extension Ready
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/50 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" /> Extension Not Found
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {hasExtension
                    ? "window.zucchini detected and available for direct connection."
                    : "No extension detected. You can use the Virtual Testnet Simulator to test the full flow."}
                </p>
              </div>
            </div>

            {/* Simulator Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs">
              <Sparkles className="w-3.5 h-3.5 text-primary-400" />
              <span className="text-slate-300 font-medium">Virtual Simulator:</span>
              <button
                type="button"
                onClick={() => {
                  setUseSimulator(!useSimulator);
                  if (walletState.isConnected) handleDisconnect();
                }}
                className={cn(
                  "px-2.5 py-0.5 rounded text-[11px] font-mono transition-colors",
                  useSimulator
                    ? "bg-primary-600 text-white font-semibold shadow-sm"
                    : "bg-surface-subtle text-slate-400 hover:text-slate-200"
                )}
              >
                {useSimulator ? "Active (Mock)" : "Disabled"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Interactive Sandbox Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Connection Card */}
              <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <div className="space-y-0.5">
                    <h2 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
                      Step 1: Permission Negotiation
                    </h2>
                    <p className="text-[11px] text-slate-500">Request permission to view accounts and send transactions</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-slate-400 border border-surface-border">
                    EIP-1193 / Zcash
                  </span>
                </div>

                {walletState.isConnected ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Connected Successfully
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface border border-emerald-800/40 text-emerald-200">
                          {walletState.network?.toUpperCase() || "TESTNET"}
                        </span>
                      </div>

                      {/* Connected Account */}
                      {walletState.accounts.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-mono text-slate-400">Connected Account</span>
                          <div className="p-2 rounded bg-surface border border-surface-border font-mono text-[11px] text-slate-200 break-all flex items-center justify-between">
                            <span className="truncate pr-2">{walletState.accounts[0].address}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(walletState.accounts[0].address)}
                              className="text-slate-400 hover:text-slate-200 shrink-0"
                              title="Copy address"
                            >
                              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Permissions Granted */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-mono text-slate-400">Approved Permissions</span>
                        <div className="flex flex-wrap gap-1.5">
                          {walletState.approvedPermissions.map((perm) => (
                            <span
                              key={perm}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-slate-300 border border-surface-border"
                            >
                              ✓ {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="w-full py-2 px-3 rounded-lg bg-surface-elevated hover:bg-red-950/40 hover:text-red-300 border border-surface-border hover:border-red-800/50 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <PowerOff className="w-3.5 h-3.5" /> Disconnect Session
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border text-xs space-y-2 text-slate-400">
                      <p>
                        Connecting calls <code className="text-primary-300 font-mono">wallet.connect()</code> and requests
                        explicit user approval for:
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-surface border border-surface-border text-slate-300">
                          • view_addresses
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface border border-surface-border text-slate-300">
                          • send_transaction
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={isConnecting}
                      className="w-full py-2.5 px-4 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs shadow-md shadow-primary-900/40 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isConnecting ? (
                        <>
                          <Activity className="w-3.5 h-3.5 animate-spin" /> Awaiting User Approval...
                        </>
                      ) : (
                        <>
                          <Wallet className="w-3.5 h-3.5" /> Connect Zcash Wallet
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Handoff Card */}
              <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <div className="space-y-0.5">
                    <h2 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
                      Step 2: ZIP-321 Payment Handoff
                    </h2>
                    <p className="text-[11px] text-slate-500">Dispatch payment URI directly to wallet review modal</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-slate-400 border border-surface-border">
                    requestPayment(uri)
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <label htmlFor="payment-uri-input" className="font-semibold text-slate-200">
                        ZIP-321 Payment URI to Test
                      </label>
                      <button
                        type="button"
                        onClick={() => setPaymentUriInput(SAMPLE_PAYMENT_URI)}
                        className="text-[10px] font-mono text-primary-400 hover:text-primary-300"
                      >
                        Reset Sample
                      </button>
                    </div>
                    <textarea
                      id="payment-uri-input"
                      rows={3}
                      value={paymentUriInput}
                      onChange={(e) => setPaymentUriInput(e.target.value)}
                      placeholder="zcash:utest1...?amount=0.001&memo=..."
                      className="w-full bg-surface-subtle border border-surface-border focus:border-primary-500 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all resize-none"
                    />
                  </div>

                  {zucchiniError && (
                    <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>{zucchiniError}</span>
                    </div>
                  )}

                  {walletState.lastTxid && (
                    <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Transaction Broadcasted by Wallet
                        </span>
                        {walletState.isSimulatedTxid && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary-950 text-primary-300 border border-primary-800/50">
                            Simulated
                          </span>
                        )}
                      </div>
                      <div className="p-2.5 rounded bg-surface border border-surface-border font-mono text-[11px] text-slate-200 break-all select-all flex items-center justify-between">
                        <span>{walletState.lastTxid}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(walletState.lastTxid!)}
                          className="text-slate-400 hover:text-slate-200 shrink-0 ml-2"
                          title="Copy txid"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        Status: <strong className="text-slate-300">Submitted to Mempool</strong>. Receipt confirmation
                        remains pending until detected by merchant viewing key scanner.
                      </p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleRequestPayment}
                    disabled={isSubmitting || !walletState.isConnected}
                    className="w-full py-2.5 px-4 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs shadow-md shadow-primary-900/40 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Activity className="w-3.5 h-3.5 animate-spin" /> Awaiting Wallet Approval...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Dispatch Payment Request to Wallet
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Live RPC & Event Audit Feed */}
            <div className="lg:col-span-5 border border-surface-border bg-surface rounded-xl p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-primary-400" />
                    <h2 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
                      RPC Interaction Log
                    </h2>
                  </div>
                  {logs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setLogs([])}
                      className="text-[10px] font-mono text-slate-500 hover:text-slate-300"
                    >
                      Clear Feed
                    </button>
                  )}
                </div>

                {/* Event Log Stream */}
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {logs.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-xs font-mono space-y-2">
                      <Activity className="w-8 h-8 mx-auto text-slate-600 stroke-[1.2]" />
                      <p>No wallet interactions recorded yet.</p>
                      <p className="text-[10px] text-slate-600">Connect a wallet or dispatch a payment request to stream RPC traces.</p>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-lg bg-surface-subtle border border-surface-border font-mono text-[11px] space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-primary-400 font-semibold">{log.method}</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500">{log.durationMs}ms</span>
                            <span
                              className={cn(
                                "px-1.5 py-0.2 rounded text-[9px] uppercase",
                                log.error ? "bg-red-950 text-red-300" : "bg-emerald-950 text-emerald-300"
                              )}
                            >
                              {log.error ? "ERR" : "OK"}
                            </span>
                          </div>
                        </div>

                        {log.params !== undefined && (
                          <div className="text-[10px] text-slate-400 truncate">
                            <span className="text-slate-500">params:</span> {JSON.stringify(log.params)}
                          </div>
                        )}

                        {log.result !== undefined && (
                          <div className="text-[10px] text-emerald-400/90 truncate">
                            <span className="text-slate-500">result:</span> {JSON.stringify(log.result)}
                          </div>
                        )}

                        {Boolean(log.error) && (
                          <div className="text-[10px] text-red-400 truncate">
                            <span className="text-slate-500">error:</span> {log.error}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>EIP-1193 / ZIP-321 Specification</span>
                <a
                  href="https://github.com/zucchini-wallet/dapp-sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary-400"
                >
                  SDK Docs <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ZODL WALLET (MOBILE / AIR-GAPPED QR & DEEP-LINK) */}
      {/* ========================================================================= */}
      {activeTab === "zodl" && (
        <div className="space-y-6">
          {/* Zodl Integration Profile Notice */}
          <div className="p-4 rounded-xl border border-surface-border bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
                <SmartphoneNfc className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-100">{ZODL_PROFILE.name} Mobile Wallet</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated text-slate-400 border border-surface-border">
                    Formerly {ZODL_PROFILE.formerName}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    Air-Gapped QR & Deep Link
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
                  {ZODL_PROFILE.developer} · Native iOS and Android clients. Mobile wallets do not inject desktop browser
                  providers (<code className="text-slate-300 font-mono">window.zodl</code> does not exist). Website-to-wallet
                  communication operates via <strong>ZIP-321 QR code scanning</strong> or <strong>OS-level deep linking</strong>.
                </p>
              </div>
            </div>

            <a
              href={ZODL_PROFILE.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-primary-400 hover:text-primary-300 flex items-center gap-1 shrink-0"
            >
              ZODL Repos <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: QR Generator & Parameter Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-5">
                {/* Network & Presets Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">Target Network:</span>
                    <div className="inline-flex rounded-lg bg-surface-elevated p-1 border border-surface-border text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => setZodlNetwork("testnet")}
                        className={cn(
                          "px-2.5 py-0.5 rounded transition-colors",
                          zodlNetwork === "testnet" ? "bg-primary-600 text-white font-semibold" : "text-slate-400"
                        )}
                      >
                        Testnet (Dev Build)
                      </button>
                      <button
                        type="button"
                        onClick={() => setZodlNetwork("mainnet")}
                        className={cn(
                          "px-2.5 py-0.5 rounded transition-colors",
                          zodlNetwork === "mainnet" ? "bg-primary-600 text-white font-semibold" : "text-slate-400"
                        )}
                      >
                        Mainnet (App Store)
                      </button>
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary-400" /> Presets:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setZodlNetwork(ZODL_PRESETS[0].network);
                        setZodlRecipient(ZODL_PRESETS[0].recipient);
                        setZodlAmount(ZODL_PRESETS[0].amount);
                        setZodlMemo(ZODL_PRESETS[0].memo);
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated border border-surface-border text-slate-400 hover:text-primary-300"
                    >
                      Testnet Unified
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setZodlNetwork(ZODL_PRESETS[1].network);
                        setZodlRecipient(ZODL_PRESETS[1].recipient);
                        setZodlAmount(ZODL_PRESETS[1].amount);
                        setZodlMemo(ZODL_PRESETS[1].memo);
                      }}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated border border-surface-border text-slate-400 hover:text-primary-300"
                    >
                      Mainnet Unified
                    </button>
                  </div>
                </div>

                {/* Recipient Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="zodl-recipient" className="font-semibold text-slate-200">
                      Zodl Recipient Address
                    </label>
                    {zodlRecipientInspection && zodlRecipientInspection.isValidFormat && (
                      <span className="text-[10px] font-mono text-emerald-400">
                        ✓ {zodlRecipientInspection.addressType} ({zodlRecipientInspection.detectedNetwork})
                      </span>
                    )}
                  </div>
                  <textarea
                    id="zodl-recipient"
                    rows={2}
                    value={zodlRecipient}
                    onChange={(e) => setZodlRecipient(e.target.value)}
                    placeholder="Unified (utest1/u1), Sapling (zs1), or Transparent (tm/t1)..."
                    className="w-full bg-surface-subtle border border-surface-border focus:border-primary-500 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all resize-none"
                  />
                </div>

                {/* Amount Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="zodl-amount" className="font-semibold text-slate-200">
                      Payment Amount (ZEC)
                    </label>
                    <span className="text-[10px] font-mono text-slate-500">Max 8 decimals</span>
                  </div>
                  <input
                    id="zodl-amount"
                    type="text"
                    value={zodlAmount}
                    onChange={(e) => setZodlAmount(e.target.value)}
                    placeholder="e.g. 0.05"
                    className="w-full bg-surface-subtle border border-surface-border focus:border-primary-500 rounded-lg p-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
                  />
                </div>

                {/* Memo Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="zodl-memo" className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span>Shielded Memo</span>
                      <span className="text-[10px] text-slate-500 font-normal font-mono">(Printable UTF-8, max 512B)</span>
                    </label>
                    <span
                      className={cn(
                        "text-[10px] font-mono",
                        zodlMemoBytes > 512 ? "text-red-400 font-bold" : "text-slate-500"
                      )}
                    >
                      {zodlMemoBytes} / 512 bytes
                    </span>
                  </div>
                  <textarea
                    id="zodl-memo"
                    rows={2}
                    value={zodlMemo}
                    disabled={isZodlTransparent}
                    onChange={(e) => setZodlMemo(e.target.value)}
                    placeholder={
                      isZodlTransparent
                        ? "Memos are forbidden for transparent addresses."
                        : "e.g. order_uuid_849 or invoice notes..."
                    }
                    className={cn(
                      "w-full border rounded-lg p-2.5 text-xs font-mono transition-all resize-none",
                      isZodlTransparent
                        ? "bg-surface-elevated/40 border-surface-border text-slate-500 cursor-not-allowed"
                        : "bg-surface-subtle border-surface-border focus:border-primary-500 text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    )}
                  />
                  {isZodlTransparent && (
                    <p className="text-[11px] text-amber-400/90 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Transparent addresses cannot receive shielded memos.
                    </p>
                  )}
                </div>

                {zodlError && (
                  <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{zodlError}</span>
                  </div>
                )}

                {/* Compatibility Invariant Warnings */}
                {zodlResult && zodlResult.warnings.length > 0 && (
                  <div className="p-3 rounded-lg bg-surface-subtle border border-surface-border text-xs space-y-1">
                    <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-primary-400" /> Wallet Compatibility Notice
                    </div>
                    <ul className="list-disc list-inside text-[11px] text-slate-400">
                      {zodlResult.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: QR Code & Deep Link View */}
            <div className="lg:col-span-5 border border-surface-border bg-surface rounded-xl p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-surface-border">
                  <h2 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
                    Zodl Scan QR Code
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                    ZIP-321 Air-Gapped
                  </span>
                </div>

                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/95 shadow-inner min-h-[220px]">
                  {zodlQrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={zodlQrDataUrl}
                      alt="Zcash ZIP-321 Zodl QR"
                      className="w-48 h-48 rounded object-contain"
                    />
                  ) : (
                    <div className="text-slate-500 text-xs font-mono text-center p-6 space-y-2">
                      <QrCode className="w-10 h-10 mx-auto text-slate-400 stroke-[1.2]" />
                      <p>Awaiting valid parameters...</p>
                    </div>
                  )}
                </div>

                {/* Deep Link Action */}
                {zodlResult && (
                  <div className="space-y-2">
                    <a
                      href={zodlResult.deepLink}
                      className="w-full py-2.5 px-4 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold text-xs shadow-md shadow-primary-900/40 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open in Zodl / Mobile Wallet (Deep Link)
                    </a>
                  </div>
                )}

                {/* URI Text */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-400">URI String:</span>
                    {zodlResult && (
                      <button
                        type="button"
                        onClick={() => handleCopy(zodlResult.uri)}
                        className="flex items-center gap-1 text-[11px] text-primary-400 hover:text-primary-300 font-mono transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy URI
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-subtle border border-surface-border font-mono text-[11px] text-slate-300 break-all select-all min-h-[50px] leading-relaxed">
                    {zodlResult ? zodlResult.uri : "zcash:<recipient>?amount=<amount>..."}
                  </div>
                </div>

                {/* Parameter Verification Pills */}
                {zodlResult && (
                  <div className="pt-2 border-t border-surface-border/60 grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="p-2 rounded bg-surface-subtle border border-surface-border">
                      <span className="text-slate-500 block text-[9px] uppercase">Zatoshis</span>
                      <span className="text-slate-200 font-semibold">{zodlResult.amountZatoshis}</span>
                    </div>
                    <div className="p-2 rounded bg-surface-subtle border border-surface-border">
                      <span className="text-slate-500 block text-[9px] uppercase">Memo Base64url</span>
                      <span className="text-slate-200 truncate block">
                        {zodlResult.memoBase64Url || "None"}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-surface-border flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>ZIP-321 Compatible</span>
                <span>Air-Gapped QR Ready</span>
              </div>
            </div>
          </div>

          {/* 5-Point Guided Compatibility Testing Checklist & Test Run Recorder */}
          <div className="border border-surface-border bg-surface rounded-xl p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  Zodl Manual Compatibility Verification Checklist
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scan the generated QR with your mobile device and verify how the Zodl app handles each ZIP-321 parameter.
                </p>
              </div>

              {/* Platform Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Platform:</span>
                <select
                  value={zodlPlatform}
                  onChange={(e) => setZodlPlatform(e.target.value as ZodlPlatform)}
                  className="bg-surface-elevated border border-surface-border rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200 focus:outline-none"
                >
                  <option value="ios">Zodl iOS (Swift)</option>
                  <option value="android">Zodl Android (Kotlin)</option>
                  <option value="debug_build">Developer Debug Build</option>
                </select>
              </div>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-subtle border border-surface-border cursor-pointer hover:bg-surface-elevated transition-colors">
                <input
                  type="checkbox"
                  checked={zodlChecklist.scannedSuccessfully}
                  onChange={(e) =>
                    setZodlChecklist({ ...zodlChecklist, scannedSuccessfully: e.target.checked })
                  }
                  className="rounded border-surface-border text-primary-600 focus:ring-0 mt-0.5"
                />
                <span className="text-slate-300">
                  <strong>1. QR Recognition:</strong> App camera scanned the QR code immediately without decode errors.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-subtle border border-surface-border cursor-pointer hover:bg-surface-elevated transition-colors">
                <input
                  type="checkbox"
                  checked={zodlChecklist.addressMatched}
                  onChange={(e) =>
                    setZodlChecklist({ ...zodlChecklist, addressMatched: e.target.checked })
                  }
                  className="rounded border-surface-border text-primary-600 focus:ring-0 mt-0.5"
                />
                <span className="text-slate-300">
                  <strong>2. Recipient Address:</strong> Displayed recipient in Zodl matches the URI address.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-subtle border border-surface-border cursor-pointer hover:bg-surface-elevated transition-colors">
                <input
                  type="checkbox"
                  checked={zodlChecklist.amountMatched}
                  onChange={(e) =>
                    setZodlChecklist({ ...zodlChecklist, amountMatched: e.target.checked })
                  }
                  className="rounded border-surface-border text-primary-600 focus:ring-0 mt-0.5"
                />
                <span className="text-slate-300">
                  <strong>3. Payment Amount:</strong> Displayed ZEC amount matches exact decimal value.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-subtle border border-surface-border cursor-pointer hover:bg-surface-elevated transition-colors">
                <input
                  type="checkbox"
                  checked={zodlChecklist.memoDecoded}
                  onChange={(e) =>
                    setZodlChecklist({ ...zodlChecklist, memoDecoded: e.target.checked })
                  }
                  className="rounded border-surface-border text-primary-600 focus:ring-0 mt-0.5"
                />
                <span className="text-slate-300">
                  <strong>4. Shielded Memo:</strong> Base64url memo decoded into UTF-8 text in note field.
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-surface-subtle border border-surface-border cursor-pointer hover:bg-surface-elevated transition-colors">
                <input
                  type="checkbox"
                  checked={zodlChecklist.feeCalculated}
                  onChange={(e) =>
                    setZodlChecklist({ ...zodlChecklist, feeCalculated: e.target.checked })
                  }
                  className="rounded border-surface-border text-primary-600 focus:ring-0 mt-0.5"
                />
                <span className="text-slate-300">
                  <strong>5. Fee & Review:</strong> Transaction fee estimated and ready for user signature.
                </span>
              </label>

              <div className="p-3 rounded-lg bg-primary-950/30 border border-primary-800/40 text-[11px] text-primary-200/90 flex items-center justify-between">
                <span>All 5 checkpoints verified?</span>
                <span className="font-mono font-semibold text-emerald-400">Ready to Record</span>
              </div>
            </div>

            {/* Test Run Metadata Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label htmlFor="observed-txid" className="text-xs font-semibold text-slate-200">
                  Observed Transaction ID (Optional from mobile wallet history)
                </label>
                <input
                  id="observed-txid"
                  type="text"
                  value={zodlObservedTxid}
                  onChange={(e) => setZodlObservedTxid(e.target.value)}
                  placeholder="Paste 64-character txid if transaction was broadcasted..."
                  className="w-full bg-surface-subtle border border-surface-border focus:border-primary-500 rounded-lg p-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="test-notes" className="text-xs font-semibold text-slate-200">
                  Audit Notes / Observation
                </label>
                <input
                  id="test-notes"
                  type="text"
                  value={zodlNotes}
                  onChange={(e) => setZodlNotes(e.target.value)}
                  placeholder="e.g. Scanned on Zodl iOS v1.2, instant memo decode..."
                  className="w-full bg-surface-subtle border border-surface-border focus:border-primary-500 rounded-lg p-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Record Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleRecordZodlRun("passed")}
                disabled={!zodlResult}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Record Result: Passed Compatibility
              </button>

              <button
                type="button"
                onClick={() => handleRecordZodlRun("parameter_rejected")}
                disabled={!zodlResult}
                className="px-4 py-2 rounded-lg bg-surface-elevated hover:bg-amber-950/40 hover:text-amber-300 border border-surface-border hover:border-amber-800/50 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Record Parameter Rejected
              </button>

              <button
                type="button"
                onClick={() => handleRecordZodlRun("failed")}
                disabled={!zodlResult}
                className="px-4 py-2 rounded-lg bg-surface-elevated hover:bg-red-950/40 hover:text-red-300 border border-surface-border hover:border-red-800/50 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <AlertCircle className="w-3.5 h-3.5" /> Record Scan Failed
              </button>
            </div>

            {/* Audit History Log */}
            {zodlHistory.length > 0 && (
              <div className="pt-4 border-t border-surface-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-300 flex items-center gap-1.5">
                    <FileCheck2 className="w-3.5 h-3.5 text-primary-400" />
                    Recorded Compatibility Audit Runs ({zodlHistory.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setZodlHistory([])}
                    className="text-[10px] font-mono text-slate-500 hover:text-slate-300"
                  >
                    Clear Runs
                  </button>
                </div>

                <div className="space-y-2">
                  {zodlHistory.map((run) => (
                    <div
                      key={run.id}
                      className="p-3 rounded-lg bg-surface-subtle border border-surface-border text-xs font-mono space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-semibold uppercase",
                              run.result === "passed"
                                ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                                : run.result === "parameter_rejected"
                                ? "bg-amber-950 text-amber-300 border border-amber-800/60"
                                : "bg-red-950 text-red-300 border border-red-800/60"
                            )}
                          >
                            {run.result.replace("_", " ")}
                          </span>
                          <span className="text-slate-300 font-semibold capitalize">{run.platform.replace("_", " ")}</span>
                          <span className="text-slate-500 uppercase text-[10px]">({run.network})</span>
                        </div>
                        <span className="text-slate-500 text-[10px]">
                          {new Date(run.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 truncate">
                        <span className="text-slate-500">URI:</span> {run.uri}
                      </div>

                      {run.observedTxid && (
                        <div className="text-[10px] text-emerald-400/90 truncate">
                          <span className="text-slate-500">Observed txid:</span> {run.observedTxid}
                        </div>
                      )}

                      {run.notes && (
                        <div className="text-[11px] text-slate-300 font-sans italic">
                          &ldquo;{run.notes}&rdquo;
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-[10px] text-slate-500 italic">
                  * Note: Manual audit records document developer observations. They do not constitute on-chain settlement confirmation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
