import React from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  QrCode,
  Wallet,
  FlaskConical,
  Webhook,
  ArrowRight,
  CheckCircle2,
  Clock,
  Layers,
  FileCode2,
  Lock,
  Terminal,
  Activity,
  Check,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettlementRuleAlert } from "@/components/ui/SettlementRuleAlert";

export default function DashboardOverview() {
  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <PageHeader
        badge="Zcash India Build on Zcash Bounty · November 2026"
        badgeIcon={Shield}
        title="Shielded Merchant Integration Workbench"
        description="ZecForge is an open-source developer workbench to build, test, and validate shielded Zcash merchant payment integrations before touching mainnet funds."
        actions={
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs text-slate-300 font-mono">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Key Ingestion</span>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-elevated border border-surface-border text-xs text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-primary-400" />
              <span>Fail-Closed</span>
            </span>
          </div>
        }
      />

      {/* Critical Settlement Boundary Education Banner */}
      <SettlementRuleAlert
        title="The Merchant Settlement Rule"
        description="A customer wallet broadcast (txid) does NOT equal confirmed merchant receipt. Note decryption must occur independently via an incoming viewing key scanner on the merchant's backend with canonical confirmation accumulation."
      />

      {/* Core Protocol Metrics & Invariants */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Target Network</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-100">Zcash Testnet</div>
          <p className="text-[11px] text-slate-500 font-mono">75s Block Target · Halo 2 / Orchard</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Address Formats</span>
            <Layers className="w-3.5 h-3.5 text-primary-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-100">ZIP 316 / 321</div>
          <p className="text-[11px] text-slate-500 font-mono">Unified (u1 / utest1) & Sapling</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Confirmation Policy</span>
            <Clock className="w-3.5 h-3.5 text-primary-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-100">10 Blocks</div>
          <p className="text-[11px] text-slate-500 font-mono">Configurable reorg resistance</p>
        </div>

        <div className="p-4 rounded-xl bg-surface border border-surface-border space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Wallet Integrations</span>
            <Wallet className="w-3.5 h-3.5 text-primary-400" />
          </div>
          <div className="text-lg font-bold font-mono text-slate-100">Zucchini & Zodl</div>
          <p className="text-[11px] text-slate-500 font-mono">Dapp SDK + Air-gapped QR / Links</p>
        </div>
      </div>

      {/* Integration Modules Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider font-mono text-xs">
            Integration Workbench Modules
          </h2>
          <span className="text-xs text-slate-500 font-mono">Phases 1–6 Implemented</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Module 1: Address Validator */}
          <Link
            href="/validator"
            className="group p-5 rounded-xl bg-surface border border-surface-border hover:border-primary-500/50 hover:bg-surface-elevated/70 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-primary-400 group-hover:border-primary-500/40 group-hover:bg-primary-950/60 transition-all">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-100 group-hover:text-primary-300 transition-colors">
                    Address Validator
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-slate-400 border border-surface-border">
                    ZIP-316
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Inspect Unified (u1/utest1), Sapling (zs/ztestsapling), and Transparent addresses with network prefix mismatch detection.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-primary-400 transition-colors">
              <span>Inspect formats</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 2: Payment Builder */}
          <Link
            href="/builder"
            className="group p-5 rounded-xl bg-surface border border-surface-border hover:border-primary-500/50 hover:bg-surface-elevated/70 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-primary-400 group-hover:border-primary-500/40 group-hover:bg-primary-950/60 transition-all">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-100 group-hover:text-primary-300 transition-colors">
                    Payment Request Builder
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-slate-400 border border-surface-border">
                    ZIP-321
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate canonical ZIP-321 payment request URIs with 8-decimal zatoshis precision, base64url memos, and QR payloads.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-primary-400 transition-colors">
              <span>Construct URI & QR</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 3: Wallet Sandbox */}
          <Link
            href="/wallets"
            className="group p-5 rounded-xl bg-surface border border-surface-border hover:border-primary-500/50 hover:bg-surface-elevated/70 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-primary-400 group-hover:border-primary-500/40 group-hover:bg-primary-950/60 transition-all">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-100 group-hover:text-primary-300 transition-colors">
                    Wallet Compatibility
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-slate-400 border border-surface-border">
                    Dapp SDK
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Test browser wallet discovery with Zucchini (@zucchinifi/dapp-sdk) and air-gapped mobile compatibility with Zodl.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-primary-400 transition-colors">
              <span>Test wallets</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 4: Scenario Simulator */}
          <Link
            href="/scenarios"
            className="group p-5 rounded-xl bg-surface border border-surface-border hover:border-primary-500/50 hover:bg-surface-elevated/70 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-primary-400 group-hover:border-primary-500/40 group-hover:bg-primary-950/60 transition-all">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-100 group-hover:text-primary-300 transition-colors">
                    Scenario Simulator
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-slate-400 border border-surface-border">
                    8 States
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Simulate reconciliation edge cases: underpayments, overpayments, late arrivals, reorg reviews, and sticky exceptions.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-primary-400 transition-colors">
              <span>Run state machine</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 5: Webhook Dispatcher */}
          <Link
            href="/webhooks"
            className="group p-5 rounded-xl bg-surface border border-surface-border hover:border-primary-500/50 hover:bg-surface-elevated/70 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-surface-border flex items-center justify-center text-primary-400 group-hover:border-primary-500/40 group-hover:bg-primary-950/60 transition-all">
                <Webhook className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-100 group-hover:text-primary-300 transition-colors">
                    Webhook Workbench
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-slate-400 border border-surface-border">
                    HMAC-SHA256
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cryptographically sign, dispatch, retry, and verify merchant webhook payloads with timestamp replay protection.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-primary-400 transition-colors">
              <span>Dispatch webhooks</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Module 6: Integration Report */}
          <div className="p-5 rounded-xl bg-surface/50 border border-surface-border/60 flex flex-col justify-between opacity-75">
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-lg bg-surface-elevated/60 border border-surface-border/60 flex items-center justify-center text-slate-500">
                <FileCode2 className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-300">
                    Integration Audit Report
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-elevated text-slate-500 border border-surface-border">
                    Phase 7
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Exportable merchant compliance certification, checklist scores, and integration guide for production deployments.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/40 flex items-center justify-between text-xs font-mono text-slate-600">
              <span>Next Milestone</span>
              <span>Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* Protocol Architecture Workflow */}
      <div className="p-5 sm:p-6 rounded-xl bg-surface border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            4-Stage Merchant Payment Pipeline
          </h2>
          <span className="text-[11px] font-mono text-slate-400">ZIP-321 + Viewing-Only Scanner</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-primary-400 font-bold text-sm">01</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface border border-surface-border text-slate-400">
                Frontend
              </span>
            </div>
            <h3 className="font-semibold text-slate-200">ZIP-321 Payment Request</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Merchant backend generates canonical ZIP-321 URI binding invoiceId into the memo parameter.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-primary-400 font-bold text-sm">02</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface border border-surface-border text-slate-400">
                Wallet
              </span>
            </div>
            <h3 className="font-semibold text-slate-200">Customer Broadcast</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Customer reviews recipient & amount in Zucchini or Zodl, signs, and broadcasts transaction to testnet.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-primary-400 font-bold text-sm">03</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface border border-surface-border text-slate-400">
                Scanner
              </span>
            </div>
            <h3 className="font-semibold text-slate-200">Shielded Note Decryption</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Merchant backend scanner decrypts incoming shielded note with viewing key and logs observation.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-emerald-400 font-bold text-sm">04</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">
                Settled
              </span>
            </div>
            <h3 className="font-semibold text-slate-200">HMAC Webhook Fulfillment</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              At 10 confirmations, state advances to paid and an HMAC-SHA256 webhook authorizes order fulfillment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
