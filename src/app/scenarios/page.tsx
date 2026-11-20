"use client";

import React, { useState } from "react";
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  RotateCcw,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  History,
  Info,
  ShieldAlert,
  Play,
  FastForward,
} from "lucide-react";
import {
  createScenarioSession,
  transitionScenario,
  type PaymentState,
  type ScenarioSession,
  DEFAULT_REQUIRED_CONFIRMATIONS,
} from "@/lib/zcash/scenarios";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettlementRuleAlert } from "@/components/ui/SettlementRuleAlert";
import { cn } from "@/lib/utils";

interface ScenarioPreset {
  title: string;
  badge: string;
  description: string;
  action: (session: ScenarioSession) => ScenarioSession;
}

export default function ScenariosPage() {
  const [session, setSession] = useState<ScenarioSession>(() => createScenarioSession({ expectedZEC: "0.05" }));
  const [customAmount, setCustomAmount] = useState<string>("0.05");
  const [reqConfsInput, setReqConfsInput] = useState<number>(DEFAULT_REQUIRED_CONFIRMATIONS);
  const [error, setError] = useState<string | null>(null);

  // Quick Launch Presets
  const presets: ScenarioPreset[] = [
    {
      title: "Happy Path: Exact Payment & 10 Confirmations",
      badge: "Standard",
      description: "Customer pays exact 0.05 ZEC on time. Block confirmations accumulate from 0 to 10.",
      action: () => {
        let s = createScenarioSession({ expectedZEC: "0.05", requiredConfirmations: reqConfsInput });
        s = transitionScenario(s, { type: "PAYMENT_DETECTED", amountZEC: "0.05" });
        s = transitionScenario(s, { type: "CONFIRMATIONS_ADVANCED", count: 10 });
        return s;
      },
    },
    {
      title: "Underpayment: 0.04 ZEC Received",
      badge: "Exception",
      description: "Customer sends less than requested. Demonstrates that 10 confirmations does NOT trigger fulfillment.",
      action: () => {
        let s = createScenarioSession({ expectedZEC: "0.05", requiredConfirmations: reqConfsInput });
        s = transitionScenario(s, { type: "PAYMENT_DETECTED", amountZEC: "0.04" });
        s = transitionScenario(s, { type: "CONFIRMATIONS_ADVANCED", count: 10 });
        return s;
      },
    },
    {
      title: "Overpayment: 0.08 ZEC Received",
      badge: "Exception",
      description: "Customer sends more than requested. Requires manual accounting reconciliation before order fulfillment.",
      action: () => {
        let s = createScenarioSession({ expectedZEC: "0.05", requiredConfirmations: reqConfsInput });
        s = transitionScenario(s, { type: "PAYMENT_DETECTED", amountZEC: "0.08" });
        s = transitionScenario(s, { type: "CONFIRMATIONS_ADVANCED", count: 10 });
        return s;
      },
    },
    {
      title: "Late Arrival: Note Detected Post-Expiry",
      badge: "Timeout",
      description: "Payment is detected after invoice validity window expires. Fulfillment withheld to protect inventory.",
      action: () => {
        let s = createScenarioSession({ expectedZEC: "0.05", requiredConfirmations: reqConfsInput });
        s = transitionScenario(s, { type: "EXPIRE_INVOICE" });
        s = transitionScenario(s, { type: "SIMULATE_LATE_PAYMENT", amountZEC: "0.05" });
        s = transitionScenario(s, { type: "CONFIRMATIONS_ADVANCED", count: 10 });
        return s;
      },
    },
    {
      title: "Chain Reorganisation (10 → 3 Confirmations)",
      badge: "Consensus",
      description: "A deep 7-block reorganisation drops canonical inclusion height. State transitions to reorg_review.",
      action: () => {
        let s = createScenarioSession({ expectedZEC: "0.05", requiredConfirmations: reqConfsInput });
        s = transitionScenario(s, { type: "PAYMENT_DETECTED", amountZEC: "0.05" });
        s = transitionScenario(s, { type: "CONFIRMATIONS_ADVANCED", count: 10 });
        s = transitionScenario(s, { type: "SIMULATE_REORG", droppedConfirmations: 7 });
        return s;
      },
    },
  ];

  const handleApplyEvent = (eventAction: () => ScenarioSession) => {
    setError(null);
    try {
      const nextSession = eventAction();
      setSession(nextSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid state transition");
    }
  };

  const handleReset = () => {
    setError(null);
    setSession(createScenarioSession({ expectedZEC: session.invoice.expectedZEC, requiredConfirmations: reqConfsInput }));
  };

  // Helper for status styling
  const getStateBadge = (state: PaymentState) => {
    switch (state) {
      case "awaiting_payment":
        return { label: "AWAITING PAYMENT", style: "bg-surface-elevated text-slate-400 border-surface-border" };
      case "detected":
        return { label: "PAYMENT DETECTED (0 CONFS)", style: "bg-sky-950 text-sky-300 border-sky-800/60" };
      case "confirming":
        return { label: "CONFIRMING BLOCKS", style: "bg-primary-950 text-primary-300 border-primary-800/60" };
      case "paid":
        return { label: "PAID & SETTLED", style: "bg-emerald-950 text-emerald-300 border-emerald-800/60" };
      case "underpaid":
        return { label: "UNDERPAID EXCEPTION", style: "bg-amber-950 text-amber-300 border-amber-800/60" };
      case "overpaid":
        return { label: "OVERPAID REVIEW", style: "bg-amber-950 text-amber-300 border-amber-800/60" };
      case "late_payment":
        return { label: "LATE PAYMENT EXCEPTION", style: "bg-rose-950 text-rose-300 border-rose-800/60" };
      case "reorg_review":
        return { label: "REORG REVIEW REQUIRED", style: "bg-red-950 text-red-300 border-red-800/60" };
    }
  };

  const currentBadge = getStateBadge(session.currentState);
  const targetThreshold = session.invoice.requiredConfirmations;
  const progressPercent = Math.min(100, Math.round((session.confirmations / targetThreshold) * 100));

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <PageHeader
        badge="Deterministic Reconciliation State Machine"
        badgeIcon={FlaskConical}
        title="Payment Edge Case Scenario Simulator"
        description="Test and validate how merchant payment integrations handle real-world edge cases: mempool detection, block confirmations, underpayments, overpayments, expired invoices, and chain reorganisations."
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs text-slate-300 font-mono">
              <Layers className="w-3.5 h-3.5 text-primary-400" />
              <span>8 States</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zatoshis BigInt</span>
            </span>
          </div>
        }
      />

      {/* Settlement Principle Notice */}
      <SettlementRuleAlert
        title="Reconciliation Rules & State Precedence"
        description="In standard Zcash merchant accounting, exceptions take precedence over confirmations. A late arrival, underpayment, or overpayment will never silently transition to paid simply by accumulating 10 confirmations. Automated fulfillment is strictly gated on: exact amount AND on-time arrival AND canonical threshold."
      />

      {/* Preset Quick-Launch Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase font-mono tracking-wider text-slate-300">
            Quick-Launch Scenario Presets
          </h2>
          <span className="text-[11px] font-mono text-slate-500">1-click deterministic replays</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyEvent(() => preset.action(session))}
              className="p-3.5 rounded-xl bg-surface border border-surface-border hover:border-primary-500/50 hover:bg-surface-elevated transition-all text-left flex flex-col justify-between space-y-2 group"
            >
              <div className="space-y-1">
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-subtle border border-surface-border text-slate-400">
                  {preset.badge}
                </span>
                <h3 className="font-semibold text-xs text-slate-200 group-hover:text-primary-300 transition-colors leading-tight">
                  {preset.title}
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Current Invoice & State Status Card */}
      <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono text-slate-500">Invoice:</span>
              <span className="font-mono text-xs text-slate-200 font-semibold">{session.invoice.id}</span>
              {session.isExpired && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/60 font-semibold">
                  EXPIRED
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
              <span>
                Requested: <strong className="text-slate-200">{session.invoice.expectedZEC} ZEC</strong> (
                {session.invoice.expectedZatoshis.toString()} zatoshis)
              </span>
              <span>
                Received: <strong className="text-slate-200">{session.receivedZatoshis.toString()}</strong> zatoshis
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={cn("px-3 py-1.5 rounded-lg border text-xs font-mono font-bold tracking-wide", currentBadge.style)}>
              {currentBadge.label}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface-border border border-surface-border text-slate-400 hover:text-slate-200 transition-colors"
              title="Reset scenario"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Confirmation Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-primary-400" />
              <span>
                Block Confirmations: <strong className="text-slate-200">{session.confirmations}</strong> / {targetThreshold}
              </span>
            </div>
            <span className="text-slate-400">
              Fulfillment Status:{" "}
              {session.canFulfill ? (
                <strong className="text-emerald-400">✓ AUTHORIZED (canFulfill: true)</strong>
              ) : (
                <strong className="text-amber-400">✗ WITHHELD (canFulfill: false)</strong>
              )}
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-3 rounded-full bg-surface-subtle border border-surface-border overflow-hidden relative">
            <div
              className={cn(
                "h-full transition-all duration-300",
                session.currentState === "paid"
                  ? "bg-emerald-500"
                  : session.currentState === "reorg_review"
                  ? "bg-red-500"
                  : session.currentState === "underpaid" || session.currentState === "overpaid"
                  ? "bg-amber-500"
                  : "bg-primary-500"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>0 (Mempool Detection)</span>
            <span>Policy Threshold: {targetThreshold} Blocks (~12.5m)</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Manual Simulation Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Payment Ingestion Simulation */}
        <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-4">
          <div className="space-y-1 pb-3 border-b border-surface-border">
            <h2 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-primary-400" />
              1. Payment Ingestion Controls
            </h2>
            <p className="text-[11px] text-slate-500">Simulate incoming shielded note observations from scanner</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="custom-amount" className="text-xs font-semibold text-slate-300">
                Custom Detected Amount (ZEC)
              </label>
              <input
                id="custom-amount"
                type="text"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-surface-subtle border border-surface-border focus:border-primary-500 rounded-lg p-2 text-xs font-mono text-slate-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  handleApplyEvent(() =>
                    transitionScenario(session, {
                      type: "PAYMENT_DETECTED",
                      amountZEC: customAmount,
                    })
                  )
                }
                className="py-2 px-3 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                Detect Custom Amount
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyEvent(() =>
                    transitionScenario(session, {
                      type: "PAYMENT_DETECTED",
                      amountZEC: session.invoice.expectedZEC,
                    })
                  )
                }
                className="py-2 px-3 rounded-lg bg-surface-elevated hover:bg-emerald-950/40 hover:text-emerald-300 border border-surface-border hover:border-emerald-800 text-slate-200 font-medium transition-colors flex items-center justify-center gap-1"
              >
                Detect Exact ({session.invoice.expectedZEC})
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyEvent(() =>
                    transitionScenario(session, {
                      type: "PAYMENT_DETECTED",
                      amountZEC: "0.04",
                    })
                  )
                }
                className="py-2 px-3 rounded-lg bg-surface-elevated hover:bg-amber-950/40 hover:text-amber-300 border border-surface-border hover:border-amber-800 text-slate-200 font-medium transition-colors flex items-center justify-center gap-1"
              >
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" /> Underpay (0.04)
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyEvent(() =>
                    transitionScenario(session, {
                      type: "PAYMENT_DETECTED",
                      amountZEC: "0.08",
                    })
                  )
                }
                className="py-2 px-3 rounded-lg bg-surface-elevated hover:bg-amber-950/40 hover:text-amber-300 border border-surface-border hover:border-amber-800 text-slate-200 font-medium transition-colors flex items-center justify-center gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Overpay (0.08)
              </button>
            </div>

            <div className="pt-2 border-t border-surface-border/60 flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handleApplyEvent(() =>
                    transitionScenario(session, {
                      type: "SIMULATE_LATE_PAYMENT",
                      amountZEC: session.invoice.expectedZEC,
                    })
                  )
                }
                className="flex-1 py-1.5 px-3 rounded-lg bg-surface-elevated hover:bg-rose-950/40 hover:text-rose-300 border border-surface-border hover:border-rose-800 text-slate-300 text-xs font-medium transition-colors"
              >
                Simulate Late Arrival (Post-Expiry)
              </button>

              <button
                type="button"
                onClick={() => handleApplyEvent(() => transitionScenario(session, { type: "EXPIRE_INVOICE" }))}
                className="py-1.5 px-3 rounded-lg bg-surface-elevated hover:bg-surface-border border border-surface-border text-slate-400 hover:text-slate-200 text-xs transition-colors"
              >
                Expire Invoice
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Consensus & Block Progression */}
        <div className="p-6 rounded-xl border border-surface-border bg-surface space-y-4">
          <div className="space-y-1 pb-3 border-b border-surface-border">
            <h2 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider flex items-center gap-2">
              <FastForward className="w-3.5 h-3.5 text-primary-400" />
              2. Consensus & Confirmation Controls
            </h2>
            <p className="text-[11px] text-slate-500">Advance block height or simulate blockchain reorganisations</p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() =>
                  handleApplyEvent(() =>
                    transitionScenario(session, {
                      type: "CONFIRMATIONS_ADVANCED",
                      count: session.confirmations + 1,
                    })
                  )
                }
                disabled={session.currentState === "awaiting_payment"}
                className="py-2.5 px-3 rounded-lg bg-surface-elevated hover:bg-surface-border border border-surface-border text-slate-200 font-medium transition-colors disabled:opacity-40"
              >
                +1 Block Confirmation
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyEvent(() =>
                    transitionScenario(session, {
                      type: "CONFIRMATIONS_ADVANCED",
                      count: session.confirmations + 5,
                    })
                  )
                }
                disabled={session.currentState === "awaiting_payment"}
                className="py-2.5 px-3 rounded-lg bg-surface-elevated hover:bg-surface-border border border-surface-border text-slate-200 font-medium transition-colors disabled:opacity-40"
              >
                +5 Block Confirmations
              </button>

              <button
                type="button"
                onClick={() =>
                  handleApplyEvent(() =>
                    transitionScenario(session, {
                      type: "CONFIRMATIONS_ADVANCED",
                      count: targetThreshold,
                    })
                  )
                }
                disabled={session.currentState === "awaiting_payment"}
                className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-40 col-span-2 flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Advance to Full Settlement ({targetThreshold} Blocks)
              </button>
            </div>

            <div className="pt-2 border-t border-surface-border/60">
              <button
                type="button"
                onClick={() =>
                  handleApplyEvent(() =>
                    transitionScenario(session, {
                      type: "SIMULATE_REORG",
                      droppedConfirmations: 7,
                    })
                  )
                }
                disabled={session.currentState === "awaiting_payment"}
                className="w-full py-2.5 px-3 rounded-lg bg-surface-elevated hover:bg-red-950/40 hover:text-red-300 border border-surface-border hover:border-red-800/60 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                Simulate Chain Reorganisation (Drop 7 Confirmations)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* State Transition Audit Trail Stream */}
      <div className="border border-surface-border bg-surface rounded-xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-primary-400" />
            <h2 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
              State Transition Audit Trail ({session.auditTrail.length})
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Immutable ledger log</span>
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {session.auditTrail.map((entry) => (
            <div
              key={entry.id}
              className="p-3.5 rounded-lg bg-surface-subtle border border-surface-border text-xs font-mono space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-primary-400 font-bold">{entry.eventType}</span>
                  <span className="text-slate-500 flex items-center gap-1">
                    {entry.previousState} <ArrowRight className="w-3 h-3 text-slate-600" /> {entry.newState}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-slate-500">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase",
                      entry.canFulfill
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                        : "bg-surface-elevated text-slate-400 border border-surface-border"
                    )}
                  >
                    {entry.canFulfill ? "FULFILL" : "WITHHOLD"}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{entry.reason}</p>

              <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-0.5">
                <span>Received: {entry.receivedZatoshis} zatoshis</span>
                <span>Confirmations: {entry.confirmations}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-[11px] text-slate-500 font-mono flex items-center justify-between">
          <span>Deterministic Simulator v0.1.0</span>
          <span>Zero Blockchain Risk</span>
        </div>
      </div>
    </div>
  );
}
