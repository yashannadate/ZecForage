"use client";

import React, { useState, useEffect } from "react";
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
import { loadWorkbenchState, saveWorkbenchState, appendWorkbenchActivity } from "@/lib/settings/store";
import { cn } from "@/lib/utils";

const INITIAL_SSR_SESSION: ScenarioSession = {
  invoice: {
    id: "inv_sim_initial",
    expectedZEC: "0.05",
    expectedZatoshis: BigInt(5_000_000),
    createdAt: 1764144000000,
    expiresAt: 1764144900000,
    requiredConfirmations: DEFAULT_REQUIRED_CONFIRMATIONS,
  },
  currentState: "awaiting_payment",
  receivedZatoshis: BigInt(0),
  confirmations: 0,
  canFulfill: false,
  isExpired: false,
  auditTrail: [
    {
      id: "audit_initial",
      timestamp: 1764144000000,
      previousState: "awaiting_payment",
      newState: "awaiting_payment",
      eventType: "INVOICE_INITIALIZED",
      receivedZatoshis: "0",
      confirmations: 0,
      canFulfill: false,
      reason: "Invoice initialized for 0.05 ZEC (5000000 zatoshis). Awaiting payment detection.",
    },
  ],
};

interface ScenarioPreset {
  title: string;
  badge: string;
  description: string;
  action: (session: ScenarioSession) => ScenarioSession;
}

export default function ScenariosPage() {
  const [session, setSession] = useState<ScenarioSession>(INITIAL_SSR_SESSION);
  const [customAmount, setCustomAmount] = useState<string>("0.05");
  const [reqConfsInput, setReqConfsInput] = useState<number>(DEFAULT_REQUIRED_CONFIRMATIONS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const syncPolicy = () => {
      const savedThreshold = loadWorkbenchState().settings.confirmationThreshold;
      setReqConfsInput(savedThreshold);
      setSession((prev) => ({
        ...prev,
        invoice: {
          ...prev.invoice,
          requiredConfirmations: savedThreshold,
        },
        currentState:
          prev.currentState === "confirming" && prev.confirmations >= savedThreshold
            ? "paid"
            : prev.currentState === "paid" && prev.confirmations < savedThreshold
            ? "confirming"
            : prev.currentState,
        canFulfill:
          prev.currentState === "paid"
            ? prev.confirmations >= savedThreshold
            : prev.currentState === "confirming" && prev.confirmations >= savedThreshold,
      }));
    };
    syncPolicy();
    window.addEventListener("zecforage:state-updated", syncPolicy);
    return () => window.removeEventListener("zecforage:state-updated", syncPolicy);
  }, []);

  // Quick Launch Presets
  const presets: ScenarioPreset[] = [
    {
      title: `Happy Path: Exact Payment & ${reqConfsInput} Confirmations`,
      badge: "Standard",
      description: `Customer pays exact 0.05 ZEC on time. Block confirmations accumulate from 0 to ${reqConfsInput}.`,
      action: () => {
        let s = createScenarioSession({ expectedZEC: "0.05", requiredConfirmations: reqConfsInput });
        s = transitionScenario(s, { type: "PAYMENT_DETECTED", amountZEC: "0.05" });
        s = transitionScenario(s, { type: "CONFIRMATIONS_ADVANCED", count: reqConfsInput });
        return s;
      },
    },
    {
      title: "Underpayment: 0.04 ZEC Received",
      badge: "Exception",
      description: `Customer sends less than requested. Demonstrates that ${reqConfsInput} confirmations does NOT trigger fulfillment.`,
      action: () => {
        let s = createScenarioSession({ expectedZEC: "0.05", requiredConfirmations: reqConfsInput });
        s = transitionScenario(s, { type: "PAYMENT_DETECTED", amountZEC: "0.04" });
        s = transitionScenario(s, { type: "CONFIRMATIONS_ADVANCED", count: reqConfsInput });
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
        s = transitionScenario(s, { type: "CONFIRMATIONS_ADVANCED", count: reqConfsInput });
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
        s = transitionScenario(s, { type: "CONFIRMATIONS_ADVANCED", count: reqConfsInput });
        return s;
      },
    },
    {
      title: `Chain Reorganisation (${reqConfsInput} → ${Math.max(0, reqConfsInput - 7)} Confirmations)`,
      badge: "Consensus",
      description: "A deep 7-block reorganisation drops canonical inclusion height. State transitions to reorg_review.",
      action: () => {
        let s = createScenarioSession({ expectedZEC: "0.05", requiredConfirmations: reqConfsInput });
        s = transitionScenario(s, { type: "PAYMENT_DETECTED", amountZEC: "0.05" });
        s = transitionScenario(s, { type: "CONFIRMATIONS_ADVANCED", count: reqConfsInput });
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
      saveWorkbenchState({
        checklist: { ...loadWorkbenchState().checklist, step2: true },
        scenario: {
          currentState: nextSession.currentState,
          confirmations: nextSession.confirmations,
          requiredConfirmations: nextSession.invoice.requiredConfirmations,
          canFulfill: nextSession.canFulfill,
          timestamp: Date.now(),
        },
      });
      appendWorkbenchActivity({
        tool: "Scenario Simulator",
        label: `${nextSession.auditTrail[0]?.eventType || "TRANSITION"} → ${nextSession.currentState} (${nextSession.confirmations}/${nextSession.invoice.requiredConfirmations} confs)`,
        kind: "simulated",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid state transition");
    }
  };

  const handleReset = () => {
    setError(null);
    const nextSession = createScenarioSession({
      expectedZEC: session.invoice.expectedZEC,
      requiredConfirmations: reqConfsInput,
    });
    setSession(nextSession);
    saveWorkbenchState({
      scenario: {
        currentState: nextSession.currentState,
        confirmations: nextSession.confirmations,
        requiredConfirmations: nextSession.invoice.requiredConfirmations,
        canFulfill: nextSession.canFulfill,
        timestamp: Date.now(),
      },
    });
  };

  // Helper for status styling
  const getStateBadge = (state: PaymentState) => {
    switch (state) {
      case "awaiting_payment":
        return { label: "AWAITING PAYMENT", style: "bg-neutral-900 text-[#929292] border-neutral-800" };
      case "detected":
        return { label: "PAYMENT DETECTED (0 CONFS)", style: "bg-cyan-950/60 text-cyan-300 border-cyan-800/60" };
      case "confirming":
        return { label: "CONFIRMING BLOCKS", style: "bg-neutral-900 text-cyan-200 border-neutral-800/60" };
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
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-mono">
              <Layers className="w-3.5 h-3.5 text-cyan-300" />
              <span>8 States</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-mono">
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-normal uppercase font-mono tracking-wider text-[#929292]">
            Quick-Launch Scenario Presets
          </h2>
          <span className="text-xs font-mono text-[#929292] uppercase tracking-wider">1-click deterministic replays</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyEvent(() => preset.action(session))}
              className="min-h-11 p-3.5 rounded-xl bg-[#080808] border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900 transition-all text-left flex flex-col justify-between space-y-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <div className="space-y-1">
                <span className="text-xs font-mono font-normal uppercase tracking-wider px-1.5 py-0.5 rounded bg-black border border-neutral-800 text-[#929292]">
                  {preset.badge}
                </span>
                <h3 className="font-medium text-sm text-white tracking-tight group-hover:text-cyan-200 transition-colors leading-snug">
                  {preset.title}
                </h3>
              </div>
              <p className="text-xs font-normal text-[#929292] leading-relaxed line-clamp-2">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Current Invoice & State Status Card */}
      <div className="p-6 rounded-xl border border-neutral-800 bg-[#080808] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-mono text-neutral-500">Invoice:</span>
              <span className="font-mono text-xs text-neutral-200 font-semibold">{session.invoice.id}</span>
              {session.isExpired && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800/60 font-semibold">
                  EXPIRED
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-[#929292]">
              <span>
                Requested: <strong className="text-neutral-200">{session.invoice.expectedZEC} ZEC</strong> (
                {session.invoice.expectedZatoshis.toString()} zatoshis)
              </span>
              <span>
                Received: <strong className="text-neutral-200">{session.receivedZatoshis.toString()}</strong> zatoshis
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("px-3 py-1.5 rounded-lg border text-xs font-mono font-bold tracking-wide", currentBadge.style)}>
              {currentBadge.label}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="min-h-10 min-w-10 flex items-center justify-center p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[#929292] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              title="Reset scenario"
              aria-label="Reset scenario"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Confirmation Progress Bar */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#929292]">
              <Clock className="w-3.5 h-3.5 text-cyan-300" />
              <span>
                Block Confirmations: <strong className="text-neutral-200">{session.confirmations}</strong> / {targetThreshold}
              </span>
            </div>
            <span className="text-[#929292]">
              Fulfillment Status:{" "}
              {session.canFulfill ? (
                <strong className="text-emerald-400">✓ AUTHORIZED (canFulfill: true)</strong>
              ) : (
                <strong className="text-amber-400">✗ WITHHELD (canFulfill: false)</strong>
              )}
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-3 rounded-full bg-black border border-neutral-800 overflow-hidden relative">
            <div
              className={cn(
                "h-full transition-all duration-300",
                session.currentState === "paid"
                  ? "bg-emerald-500"
                  : session.currentState === "reorg_review"
                  ? "bg-red-500"
                  : session.currentState === "underpaid" || session.currentState === "overpaid"
                  ? "bg-amber-500"
                  : "bg-cyan-300"
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
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
        <div className="p-6 rounded-xl border border-neutral-800 bg-[#080808] space-y-4">
          <div className="space-y-1 pb-3 border-b border-neutral-800">
            <h2 className="text-base font-medium text-white tracking-tight flex items-center gap-2">
              <Play className="w-4 h-4 text-cyan-300" />
              1. Payment Ingestion Controls
            </h2>
            <p className="text-xs font-normal text-[#929292] leading-relaxed">Simulate incoming shielded note observations from scanner</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label htmlFor="custom-amount" className="text-xs font-medium text-white">
                Custom Detected Amount (ZEC)
              </label>
              <input
                id="custom-amount"
                type="text"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-black border border-neutral-800 focus:border-neutral-700 rounded-lg p-2.5 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-300"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                className="min-h-11 py-2 px-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
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
                className="min-h-11 py-2 px-3 rounded-lg bg-neutral-900 hover:bg-emerald-950/40 hover:text-emerald-300 border border-neutral-800 hover:border-emerald-800 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
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
                className="min-h-11 py-2 px-3 rounded-lg bg-neutral-900 hover:bg-amber-950/40 hover:text-amber-300 border border-neutral-800 hover:border-amber-800 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <TrendingDown className="w-4 h-4 text-amber-400" /> Underpay (0.04)
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
                className="min-h-11 py-2 px-3 rounded-lg bg-neutral-900 hover:bg-amber-950/40 hover:text-amber-300 border border-neutral-800 hover:border-amber-800 text-white text-sm font-medium transition-colors flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <TrendingUp className="w-4 h-4 text-amber-400" /> Overpay (0.08)
              </button>
            </div>

            <div className="pt-2 border-t border-neutral-800/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
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
                className="flex-1 min-h-11 py-2 px-3 rounded-lg bg-neutral-900 hover:bg-rose-950/40 hover:text-rose-300 border border-neutral-800 hover:border-rose-800 text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Simulate Late Arrival (Post-Expiry)
              </button>

              <button
                type="button"
                onClick={() => handleApplyEvent(() => transitionScenario(session, { type: "EXPIRE_INVOICE" }))}
                className="min-h-11 py-2 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[#929292] hover:text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Expire Invoice
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Consensus & Block Progression */}
        <div className="p-6 rounded-xl border border-neutral-800 bg-[#080808] space-y-4">
          <div className="space-y-1 pb-3 border-b border-neutral-800">
            <h2 className="text-base font-medium text-white tracking-tight flex items-center gap-2">
              <FastForward className="w-4 h-4 text-cyan-300" />
              2. Consensus & Confirmation Controls
            </h2>
            <p className="text-xs font-normal text-[#929292] leading-relaxed">Advance block height or simulate blockchain reorganisations</p>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                className="min-h-11 py-2.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white text-sm font-medium transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
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
                className="min-h-11 py-2.5 px-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white text-sm font-medium transition-colors disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
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
                className="min-h-11 py-2.5 px-3 rounded-lg bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-40 sm:col-span-2 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <CheckCircle2 className="w-4 h-4" /> Advance to Full Settlement ({targetThreshold} Blocks)
              </button>
            </div>

            <div className="pt-2 border-t border-neutral-800/60">
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
                className="w-full min-h-11 py-2.5 px-3 rounded-lg bg-neutral-900 hover:bg-red-950/40 hover:text-red-300 border border-neutral-800 hover:border-red-800/60 text-white text-sm font-medium transition-colors disabled:opacity-40 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Simulate Chain Reorganisation (Drop 7 Confirmations)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* State Transition Audit Trail Stream */}
      <div className="border border-neutral-800 bg-[#080808] rounded-xl p-6 md:p-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-300" />
            <h2 className="text-xs font-semibold text-neutral-200 uppercase font-mono tracking-wider">
              State Transition Audit Trail ({session.auditTrail.length})
            </h2>
          </div>
          <span className="text-[10px] font-mono text-neutral-500">Immutable ledger log</span>
        </div>

        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {session.auditTrail.map((entry) => (
            <div
              key={entry.id}
              className="p-3.5 rounded-lg bg-black border border-neutral-800 text-xs font-mono space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-cyan-300 font-bold">{entry.eventType}</span>
                  <span className="text-neutral-500 flex items-center gap-1">
                    {entry.previousState} <ArrowRight className="w-3 h-3 text-neutral-600" /> {entry.newState}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-neutral-500">{new Date(entry.timestamp).toLocaleTimeString("en-US")}</span>
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase",
                      entry.canFulfill
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800/60"
                        : "bg-neutral-900 text-[#929292] border border-neutral-800"
                    )}
                  >
                    {entry.canFulfill ? "FULFILL" : "WITHHOLD"}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-neutral-300 font-sans leading-relaxed">{entry.reason}</p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-neutral-500 pt-0.5">
                <span>Received: {entry.receivedZatoshis} zatoshis</span>
                <span>Confirmations: {entry.confirmations}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-[11px] text-neutral-500 font-mono flex items-center justify-between">
          <span>Deterministic Simulator v0.1.0</span>
          <span>Zero Blockchain Risk</span>
        </div>
      </div>
    </div>
  );
}

