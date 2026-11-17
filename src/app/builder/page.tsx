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
  Info,
} from "lucide-react";
import {
  buildZip321Uri,
  utf8ToBytes,
  type GeneratedPaymentUri,
} from "@/lib/zcash/zip321";
import { inspectAddress, type ZcashNetwork } from "@/lib/zcash/addresses";
import { cn } from "@/lib/utils";

const SAMPLE_PRESETS = [
  {
    name: "0.001 Test-ZEC (Zucchini Reference)",
    network: "testnet" as ZcashNetwork,
    recipient:
      "utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
    amount: "0.001",
    memo: "order_68392-coffee",
  },
  {
    name: "0.05 Test-ZEC (Sapling Receiver)",
    network: "testnet" as ZcashNetwork,
    recipient:
      "ztestsapling1000000000000000000000000000000000000000000000000000000000000000000000000000",
    amount: "0.05",
    memo: "Subscription invoice #402",
  },
  {
    name: "Transparent Checkout (No memo)",
    network: "testnet" as ZcashNetwork,
    recipient: "tm9iMLAuYMzJ6kWYEqQCzNhpW9gSnhmXv2X",
    amount: "0.1",
    memo: "",
  },
];

export default function PaymentRequestBuilderPage() {
  const [network, setNetwork] = useState<ZcashNetwork>("testnet");
  const [recipient, setRecipient] = useState<string>(SAMPLE_PRESETS[0].recipient);
  const [amount, setAmount] = useState<string>("0.001");
  const [memo, setMemo] = useState<string>("order_68392-coffee");

  const [generated, setGenerated] = useState<GeneratedPaymentUri | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Address inspection for recipient field
  const recipientInspection = recipient ? inspectAddress(recipient, network) : null;
  const isTransparent = recipientInspection?.addressType === "transparent";

  // Compute memo bytes
  const memoBytesCount = memo ? utf8ToBytes(memo).length : 0;

  // Build URI dynamically
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
        network,
      });
      setGenerated(res);

      // Render QR code
      QRCode.toDataURL(res.uri, {
        width: 320,
        margin: 2,
        color: {
          dark: "#0F1626",
          light: "#FFFFFF",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(""));
    } catch (err) {
      setGenerated(null);
      setQrDataUrl("");
      setError(err instanceof Error ? err.message : "Failed to generate ZIP-321 URI.");
    }
  }, [recipient, amount, memo, network]);

  const handleCopyUri = () => {
    if (!generated?.uri) return;
    navigator.clipboard.writeText(generated.uri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setNetwork(preset.network);
    setRecipient(preset.recipient);
    setAmount(preset.amount);
    setMemo(preset.memo);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="border border-surface-border bg-surface rounded-xl p-6 relative overflow-hidden">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-primary-950 text-primary-300 border border-primary-800/60 text-xs font-mono font-medium">
            <QrCode className="w-3.5 h-3.5" />
            ZIP-321 Payment URI Constructor
          </div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-100">
            Payment Request Builder
          </h1>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            Construct canonical ZIP-321 payment request URIs with unpadded base64url memos conforming to the
            documented Zucchini Wallet 0.5.2 single-recipient profile.
          </p>
        </div>
      </div>

      {/* Critical Rule Banner */}
      <div className="p-4 rounded-lg bg-surface-subtle border border-surface-border flex items-start gap-3">
        <Info className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <h2 className="font-semibold text-slate-200">Payment Request Settlement Notice</h2>
          <p className="text-slate-400 leading-relaxed">
            Generating a ZIP-321 URI or QR code defines payment parameters for the customer's wallet. It does{" "}
            <strong>not</strong> trigger or confirm blockchain settlement. Fulfillment must be gated on scanner note
            decryption with accumulated confirmations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls (Left column) */}
        <div className="lg:col-span-7 border border-surface-border bg-surface rounded-xl p-6 space-y-5">
          {/* Network Switcher & Presets */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Network:</span>
              <div className="inline-flex rounded-lg bg-surface-elevated p-1 border border-surface-border text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setNetwork("testnet")}
                  className={cn(
                    "px-2.5 py-0.5 rounded transition-colors",
                    network === "testnet" ? "bg-primary-600 text-white font-semibold" : "text-slate-400"
                  )}
                >
                  Testnet
                </button>
                <button
                  type="button"
                  onClick={() => setNetwork("mainnet")}
                  className={cn(
                    "px-2.5 py-0.5 rounded transition-colors",
                    network === "mainnet" ? "bg-primary-600 text-white font-semibold" : "text-slate-400"
                  )}
                >
                  Mainnet
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
                onClick={() => loadPreset(SAMPLE_PRESETS[0])}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated border border-surface-border text-slate-400 hover:text-primary-300"
              >
                0.001 ZEC
              </button>
              <button
                type="button"
                onClick={() => loadPreset(SAMPLE_PRESETS[2])}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-elevated border border-surface-border text-slate-400 hover:text-primary-300"
              >
                Transparent
              </button>
            </div>
          </div>

          {/* Recipient Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="recipient-input" className="text-xs font-semibold text-slate-200">
                Recipient Address (ZIP-316 / ZIP-32)
              </label>
              {recipientInspection && recipientInspection.isValidFormat && (
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  ✓ {recipientInspection.addressType} ({recipientInspection.detectedNetwork})
                </span>
              )}
            </div>
            <textarea
              id="recipient-input"
              rows={2}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Unified (utest1/u1), Sapling (ztestsapling1/zs1), or Transparent (tm/t1)..."
              className="w-full bg-surface-subtle border border-surface-border focus:border-primary-500 rounded-lg p-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all resize-none"
            />
          </div>

          {/* Amount Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="amount-input" className="text-xs font-semibold text-slate-200">
                Payment Amount (ZEC)
              </label>
              <span className="text-[10px] font-mono text-slate-500">Max 8 decimal places</span>
            </div>
            <input
              id="amount-input"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 0.001"
              className="w-full bg-surface-subtle border border-surface-border focus:border-primary-500 rounded-lg p-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>

          {/* Memo Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="memo-input" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <span>Shielded Memo</span>
                <span className="text-[10px] text-slate-500 font-normal font-mono">(Printable UTF-8, max 512B)</span>
              </label>
              <span
                className={cn(
                  "text-[10px] font-mono",
                  memoBytesCount > 512 ? "text-red-400 font-bold" : "text-slate-500"
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
                  ? "Memos are forbidden for transparent addresses (ZIP-321 constraint)."
                  : "e.g. order_uuid_10492 or invoice memo..."
              }
              className={cn(
                "w-full border rounded-lg p-2.5 text-xs font-mono transition-all resize-none",
                isTransparent
                  ? "bg-surface-elevated/40 border-surface-border text-slate-500 cursor-not-allowed"
                  : "bg-surface-subtle border-surface-border focus:border-primary-500 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
              )}
            />
            {isTransparent && (
              <p className="text-[11px] text-amber-400/90 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Transparent addresses cannot receive shielded memos. Memo input has been disabled.
              </p>
            )}
          </div>

          {/* Validation Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/40 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Invariants Summary */}
          {generated && generated.warnings.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/40 text-amber-300 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Advisory Warnings
              </div>
              <ul className="list-disc list-inside text-[11px] text-amber-200/80">
                {generated.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Generated Output & QR Preview (Right column) */}
        <div className="lg:col-span-5 border border-surface-border bg-surface rounded-xl p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h2 className="text-xs font-semibold text-slate-200 uppercase font-mono tracking-wider">
                Generated ZIP-321 Output
              </h2>
              {generated && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                  Valid Subset
                </span>
              )}
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/95 shadow-inner min-h-[220px]">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Zcash ZIP-321 Payment QR"
                  className="w-48 h-48 rounded object-contain"
                />
              ) : (
                <div className="text-slate-500 text-xs font-mono text-center p-6 space-y-2">
                  <QrCode className="w-10 h-10 mx-auto text-slate-400 stroke-[1.2]" />
                  <p>Awaiting valid payment parameters...</p>
                </div>
              )}
            </div>

            {/* URI Raw Output */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-400">Canonical Payment URI:</span>
                {generated && (
                  <button
                    type="button"
                    onClick={handleCopyUri}
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
                {generated ? generated.uri : "zcash:<recipient>?amount=<amount>..."}
              </div>
            </div>

            {/* Breakdown Parameters */}
            {generated && (
              <div className="pt-2 border-t border-surface-border/60 grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded bg-surface-subtle border border-surface-border">
                  <span className="text-slate-500 block text-[9px] uppercase">Zatoshis</span>
                  <span className="text-slate-200 font-semibold">{generated.amountZatoshis}</span>
                </div>
                <div className="p-2 rounded bg-surface-subtle border border-surface-border">
                  <span className="text-slate-500 block text-[9px] uppercase">Base64url Memo</span>
                  <span className="text-slate-200 truncate block">
                    {generated.memoBase64Url || "None"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-surface-border flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Zucchini 0.5.2 Profile</span>
            <a
              href="https://zips.z.cash/zip-0321"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary-400"
            >
              ZIP-321 Spec <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
