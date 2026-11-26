"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Copy,
  Check,
  AlertCircle,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Lock,
  Download,
} from "lucide-react";
import {
  buildZip321Uri,
  utf8ToBytes,
  type GeneratedPaymentUri,
} from "@/lib/zcash/zip321";
import { inspectAddress } from "@/lib/zcash/addresses";
import { appendWorkbenchActivity, loadWorkbenchState, saveWorkbenchState } from "@/lib/settings/store";
import { PageHeader } from "@/components/ui/PageHeader";
import { SettlementRuleAlert } from "@/components/ui/SettlementRuleAlert";
import { cn } from "@/lib/utils";

const SAMPLE_PRESETS = [
  {
    name: "0.001 ZEC Unified",
    recipient:
      "utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
    amount: "0.001",
    memo: "order_68392-coffee",
  },
  {
    name: "0.05 ZEC Sapling",
    recipient:
      "ztestsapling1000000000000000000000000000000000000000000000000000000000000000000000000000",
    amount: "0.05",
    memo: "Subscription invoice #402",
  },
  {
    name: "0.1 ZEC Transparent",
    recipient: "tm9iMLAuYMzJ6kWYEqQCzNhpW9gSnhmXv2X",
    amount: "0.1",
    memo: "",
  },
];

export default function PaymentRequestBuilderPage() {
  const [recipient, setRecipient] = useState<string>(SAMPLE_PRESETS[0].recipient);
  const [amount, setAmount] = useState<string>("0.001");
  const [memo, setMemo] = useState<string>("order_68392-coffee");

  const [generated, setGenerated] = useState<GeneratedPaymentUri | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const recipientInspection = recipient ? inspectAddress(recipient, "testnet") : null;
  const isTransparent = recipientInspection?.addressType === "transparent";
  const memoBytesCount = memo ? utf8ToBytes(memo).length : 0;

  useEffect(() => {
    setError(null);
    if (!recipient.trim() || !amount.trim()) {
      setGenerated(null);
      setQrDataUrl("");
      return;
    }

    try {
      const res = buildZip321Uri({
        recipient: recipient.trim(),
        amount: amount.trim(),
        memo: memo.trim() ? memo.trim() : undefined,
        network: "testnet",
      });
      setGenerated(res);
      saveWorkbenchState({ lastGeneratedUri: res.uri });

      QRCode.toDataURL(res.uri, {
        width: 320,
        margin: 2,
        color: { dark: "#080C14", light: "#FFFFFF" },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(""));
    } catch (err) {
      setGenerated(null);
      setQrDataUrl("");
      setError(err instanceof Error ? err.message : "Failed to generate ZIP-321 URI.");
    }
  }, [recipient, amount, memo]);

  const handleCopyUri = async () => {
    if (!generated?.uri) return;
    await navigator.clipboard.writeText(generated.uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    saveWorkbenchState({
      lastGeneratedUri: generated.uri,
      checklist: { ...loadWorkbenchState().checklist, step1: true },
    });
    appendWorkbenchActivity({
      tool: "ZIP-321 Builder",
      label: `Copied ${generated.amount} ZEC Testnet URI`,
      kind: "local",
    });
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "zecforage-testnet-zip321-qr.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    appendWorkbenchActivity({
      tool: "ZIP-321 Builder",
      label: "Downloaded ZIP-321 Testnet QR PNG",
      kind: "local",
    });
  };

  const loadPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setRecipient(preset.recipient);
    setAmount(preset.amount);
    setMemo(preset.memo);
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        badge="ZIP-321 Builder · Zcash Testnet Only"
        badgeIcon={QrCode}
        title="Payment Request Builder"
        description="Build canonical Zcash Testnet ZIP-321 payment URIs with unpadded base64url memos and QR payloads synced directly with Wallets."
        actions={
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#080808] border border-[#262626] text-xs text-[#929292] font-mono uppercase tracking-wider">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Testnet Single-Recipient</span>
          </span>
        }
      />

      <SettlementRuleAlert
        title="Payment Request Boundary"
        description="Generating a ZIP-321 URI or QR code defines Testnet payment parameters for a wallet. It does not execute or verify on-chain settlement."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls */}
        <div className="lg:col-span-7 border border-[#262626] bg-[#080808] rounded-lg p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#262626]">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#929292]">
              <span className="w-2 h-2 rounded-full bg-cyan-300" />
              <span>Network: Zcash Testnet</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-[#929292] font-mono uppercase tracking-wider flex items-center gap-1.5 mr-1">
                <Sparkles className="w-4 h-4 text-cyan-300" /> Presets:
              </span>
              {SAMPLE_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => loadPreset(p)}
                  className="min-h-9 text-sm font-medium px-3 py-1 rounded-md bg-black hover:bg-neutral-900 border border-[#262626] text-[#929292] hover:text-white transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="recipient-input" className="text-sm font-medium text-white">
                Testnet Recipient Address
              </label>
              {recipientInspection && recipient.trim().length > 0 && (
                <>
                  {recipientInspection.classification === "valid_testnet" && recipientInspection.networkMatch && (
                    <span className="text-xs font-mono text-emerald-400">
                      ✓ {recipientInspection.addressType} (Testnet · preliminary format check)
                    </span>
                  )}
                  {recipientInspection.classification === "valid_mainnet" && (
                    <span className="text-xs font-mono text-amber-400">
                      ⚠ Mainnet {recipientInspection.addressType} · Testnet address required
                    </span>
                  )}
                  {recipientInspection.classification === "invalid_structure" && (
                    <span className="text-xs font-mono text-rose-400">
                      ✗ Invalid {recipientInspection.addressType !== "unknown" ? recipientInspection.addressType : ""} address structure
                    </span>
                  )}
                  {recipientInspection.classification === "unsupported_prefix" && (
                    <span className="text-xs font-mono text-rose-400">
                      ✗ Unsupported address prefix
                    </span>
                  )}
                </>
              )}
            </div>
            <textarea
              id="recipient-input"
              rows={2}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="utest1..., ztestsapling1..., or tm..."
              className="w-full bg-black border border-[#262626] rounded-md p-3 text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-cyan-300 resize-none leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="amount-input" className="text-sm font-medium text-white">
                Amount (ZEC)
              </label>
              <span className="text-xs font-mono text-[#929292]">Max 8 decimals</span>
            </div>
            <input
              id="amount-input"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 0.001"
              className="w-full min-h-10 bg-black border border-[#262626] rounded-md px-3 text-sm font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-cyan-300"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="memo-input" className="text-sm font-medium text-white">
                Shielded Memo (UTF-8)
              </label>
              <span
                className={cn(
                  "text-xs font-mono",
                  memoBytesCount > 512 ? "text-rose-400" : "text-[#929292]"
                )}
              >
                {memoBytesCount} / 512 bytes
              </span>
            </div>
            <textarea
              id="memo-input"
              rows={2}
              value={memo}
              disabled={isTransparent}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={
                isTransparent
                  ? "Memos are forbidden for transparent addresses."
                  : "e.g. order_uuid_10492..."
              }
              className={cn(
                "w-full border rounded-md p-3 text-sm transition-colors resize-none leading-relaxed",
                isTransparent
                  ? "bg-neutral-900/40 border-[#262626] text-[#929292] cursor-not-allowed"
                  : "bg-black border-[#262626] text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-cyan-300"
              )}
            />
            {isTransparent && (
              <p className="text-sm text-amber-400 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                Transparent addresses cannot receive shielded memos.
              </p>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-md bg-rose-950/30 border border-rose-800/40 text-rose-300 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {generated && generated.warnings.length > 0 && (
            <div className="p-3.5 rounded-md bg-amber-950/20 border border-amber-800/40 text-amber-300 text-sm space-y-1">
              <div className="font-medium flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Advisory
              </div>
              <ul className="list-disc list-inside text-sm text-[#929292]">
                {generated.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Output & QR */}
        <div className="lg:col-span-5 border border-[#262626] bg-[#080808] rounded-lg p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
              <h2 className="text-base font-medium tracking-tight text-white">
                Generated ZIP-321 Output
              </h2>
              {generated && (
                <span className="text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                  Valid
                </span>
              )}
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-white min-h-[210px]">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Zcash ZIP-321 Payment QR"
                  className="w-48 h-48 rounded object-contain"
                />
              ) : (
                <div className="text-neutral-500 text-sm text-center p-6 space-y-2">
                  <QrCode className="w-10 h-10 mx-auto text-[#929292]" />
                  <p>Awaiting valid parameters...</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#929292] block">
                Canonical Payment URI
              </span>
              <code className="block p-3 rounded-md bg-black border border-[#262626] font-mono text-sm text-neutral-200 break-all select-all min-h-[48px]">
                {generated ? generated.uri : "zcash:<recipient>?amount=<amount>..."}
              </code>

              {generated && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyUri}
                    className="min-h-10 px-4 rounded-md bg-white text-black font-medium hover:bg-neutral-200 text-sm transition-colors duration-200 flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" /> Copied URI
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy URI
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    disabled={!qrDataUrl}
                    className="min-h-10 px-4 rounded-md border border-[#262626] bg-transparent hover:bg-neutral-900 text-white font-medium text-sm transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    <Download className="w-4 h-4" /> Download QR
                  </button>
                </div>
              )}
            </div>

            {generated && (
              <div className="pt-2 border-t border-[#262626] grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-md bg-black border border-[#262626]">
                  <span className="text-[#929292] block uppercase">Zatoshis</span>
                  <span className="text-white">{generated.amountZatoshis}</span>
                </div>
                <div className="p-2.5 rounded-md bg-black border border-[#262626]">
                  <span className="text-[#929292] block uppercase">Base64url Memo</span>
                  <span className="text-white truncate block">
                    {generated.memoBase64Url || "None"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#262626] flex items-center justify-between text-xs text-[#929292] font-mono">
            <span>Zucchini &amp; Zodl Compatible</span>
            <a
              href="https://zips.z.cash/zip-0321"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              ZIP-321 <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
