"use client";

import React, { useState, useEffect } from "react";
import {
  Wallet,
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
} from "lucide-react";
import {
  createZucchiniClient,
  discoverZucchiniProvider,
  createVirtualZucchiniProvider,
  type WalletRpcLog,
  type WalletState,
} from "@/lib/zcash/wallet";
import { cn } from "@/lib/utils";

const SAMPLE_PAYMENT_URI =
  "zcash:utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq?amount=0.001&memo=b3JkZXJfZGV2XzEwMQ";

export default function WalletSandboxPage() {
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
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

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
    setError(null);
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
      setError(msg);
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
    setError(null);
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
      setError(msg);
      addLog("zcash_requestPayment", { uri: paymentUriInput.trim() }, null, duration, msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="border border-surface-border bg-surface rounded-xl p-6 md:p-8 relative overflow-hidden">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-primary-950 text-primary-300 border border-primary-800/60 text-xs font-mono font-medium">
            <Wallet className="w-3.5 h-3.5" />
            Browser Wallet Standard Handshake
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100">
            Wallet Compatibility Sandbox
          </h1>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            Test browser wallet discovery, EIP-1193 permission handshakes, and ZIP-321 payment request handoffs using
            the official <code className="text-primary-300 font-mono">@zucchinifi/dapp-sdk/zcash</code> integration contract.
          </p>
        </div>
      </div>

      {/* Critical Settlement Rule Notice */}
      <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border flex items-start gap-3">
        <Info className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h2 className="font-semibold text-slate-200">The Broadcast vs. Settlement Rule</h2>
          <p className="text-slate-400 leading-relaxed">
            When <code className="text-primary-300 font-mono">requestPayment(uri)</code> succeeds, the returned{" "}
            <code className="text-primary-300 font-mono">txid</code> proves that the customer approved and broadcasted the
            transaction. It does <strong>not</strong> prove confirmed merchant receipt. Final merchant settlement must be
            verified by your backend viewing key scanner after block confirmations accumulate.
          </p>
        </div>
      </div>

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

              {error && (
                <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
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
  );
}
