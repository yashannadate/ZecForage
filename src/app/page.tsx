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
  AlertCircle,
  Clock,
  Layers,
  FileCode2,
  ExternalLink,
} from "lucide-react";

export default function DashboardOverview() {
  return (
    <div className="space-y-8">
      {/* Hero / Overview Header */}
      <div className="border border-surface-border bg-surface rounded-xl p-6 md:p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary-600/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary-950/80 border border-primary-800/60 text-primary-300 text-xs font-mono font-medium">
            <Shield className="w-3.5 h-3.5" />
            Zcash India Build on Zcash Bounty
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-100">
            Zcash Shielded Merchant Integration Testbench
          </h1>
          <p className="text-sm md:text-base text-slate-400 leading-relaxed">
            ZecPayKit provides merchants, Web3 developers, and payment gateways with a deterministic testing
            environment to validate shielded Zcash checkout flows, audit ZIP-316/ZIP-321 compatibility, and test
            webhook reconciliations before deploying to production.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-elevated border border-surface-border">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Zero Key Ingestion
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-elevated border border-surface-border">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ZIP-321 Standard Subset
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-elevated border border-surface-border">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Fail-Closed Reconciliation
            </span>
          </div>
        </div>
      </div>

      {/* Critical Principle Warning Card */}
      <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border flex items-start gap-3.5">
        <AlertCircle className="w-5 h-5 text-primary-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h2 className="font-semibold text-slate-200">The Merchant Settlement Rule</h2>
          <p className="text-slate-400 leading-relaxed">
            A wallet transaction submission (<code className="text-primary-300 font-mono">txid</code>) does <strong>not</strong> equal confirmed merchant receipt. ZecPayKit enforces a strict separation between customer wallet broadcast and backend scanner note decryption with canonical confirmation accumulation.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-lg bg-surface border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Target Network</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">Zcash Testnet</div>
          <p className="text-[11px] text-slate-500 font-mono">75s Block Target · Halo 2 / Orchard</p>
        </div>

        <div className="p-5 rounded-lg bg-surface border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Address Standard</span>
            <Layers className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">ZIP 316 / 321</div>
          <p className="text-[11px] text-slate-500 font-mono">Unified (Orchard + Sapling)</p>
        </div>

        <div className="p-5 rounded-lg bg-surface border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Default Confirmations</span>
            <Clock className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">10 Blocks</div>
          <p className="text-[11px] text-slate-500 font-mono">Reorg resistance threshold</p>
        </div>

        <div className="p-5 rounded-lg bg-surface border border-surface-border space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Browser Integration</span>
            <Wallet className="w-4 h-4 text-primary-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">Zucchini SDK</div>
          <p className="text-[11px] text-slate-500 font-mono">@zucchinifi/dapp-sdk 0.2.0</p>
        </div>
      </div>

      {/* Interactive Tooling Launchpad */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-200">Integration Tooling Modules</h2>
          <span className="text-xs text-slate-500 font-mono">Deterministic verification suite</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tool 1: Address Validator */}
          <Link
            href="/validator"
            className="group p-5 rounded-xl bg-surface border border-surface-border hover:border-primary-500/50 hover:bg-surface-elevated transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary-950 border border-primary-800/60 flex items-center justify-center text-primary-400 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-primary-300 transition-colors">
                  Receiving Address Validator
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Verify Unified (u1/utest1), Sapling (zs/ztestsapling), and Transparent (t1/tm) addresses against network rules.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-primary-400">
              <span>ZIP-316 receiver parser</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Tool 2: Payment Request Builder */}
          <Link
            href="/builder"
            className="group p-5 rounded-xl bg-surface border border-surface-border hover:border-primary-500/50 hover:bg-surface-elevated transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary-950 border border-primary-800/60 flex items-center justify-center text-primary-400 group-hover:scale-105 transition-transform">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-primary-300 transition-colors">
                  ZIP-321 Payment Builder
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Construct canonical ZIP-321 payment request URIs with 8-decimal ZEC amounts, base64url memos, and QR payloads.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-primary-400">
              <span>URI & QR constructor</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Tool 3: Wallet Compatibility */}
          <Link
            href="/wallets"
            className="group p-5 rounded-xl bg-surface border border-surface-border hover:border-primary-500/50 hover:bg-surface-elevated transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary-950 border border-primary-800/60 flex items-center justify-center text-primary-400 group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-primary-300 transition-colors">
                  Wallet Compatibility Testbench
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Test browser wallet discovery, EIP-1193 contracts, permission negotiation, and ZIP-321 request handoffs.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-primary-400">
              <span>Zucchini provider audit</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Tool 4: Payment Scenarios */}
          <Link
            href="/scenarios"
            className="group p-5 rounded-xl bg-surface border border-surface-border hover:border-primary-500/50 hover:bg-surface-elevated transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary-950 border border-primary-800/60 flex items-center justify-center text-primary-400 group-hover:scale-105 transition-transform">
                <FlaskConical className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-primary-300 transition-colors">
                  Edge Case Scenario Simulator
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Test reconciliation policies against underpayments, late arrivals, missing invoice memos, and reorg reviews.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-primary-400">
              <span>State machine simulator</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Tool 5: Webhook Testing */}
          <Link
            href="/webhooks"
            className="group p-5 rounded-xl bg-surface border border-surface-border hover:border-primary-500/50 hover:bg-surface-elevated transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary-950 border border-primary-800/60 flex items-center justify-center text-primary-400 group-hover:scale-105 transition-transform">
                <Webhook className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-primary-300 transition-colors">
                  HMAC Webhook Dispatcher
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Simulate, sign, and verify HMAC payment.status_changed webhook dispatches to test merchant backend listeners.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-primary-400">
              <span>HMAC-SHA256 testbench</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Tool 6: Integration Report */}
          <Link
            href="/reports"
            className="group p-5 rounded-xl bg-surface border border-surface-border hover:border-primary-500/50 hover:bg-surface-elevated transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-lg bg-primary-950 border border-primary-800/60 flex items-center justify-center text-primary-400 group-hover:scale-105 transition-transform">
                <FileCode2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-100 group-hover:text-primary-300 transition-colors">
                  Merchant Integration Audit
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Export structured compliance reports, readiness checklists, and developer integration snippets.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-surface-border/60 flex items-center justify-between text-xs font-mono text-slate-500 group-hover:text-primary-400">
              <span>Audit readiness report</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Protocol Architecture Workflow Diagram */}
      <div className="p-6 rounded-xl bg-surface border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Merchant Payment Boundary Architecture</h2>
          <span className="text-[11px] font-mono text-slate-400">ZIP-321 + Viewing-Only Scanner Workflow</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-primary-400 font-bold">01</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface border border-surface-border text-slate-400">Frontend</span>
            </div>
            <h3 className="font-semibold text-slate-200">Payment Request</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Merchant backend issues an invoice and generates an unsigned ZIP-321 URI binding invoiceId into the memo.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-primary-400 font-bold">02</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface border border-surface-border text-slate-400">Wallet</span>
            </div>
            <h3 className="font-semibold text-slate-200">User Approval & Broadcast</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Customer reviews recipient & amount in Zucchini/wallet and signs. Wallet emits broadcast txid.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-primary-400 font-bold">03</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-surface border border-surface-border text-slate-400">Backend Scanner</span>
            </div>
            <h3 className="font-semibold text-slate-200">Shielded Note Decryption</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Merchant scanner independently decrypts incoming shielded note with viewing key and asserts observation.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-emerald-400 font-bold">04</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-300">Settled</span>
            </div>
            <h3 className="font-semibold text-slate-200">Reconciled Fulfillment</h3>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              When confirmations reach threshold (10), state transitions to paid and signed HMAC webhook notifies backend.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

