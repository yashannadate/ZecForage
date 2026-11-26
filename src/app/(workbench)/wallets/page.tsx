"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import QRCode from "qrcode";
import {
  Wallet,
  Smartphone,
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
  QrCode,
  CheckSquare,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  createZucchiniClient,
  discoverZucchiniProvider,
  createVirtualZucchiniProvider,
  withWalletTimeout,
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
import { inspectAddress } from "@/lib/zcash/addresses";
import { parseZip321Uri, utf8ToBytes } from "@/lib/zcash/zip321";
import {
  appendWorkbenchActivity,
  loadWorkbenchState,
  saveWorkbenchState,
} from "@/lib/settings/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettlementRuleAlert } from "@/components/ui/SettlementRuleAlert";
import { cn } from "@/lib/utils";

const SAMPLE_PAYMENT_URI =
  "zcash:utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq?amount=0.001&memo=b3JkZXJfZGV2XzEwMQ";

const ZODL_TESTNET_PRESETS = [
  {
    name: "Testnet Unified (0.05)",
    recipient:
      "utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
    amount: "0.05",
    memo: "Zodl Testnet Invoice #1024",
  },
  {
    name: "Testnet Sapling (0.02)",
    recipient:
      "ztestsapling1000000000000000000000000000000000000000000000000000000000000000000000000000",
    amount: "0.02",
    memo: "Zodl Sapling Checkout",
  },
  {
    name: "Testnet Transparent (0.1)",
    recipient: "tm9iMLAuYMzJ6kWYEqQCzNhpW9gSnhmXv2X",
    amount: "0.1",
    memo: "",
  },
];

export default function WalletSandboxPage() {
  const [activeTab, setActiveTab] = useState<"zucchini" | "zodl">("zucchini");

  // --- ZUCCHINI (TESTNET ONLY) ---
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
  const [builderSyncedUri, setBuilderSyncedUri] = useState<string | null>(null);
  const [logs, setLogs] = useState<WalletRpcLog[]>([]);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [zucchiniError, setZucchiniError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // --- ZODL iOS / ANDROID (TESTNET ONLY) ---
  const [zodlRecipient, setZodlRecipient] = useState<string>(ZODL_TESTNET_PRESETS[0].recipient);
  const [zodlAmount, setZodlAmount] = useState<string>(ZODL_TESTNET_PRESETS[0].amount);
  const [zodlMemo, setZodlMemo] = useState<string>(ZODL_TESTNET_PRESETS[0].memo);
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

  const virtualProviderRef = useRef<ReturnType<typeof createVirtualZucchiniProvider> | null>(null);
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  const clearProviderListeners = useCallback(() => {
    unsubscribeRefs.current.forEach((unsub) => {
      try {
        unsub();
      } catch {
        // ignore
      }
    });
    unsubscribeRefs.current = [];
  }, []);

  const detectExtension = useCallback(() => {
    if (typeof window === "undefined") return false;
    const detected = Boolean(discoverZucchiniProvider());
    setHasExtension(detected);
    setWalletState((prev) => ({ ...prev, isInstalled: detected }));
    return detected;
  }, []);

  useEffect(() => {
    const detected = detectExtension();
    if (!detected) setUseSimulator(true);

    const syncFromStore = () => {
      const saved = loadWorkbenchState();
      setBuilderSyncedUri(saved.lastGeneratedUri || null);
      if (saved.zodlHistory.length > 0) {
        setZodlHistory(
          saved.zodlHistory.map((h, idx) => ({
            id: h.id || `zodl_run_${idx}_${h.timestamp}`,
            timestamp: h.timestamp,
            platform: h.platform || "ios",
            network: "testnet",
            uri: h.uri || "",
            checklist: h.checklist,
            result: h.result,
            observedTxid: h.observedTxid,
            notes: h.notes,
            isManualRecord: true,
          }))
        );
      }
    };
    syncFromStore();
    window.addEventListener("zecforage:state-updated", syncFromStore);
    return () => {
      clearProviderListeners();
      window.removeEventListener("zecforage:state-updated", syncFromStore);
    };
  }, [clearProviderListeners, detectExtension]);

  // Build Zodl Testnet payment request dynamically
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
        network: "testnet",
      });
      setZodlResult(result);
      QRCode.toDataURL(result.uri, {
        width: 300,
        margin: 2,
        color: { dark: "#0F1626", light: "#FFFFFF" },
      })
        .then((url) => setZodlQrDataUrl(url))
        .catch(() => setZodlQrDataUrl(""));
    } catch (err) {
      setZodlResult(null);
      setZodlQrDataUrl("");
      setZodlError(err instanceof Error ? err.message : "Invalid Testnet Zodl parameters.");
    }
  }, [zodlRecipient, zodlAmount, zodlMemo]);

  const getActiveProvider = useCallback(() => {
    if (useSimulator) {
      if (!virtualProviderRef.current) {
        virtualProviderRef.current = createVirtualZucchiniProvider({ network: "testnet" });
      }
      return virtualProviderRef.current;
    }
    return discoverZucchiniProvider();
  }, [useSimulator]);

  const addLog = (
    method: string,
    params: unknown,
    result: unknown,
    durationMs: number,
    err?: string
  ) => {
    const log: WalletRpcLog = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      method,
      params,
      result,
      error: err,
      durationMs,
      source: useSimulator ? "virtual_simulator" : "real_extension",
    };
    setLogs((prev) => [log, ...prev].slice(0, 20));
  };

  const handleCopy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      setCopiedKey(null);
    }
  };

  const handleLoadFromBuilderForZucchini = () => {
    if (!builderSyncedUri) return;
    setZucchiniError(null);
    setPaymentUriInput(builderSyncedUri);
  };

  const handleLoadFromBuilderForZodl = () => {
    if (!builderSyncedUri) return;
    setZodlError(null);
    try {
      const parsed = parseZip321Uri(builderSyncedUri, "testnet");
      setZodlRecipient(parsed.recipient);
      setZodlAmount(parsed.amount);
      setZodlMemo(parsed.memoText || "");
    } catch (err) {
      setZodlError(err instanceof Error ? err.message : "Synced Builder URI is invalid for Testnet.");
    }
  };

  const handleConnect = async () => {
    setZucchiniError(null);
    setIsConnecting(true);
    const start = Date.now();
    clearProviderListeners();

    try {
      const activeProvider = getActiveProvider();
      if (!activeProvider) {
        throw new Error(
          "Zucchini browser extension not found. Enable the extension or switch to Virtual Simulator."
        );
      }

      const client = createZucchiniClient(activeProvider);
      const conn = await withWalletTimeout(
        client.connect({ permissions: ["view_addresses", "send_transaction"] }),
        30000,
        "Wallet connection timed out waiting for user approval."
      );

      if (!conn || typeof conn.connected !== "boolean" || !Array.isArray(conn.accounts)) {
        throw new Error("Malformed connection response returned by wallet.");
      }
      if (!conn.connected) {
        throw new Error("Connection rejected by user.");
      }

      const net = await withWalletTimeout(client.network(), 10000, "Network detection timed out.");
      if (net !== "testnet" && net !== "mainnet") {
        throw new Error(`Unsupported wallet network '${String(net)}'.`);
      }

      const unsubDisc = client.on("disconnect", () => {
        setWalletState((prev) => ({
          ...prev,
          isConnected: false,
          network: undefined,
          accounts: [],
          approvedPermissions: [],
          lastTxid: undefined,
        }));
        addLog("event:disconnect", null, { disconnected: true }, 0);
      });

      const unsubAcc = client.on("accountsChanged", (accountsVal: unknown) => {
        if (Array.isArray(accountsVal)) {
          const normalized = accountsVal.map((item, idx) =>
            typeof item === "string"
              ? { name: `Account ${idx + 1}`, address: item }
              : (item as { name: string; address: string })
          );
          setWalletState((prev) => ({ ...prev, accounts: normalized }));
          addLog("event:accountsChanged", null, { count: normalized.length }, 0);
        }
      });

      if (typeof unsubDisc === "function") unsubscribeRefs.current.push(unsubDisc);
      if (typeof unsubAcc === "function") unsubscribeRefs.current.push(unsubAcc);

      addLog("zcash_connect", { permissions: ["view_addresses", "send_transaction"] }, conn, Date.now() - start);
      setWalletState({
        isInstalled: true,
        isConnected: true,
        isSimulatorActive: useSimulator,
        network: net,
        accounts: conn.accounts,
        approvedPermissions: conn.approvedPermissions,
      });

      if (net !== "testnet") {
        setZucchiniError(
          "Extension is set to Mainnet. ZecForage is locked to Testnet-only mode — switch Zucchini Wallet to Testnet before dispatching payments."
        );
      }

      appendWorkbenchActivity({
        tool: "Wallet Compatibility",
        label: `Connected Zucchini (${useSimulator ? "virtual simulator" : "browser extension"}, ${net})`,
        kind: useSimulator ? "simulated" : "local",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to connect to wallet.";
      setZucchiniError(msg);
      addLog("zcash_connect", null, null, Date.now() - start, msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const start = Date.now();
    clearProviderListeners();
    try {
      const activeProvider = getActiveProvider();
      if (activeProvider) {
        const client = createZucchiniClient(activeProvider);
        await withWalletTimeout(client.disconnect(), 10000, "Disconnect timed out.");
      }
      addLog("zcash_disconnect", null, { success: true }, Date.now() - start);
    } catch (err) {
      addLog("zcash_disconnect", null, null, Date.now() - start, err instanceof Error ? err.message : "Disconnect error");
    } finally {
      if (useSimulator) virtualProviderRef.current = null;
      setWalletState((prev) => ({
        ...prev,
        isConnected: false,
        network: undefined,
        accounts: [],
        approvedPermissions: [],
        lastTxid: undefined,
        isSimulatedTxid: undefined,
      }));
    }
  };

  const handleRequestPayment = async () => {
    setZucchiniError(null);
    setIsSubmitting(true);
    const start = Date.now();

    try {
      if (!walletState.isConnected) {
        throw new Error("Connect wallet before dispatching a payment request.");
      }
      if (walletState.network !== "testnet") {
        throw new Error("Payments are blocked while wallet is on Mainnet. Switch to Zcash Testnet.");
      }

      const trimmedUri = paymentUriInput.trim();
      parseZip321Uri(trimmedUri, "testnet");

      const activeProvider = getActiveProvider();
      if (!activeProvider) {
        throw new Error("Wallet provider not available.");
      }

      const client = createZucchiniClient(activeProvider);
      const result = await withWalletTimeout(
        client.requestPayment(trimmedUri),
        45000,
        "Payment approval timed out waiting for user signature."
      );

      if (!result || typeof result.txid !== "string" || result.txid.trim().length === 0) {
        throw new Error("Malformed payment response: missing txid.");
      }

      addLog("zcash_requestPayment", { uri: trimmedUri }, result, Date.now() - start);
      setWalletState((prev) => ({
        ...prev,
        lastTxid: result.txid,
        isSimulatedTxid: useSimulator,
      }));
      saveWorkbenchState({
        checklist: { ...loadWorkbenchState().checklist, step2: true },
      });
      appendWorkbenchActivity({
        tool: "Wallet Compatibility",
        label: useSimulator
          ? "Simulated Zucchini payment broadcast (mock txid)"
          : "Dispatched real Testnet ZIP-321 payment to Zucchini extension",
        kind: useSimulator ? "simulated" : "local",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment request rejected.";
      setZucchiniError(msg);
      addLog("zcash_requestPayment", { uri: paymentUriInput.trim() }, null, Date.now() - start, msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadZodlQr = () => {
    if (!zodlQrDataUrl) return;
    const a = document.createElement("a");
    a.href = zodlQrDataUrl;
    a.download = `zecforage-zodl-${zodlPlatform}-testnet-qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRecordZodlRun = (result: "passed" | "failed" | "parameter_rejected") => {
    if (!zodlResult) return;
    const trimmedTxid = zodlObservedTxid.trim();
    if (trimmedTxid && !/^[a-fA-F0-9]{64}$/.test(trimmedTxid)) {
      setZodlError("Observed txid must be a 64-character hexadecimal string.");
      return;
    }
    setZodlError(null);
    const run = createZodlTestRun({
      platform: zodlPlatform,
      network: "testnet",
      uri: zodlResult.uri,
      checklist: zodlChecklist,
      result,
      observedTxid: trimmedTxid || undefined,
      notes: zodlNotes,
    });
    const nextHistory = [run, ...zodlHistory].slice(0, 10);
    setZodlHistory(nextHistory);
    saveWorkbenchState({
      checklist: { ...loadWorkbenchState().checklist, step2: true },
      zodlRun: {
        id: run.id,
        platform: run.platform,
        network: "testnet",
        uri: run.uri,
        notes: run.notes,
        result: run.result,
        checklist: run.checklist,
        observedTxid: run.observedTxid,
        timestamp: run.timestamp,
      },
      zodlHistory: nextHistory.map((item) => ({
        id: item.id,
        platform: item.platform,
        network: item.network,
        uri: item.uri,
        notes: item.notes,
        result: item.result,
        checklist: item.checklist,
        observedTxid: item.observedTxid,
        timestamp: item.timestamp,
      })),
    });
    appendWorkbenchActivity({
      tool: "Zodl Mobile",
      label: `Recorded ${zodlPlatform} Testnet check (${result})`,
      kind: "local",
    });
    setZodlObservedTxid("");
    setZodlNotes("");
  };

  const zodlInspection = zodlRecipient ? inspectAddress(zodlRecipient, "testnet") : null;
  const isZodlTransparent = zodlInspection?.addressType === "transparent";
  const zodlMemoBytes = zodlMemo ? utf8ToBytes(zodlMemo).length : 0;

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        badge="Wallet Compatibility · Zcash Testnet Only"
        badgeIcon={Layers}
        title="Wallet Compatibility Sandbox"
        description="Test Zucchini Dapp SDK browser connections and Zodl iOS/Android ZIP-321 QR & deep-link handoffs strictly on Zcash Testnet."
        actions={
          <div className="flex flex-wrap w-full sm:w-auto rounded-lg bg-[#080808] p-1 border border-[#262626] gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("zucchini")}
              className={cn(
                "min-h-10 flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                activeTab === "zucchini"
                  ? "bg-white text-black"
                  : "text-[#929292] hover:text-white"
              )}
            >
              <Wallet className="w-4 h-4" />
              <span>Zucchini (Browser)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("zodl")}
              className={cn(
                "min-h-10 flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                activeTab === "zodl"
                  ? "bg-white text-black"
                  : "text-[#929292] hover:text-white"
              )}
            >
              <Smartphone className="w-4 h-4" />
              <span>Zodl (iOS / Android)</span>
            </button>
          </div>
        }
      />

      {activeTab === "zucchini" ? (
        <div className="space-y-6">
          <SettlementRuleAlert
            title="Broadcast vs. Settlement Rule"
            description="A wallet-returned txid indicates customer broadcast to the Testnet mempool (or mock output in Simulator mode). It does not prove confirmed merchant receipt."
          />

          {/* Provider Detection & Simulator Toggle */}
          <div className="p-4 rounded-lg border border-[#262626] bg-[#080808] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-white">Zucchini Provider (Testnet Only)</span>
                {hasExtension ? (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                    Extension Ready
                  </span>
                ) : (
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-black text-[#929292] border border-[#262626]">
                    Not Detected in Browser
                  </span>
                )}
              </div>
              <p className="text-sm text-[#929292]">
                {hasExtension
                  ? "window.zucchini detected. Real extension connection available."
                  : "No browser extension found. Enable Virtual Simulator to test Dapp SDK calls."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => detectExtension()}
                className="min-h-9 inline-flex items-center gap-1.5 px-3 rounded-md border border-[#262626] bg-black text-sm font-medium text-[#929292] hover:text-white transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Re-scan</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextMode = !useSimulator;
                  setUseSimulator(nextMode);
                  setZucchiniError(null);
                  if (walletState.isConnected) {
                    void handleDisconnect();
                  } else {
                    virtualProviderRef.current = null;
                  }
                }}
                className={cn(
                  "min-h-9 px-3 rounded-md text-sm font-medium border transition-colors",
                  useSimulator
                    ? "bg-white text-black border-white"
                    : "bg-black border-[#262626] text-[#929292] hover:text-white"
                )}
              >
                {useSimulator ? "Virtual Simulator: On (Mock)" : "Virtual Simulator: Off"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1 */}
              <div className="p-5 rounded-lg border border-[#262626] bg-[#080808] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262626]">
                  <h2 className="text-base font-medium text-white">1. Connect Session</h2>
                  <span className="text-xs font-mono uppercase tracking-wider text-[#929292]">
                    view_addresses · send_transaction
                  </span>
                </div>

                {walletState.isConnected ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-md bg-black border border-[#262626] space-y-2.5 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          {walletState.isSimulatorActive ? "Connected (Virtual Simulator)" : "Connected (Extension)"}
                        </span>
                        <span className="text-xs font-mono uppercase px-2 py-0.5 rounded border border-[#262626] text-cyan-300">
                          {walletState.network || "unknown"}
                        </span>
                      </div>
                      {walletState.accounts[0] && (
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#262626]">
                          <code className="text-xs font-mono text-[#929292] truncate">
                            {walletState.accounts[0].address}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy("acct", walletState.accounts[0].address)}
                            className="min-h-8 min-w-8 flex items-center justify-center rounded border border-[#262626] text-[#929292] hover:text-white shrink-0"
                            aria-label="Copy connected address"
                          >
                            {copiedKey === "acct" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="flex-1 min-h-10 px-4 rounded-md border border-[#262626] bg-transparent hover:bg-neutral-900 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <PowerOff className="w-4 h-4" /> Disconnect
                      </button>
                      <button
                        type="button"
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="min-h-10 px-4 rounded-md border border-[#262626] bg-transparent hover:bg-neutral-900 text-[#929292] hover:text-white text-sm font-medium transition-colors"
                      >
                        Reconnect
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full min-h-11 px-4 rounded-md bg-white text-black font-medium hover:bg-neutral-200 text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {isConnecting ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin" /> Awaiting Approval...
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" /> Connect Zucchini ({useSimulator ? "Simulator" : "Extension"})
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-lg border border-[#262626] bg-[#080808] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262626]">
                  <h2 className="text-base font-medium text-white">2. Testnet Payment Handoff</h2>
                  <div className="flex items-center gap-2">
                    {builderSyncedUri && (
                      <button
                        type="button"
                        onClick={handleLoadFromBuilderForZucchini}
                        className="text-xs font-mono text-cyan-300 hover:text-white"
                      >
                        Use Builder URI
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setPaymentUriInput(SAMPLE_PAYMENT_URI)}
                      className="text-xs font-mono text-[#929292] hover:text-white"
                    >
                      Reset Sample
                    </button>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={paymentUriInput}
                  onChange={(e) => setPaymentUriInput(e.target.value)}
                  placeholder="zcash:utest1...?amount=0.001&memo=..."
                  className="w-full bg-black border border-[#262626] rounded-md p-3 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 resize-none"
                />

                {zucchiniError && (
                  <div className="p-3 rounded-md bg-rose-950/30 border border-rose-800/40 text-rose-300 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{zucchiniError}</span>
                  </div>
                )}

                {walletState.lastTxid && (
                  <div className="p-3.5 rounded-md bg-emerald-950/20 border border-emerald-800/40 space-y-2 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-emerald-300 font-medium">
                        {walletState.isSimulatedTxid
                          ? "Simulated Payment Completed (Mock Txid)"
                          : "Broadcasted to Testnet Mempool (Unconfirmed)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2 rounded bg-black border border-[#262626]">
                      <code className="text-xs font-mono text-white break-all">{walletState.lastTxid}</code>
                      <button
                        type="button"
                        onClick={() => handleCopy("txid", walletState.lastTxid!)}
                        className="min-h-8 min-w-8 flex items-center justify-center rounded border border-[#262626] text-[#929292] hover:text-white shrink-0"
                        aria-label="Copy txid"
                      >
                        {copiedKey === "txid" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRequestPayment}
                  disabled={isSubmitting || !walletState.isConnected || walletState.network !== "testnet"}
                  className="w-full min-h-11 px-4 rounded-md bg-white text-black font-medium hover:bg-neutral-200 text-sm transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" /> Awaiting Wallet Approval...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Dispatch Testnet requestPayment(uri)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* RPC Log */}
            <div className="lg:col-span-5 border border-[#262626] bg-[#080808] rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                  <h2 className="text-base font-medium text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-300" />
                    RPC Trace Log
                  </h2>
                  {logs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setLogs([])}
                      className="text-xs font-mono text-[#929292] hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-sm text-[#929292] py-10 text-center">
                      No RPC interactions recorded yet.
                    </p>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-md bg-black border border-[#262626] font-mono text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-cyan-300">{log.method}</span>
                          <span className={log.error ? "text-rose-400" : "text-emerald-400"}>
                            {log.durationMs}ms · {log.error ? "ERR" : "OK"}
                          </span>
                        </div>
                        <div className="text-[#929292] truncate">
                          {log.error || JSON.stringify(log.result)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-xs text-[#929292] font-mono">
                <span>EIP-1193 / Testnet Only</span>
                <a
                  href="https://github.com/zucchini-wallet/dapp-sdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-white"
                >
                  SDK Docs <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ZODL iOS & ANDROID (TESTNET ONLY) */
        <div className="space-y-6">
          <div className="p-4 rounded-lg border border-[#262626] bg-[#080808] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-white">
                  {ZODL_PROFILE.name} (formerly {ZODL_PROFILE.formerName}) · iOS &amp; Android Testnet Handoff
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-black border border-[#262626] text-cyan-300">
                  Air-Gapped QR &amp; Deep Link
                </span>
              </div>
              <p className="text-sm text-[#929292] leading-relaxed">
                Mobile Zodl does not inject <code className="text-white">window.zodl</code>. iOS and Android Testnet developer builds connect one-way via ZIP-321 QR scanning or <code className="text-white">zcash:</code> deep linking (App Store Mainnet builds reject <code className="text-white">utest1</code> URIs).
              </p>
            </div>
            <a
              href={ZODL_PROFILE.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-cyan-300 hover:text-white flex items-center gap-1 shrink-0"
            >
              ZODL Repos <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Zodl Request Controls */}
            <div className="lg:col-span-7 border border-[#262626] bg-[#080808] rounded-lg p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262626]">
                <h2 className="text-base font-medium text-white">Testnet Mobile Payment Request</h2>
                <div className="flex flex-wrap items-center gap-1.5">
                  {builderSyncedUri && (
                    <button
                      type="button"
                      onClick={handleLoadFromBuilderForZodl}
                      className="min-h-8 px-2.5 rounded-md border border-cyan-800/60 bg-cyan-950/30 text-xs font-mono text-cyan-300 hover:text-white"
                    >
                      Load from Builder
                    </button>
                  )}
                  {ZODL_TESTNET_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setZodlRecipient(p.recipient);
                        setZodlAmount(p.amount);
                        setZodlMemo(p.memo);
                      }}
                      className="min-h-8 px-2.5 rounded-md border border-[#262626] bg-black text-xs text-[#929292] hover:text-white"
                    >
                      <Sparkles className="w-3.5 h-3.5 inline mr-1 text-cyan-300" />
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-white">Testnet Recipient</span>
                <textarea
                  rows={2}
                  value={zodlRecipient}
                  onChange={(e) => setZodlRecipient(e.target.value)}
                  className="w-full bg-black border border-[#262626] rounded-md p-2.5 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 resize-none"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-sm font-medium text-white">Amount (ZEC)</span>
                  <input
                    type="text"
                    value={zodlAmount}
                    onChange={(e) => setZodlAmount(e.target.value)}
                    className="w-full min-h-10 bg-black border border-[#262626] rounded-md px-3 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-300"
                  />
                </label>

                <label className="block space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">Shielded Memo</span>
                    <span className="text-xs font-mono text-[#929292]">{zodlMemoBytes}/512B</span>
                  </div>
                  <input
                    type="text"
                    value={zodlMemo}
                    disabled={isZodlTransparent}
                    onChange={(e) => setZodlMemo(e.target.value)}
                    placeholder={isZodlTransparent ? "Forbidden for t-address" : "Optional UTF-8 memo"}
                    className="w-full min-h-10 bg-black border border-[#262626] rounded-md px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-300 disabled:opacity-40"
                  />
                </label>
              </div>

              {/* Platform Handoff Notes */}
              <div className="rounded-md border border-[#262626] bg-black p-3.5 space-y-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#929292]">
                    Target Mobile Client
                  </span>
                  <div className="flex gap-1">
                    {(
                      [
                        { id: "ios", label: "iOS (Swift)" },
                        { id: "android", label: "Android (Kotlin)" },
                        { id: "debug_build", label: "Debug Build" },
                      ] as const
                    ).map((plat) => (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => setZodlPlatform(plat.id)}
                        className={cn(
                          "min-h-8 px-2.5 rounded text-xs font-medium border transition-colors",
                          zodlPlatform === plat.id
                            ? "bg-white text-black border-white"
                            : "bg-[#080808] text-[#929292] border-[#262626] hover:text-white"
                        )}
                      >
                        {plat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-[#929292]">
                  {zodlPlatform === "ios"
                    ? "iOS Testnet builds register the zcash: URL scheme for Safari handoff and parse single-recipient ZIP-321 QR codes via camera."
                    : zodlPlatform === "android"
                    ? "Android Testnet builds handle zcash: ACTION_VIEW intents from mobile Chrome and scan ZIP-321 QR codes directly in-app."
                    : "Developer debug builds allow inspecting decoded UTF-8 memo bytes and Testnet fee estimates before signing."}
                </p>
              </div>

              {zodlError && (
                <div className="p-3 rounded-md bg-rose-950/30 border border-rose-800/40 text-rose-300 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{zodlError}</span>
                </div>
              )}
            </div>

            {/* QR & Deep Link Card */}
            <div className="lg:col-span-5 border border-[#262626] bg-[#080808] rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                  <h2 className="text-base font-medium text-white">Zodl Scan QR</h2>
                  <span className="text-xs font-mono text-cyan-300 uppercase">ZIP-321 Testnet</span>
                </div>

                <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-white min-h-[200px]">
                  {zodlQrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={zodlQrDataUrl} alt="Zodl Testnet ZIP-321 QR" className="w-44 h-44 object-contain" />
                  ) : (
                    <QrCode className="w-10 h-10 text-[#929292]" />
                  )}
                </div>

                {zodlResult && (
                  <div className="space-y-2">
                    <a
                      href={zodlResult.deepLink}
                      className="w-full min-h-10 px-4 rounded-md bg-white text-black font-medium hover:bg-neutral-200 text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" /> Open zcash: Deep Link ({zodlPlatform === "ios" ? "iOS" : zodlPlatform === "android" ? "Android" : "Device"})
                    </a>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy("zodl-uri", zodlResult.uri)}
                        className="min-h-9 px-3 rounded-md border border-[#262626] text-sm font-medium text-white hover:bg-neutral-900 flex items-center justify-center gap-1.5"
                      >
                        {copiedKey === "zodl-uri" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedKey === "zodl-uri" ? "Copied" : "Copy URI"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadZodlQr}
                        disabled={!zodlQrDataUrl}
                        className="min-h-9 px-3 rounded-md border border-[#262626] text-sm font-medium text-white hover:bg-neutral-900 flex items-center justify-center gap-1.5 disabled:opacity-40"
                      >
                        <Download className="w-4 h-4" /> Save QR
                      </button>
                    </div>
                  </div>
                )}

                <code className="block p-2.5 rounded-md bg-black border border-[#262626] font-mono text-xs text-[#929292] break-all">
                  {zodlResult ? zodlResult.uri : "zcash:<testnet_address>?amount=..."}
                </code>
              </div>
            </div>
          </div>

          {/* 5-Point Physical Device Verification Recorder */}
          <div className="border border-[#262626] bg-[#080808] rounded-lg p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262626]">
              <h2 className="text-base font-medium text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Manual Mobile Verification Log (Saved Locally)
              </h2>
              <span className="text-xs font-mono text-[#929292]">Synced to Audit Report</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-sm">
              {[
                ["scannedSuccessfully", "1. QR Scanned"],
                ["addressMatched", "2. Address Match"],
                ["amountMatched", "3. Amount Match"],
                ["memoDecoded", "4. Memo Decoded"],
                ["feeCalculated", "5. Fee Estimated"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 p-2.5 rounded-md bg-black border border-[#262626] cursor-pointer hover:border-neutral-700"
                >
                  <input
                    type="checkbox"
                    checked={zodlChecklist[key as keyof typeof zodlChecklist]}
                    onChange={(e) =>
                      setZodlChecklist({ ...zodlChecklist, [key]: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#35C9E8]"
                  />
                  <span className="text-white text-sm">{label}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={zodlObservedTxid}
                onChange={(e) => setZodlObservedTxid(e.target.value)}
                placeholder="Optional observed Testnet 64-char hex txid..."
                className="w-full min-h-10 bg-black border border-[#262626] rounded-md px-3 text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-cyan-300"
              />
              <input
                type="text"
                value={zodlNotes}
                onChange={(e) => setZodlNotes(e.target.value)}
                placeholder="Device observation notes (e.g. Zodl iOS Testnet build)..."
                className="w-full min-h-10 bg-black border border-[#262626] rounded-md px-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-cyan-300"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleRecordZodlRun("passed")}
                disabled={!zodlResult}
                className="min-h-10 px-4 rounded-md bg-white hover:bg-neutral-200 text-black font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Record Result: Passed Compatibility
              </button>
              <button
                type="button"
                onClick={() => handleRecordZodlRun("parameter_rejected")}
                disabled={!zodlResult}
                className="min-h-10 px-4 rounded-md border border-[#262626] hover:bg-neutral-900 text-[#929292] hover:text-white text-sm font-medium transition-colors disabled:opacity-40"
              >
                Parameter Rejected
              </button>
              <button
                type="button"
                onClick={() => handleRecordZodlRun("failed")}
                disabled={!zodlResult}
                className="min-h-10 px-4 rounded-md border border-[#262626] hover:bg-neutral-900 text-[#929292] hover:text-rose-300 text-sm font-medium transition-colors disabled:opacity-40"
              >
                Scan Failed
              </button>
            </div>

            {zodlHistory.length > 0 && (
              <div className="pt-3 border-t border-[#262626] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-[#929292]">
                  <span>Recorded Device Runs ({zodlHistory.length})</span>
                  <button
                    type="button"
                    onClick={() => {
                      setZodlHistory([]);
                      saveWorkbenchState({ zodlHistory: [], zodlRun: undefined });
                    }}
                    className="hover:text-white"
                  >
                    Clear Runs
                  </button>
                </div>
                {zodlHistory.map((run) => (
                  <div
                    key={run.id}
                    className="p-3 rounded-md bg-black border border-[#262626] text-xs font-mono flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded uppercase border",
                          run.result === "passed"
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-800"
                            : "bg-rose-950/60 text-rose-300 border-rose-800"
                        )}
                      >
                        {run.result.replace("_", " ")}
                      </span>
                      <span className="text-white uppercase">{run.platform}</span>
                      {run.notes && <span className="text-[#929292]">— {run.notes}</span>}
                    </div>
                    <span className="text-[#929292]">{new Date(run.timestamp).toLocaleTimeString("en-US")}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
