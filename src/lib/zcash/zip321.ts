import { z } from "zod";
import { inspectAddress, type ZcashNetwork } from "./addresses";

export interface Zip321PaymentRequest {
  recipient: string;
  amount: string; // Decimal string, e.g. "0.001"
  memo?: string; // Human-readable UTF-8 memo
  network?: ZcashNetwork;
}

export interface GeneratedPaymentUri {
  uri: string;
  recipient: string;
  amount: string;
  amountZatoshis: string;
  memoBase64Url?: string;
  isTransparent: boolean;
  warnings: string[];
}

export interface ParsedZip321Uri {
  recipient: string;
  amount: string;
  amountZatoshis: string;
  memoText?: string;
  memoBase64Url?: string;
  isTransparent: boolean;
  warnings: string[];
}

// Convert UTF-8 string to Uint8Array
export function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to UTF-8 string (fails on non-UTF8)
export function bytesToUtf8(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

// Encode bytes to unpadded base64url (RFC 4648 §5)
export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Decode unpadded base64url to bytes
export function base64UrlToBytes(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Encode UTF-8 memo text directly to base64url
export function encodeMemoToBase64Url(text: string): string {
  if (!text) return "";
  const bytes = utf8ToBytes(text);
  if (bytes.length > 512) {
    throw new Error(`Memo exceeds 512 byte limit (currently ${bytes.length} bytes).`);
  }
  return bytesToBase64Url(bytes);
}

// Decode base64url memo to UTF-8 text
export function decodeBase64UrlMemo(base64url: string): string {
  if (!base64url) return "";
  const bytes = base64UrlToBytes(base64url);
  if (bytes.length > 512) {
    throw new Error(`Decoded memo exceeds 512 bytes (${bytes.length} bytes).`);
  }
  return bytesToUtf8(bytes);
}

// Convert decimal ZEC amount string to zatoshis (1 ZEC = 100,000,000 zatoshis)
export function zecToZatoshis(amount: string): bigint {
  if (!/^\d+(\.\d{1,8})?$/.test(amount)) {
    throw new Error("Invalid ZEC amount format. Must be positive with at most 8 decimal places.");
  }
  const [whole, fraction = ""] = amount.split(".");
  const paddedFraction = fraction.padEnd(8, "0");
  const zatoshis = BigInt(whole) * BigInt(100_000_000) + BigInt(paddedFraction);
  if (zatoshis <= BigInt(0)) {
    throw new Error("Amount must be greater than 0.");
  }
  if (zatoshis > BigInt("2100000000000000")) {
    throw new Error("Amount exceeds maximum Zcash total supply (21,000,000 ZEC).");
  }
  return zatoshis;
}

/**
 * Builds a ZIP-321 payment URI strictly compatible with Zucchini Wallet 0.5.2 subset.
 * Spec: zcash:<recipient>?amount=<amount>[&memo=<base64url>]
 */
export function buildZip321Uri(request: Zip321PaymentRequest): GeneratedPaymentUri {
  const warnings: string[] = [];
  const network = request.network || "testnet";

  // Validate address structure
  const addrInspection = inspectAddress(request.recipient, network);
  if (!addrInspection.isValidFormat) {
    throw new Error(`Invalid recipient address: ${addrInspection.errors[0] || "Invalid format"}`);
  }
  if (!addrInspection.networkMatch) {
    throw new Error(
      `Recipient address network mismatch (${addrInspection.detectedNetwork} vs expected ${network}).`
    );
  }

  // Validate amount
  const zatoshis = zecToZatoshis(request.amount);

  // Validate memo
  let memoBase64Url: string | undefined = undefined;
  if (request.memo && request.memo.trim().length > 0) {
    if (addrInspection.addressType === "transparent") {
      throw new Error("Memos are strictly rejected for transparent addresses (t- addresses cannot receive shielded memos).");
    }
    const memoBytes = utf8ToBytes(request.memo);
    if (memoBytes.length > 512) {
      throw new Error(`Memo exceeds 512 bytes (got ${memoBytes.length} bytes).`);
    }
    // Check for non-printable control characters
    if (/[\p{Cc}\p{Cf}]/u.test(request.memo)) {
      warnings.push("Memo contains control characters that may be rejected by some wallet parsers.");
    }
    memoBase64Url = bytesToBase64Url(memoBytes);
  }

  if (addrInspection.addressType === "transparent") {
    warnings.push("Unshielded payment: transparent recipients expose transfer metadata on-chain.");
  }

  // Build URI
  let uri = `zcash:${encodeURIComponent(addrInspection.trimmed)}?amount=${request.amount}`;
  if (memoBase64Url) {
    uri += `&memo=${memoBase64Url}`;
  }

  return {
    uri,
    recipient: addrInspection.trimmed,
    amount: request.amount,
    amountZatoshis: zatoshis.toString(),
    memoBase64Url,
    isTransparent: addrInspection.addressType === "transparent",
    warnings,
  };
}

/**
 * Parses and verifies a ZIP-321 URI against the Zucchini Wallet 0.5.2 profile.
 */
export function parseZip321Uri(uri: string, expectedNetwork: ZcashNetwork = "testnet"): ParsedZip321Uri {
  const warnings: string[] = [];
  const trimmedUri = (uri || "").trim();
  if (!trimmedUri || !/^zcash:/i.test(trimmedUri)) {
    throw new Error("Invalid URI: Must begin with 'zcash:'");
  }

  const match = /^zcash:([A-Za-z0-9]*)(?:\?([^#]*))?$/i.exec(trimmedUri);
  if (!match) {
    throw new Error("Malformed ZIP-321 URI structure.");
  }

  const pathAddress = match[1] || "";
  const queryString = match[2] || "";

  const params = new URLSearchParams(queryString);

  // Zucchini strict single-recipient subset checks
  const recipient = pathAddress || params.get("address") || "";
  if (!recipient) {
    throw new Error("Missing recipient address in payment URI.");
  }
  if (pathAddress && params.has("address")) {
    throw new Error("Duplicate address definition in path and query parameter.");
  }

  // Validate address
  const addrInspection = inspectAddress(recipient, expectedNetwork);
  if (!addrInspection.isValidFormat) {
    throw new Error(`Invalid address in URI: ${addrInspection.errors[0]}`);
  }
  if (!addrInspection.networkMatch) {
    throw new Error(
      `Network mismatch in URI: address is for ${addrInspection.detectedNetwork}, expected ${expectedNetwork}.`
    );
  }

  // Validate amount
  const amount = params.get("amount");
  if (!amount) {
    throw new Error("Missing required 'amount' parameter in payment URI.");
  }
  const zatoshis = zecToZatoshis(amount);

  // Validate memo
  const memoBase64Url = params.get("memo") || undefined;
  let memoText: string | undefined = undefined;

  if (memoBase64Url) {
    if (addrInspection.addressType === "transparent") {
      throw new Error("Invalid URI: Transparent recipient cannot have a memo parameter.");
    }
    const memoBytes = base64UrlToBytes(memoBase64Url);
    if (memoBytes.length > 512) {
      throw new Error(`Memo in URI exceeds 512 byte limit (${memoBytes.length} bytes).`);
    }
    memoText = decodeBase64UrlMemo(memoBase64Url);
  }

  // Check for indexed/unsupported parameters
  for (const key of Array.from(params.keys())) {
    if (key.includes(".") || ["req-", "asset"].some((prefix) => key.startsWith(prefix))) {
      throw new Error(`Unsupported ZIP-321 parameter '${key}' (indexed/custom assets rejected by wallet subset).`);
    }
  }

  return {
    recipient,
    amount,
    amountZatoshis: zatoshis.toString(),
    memoText,
    memoBase64Url,
    isTransparent: addrInspection.addressType === "transparent",
    warnings,
  };
}

/**
 * Zod schema for Payment Request Builder form input.
 */
export const paymentBuilderSchema = z
  .object({
    network: z.enum(["testnet", "mainnet"]),
    recipient: z.string().min(1, "Recipient address is required"),
    amount: z
      .string()
      .min(1, "Amount is required")
      .regex(/^\d+(\.\d{1,8})?$/, "Amount must be a positive number with at most 8 decimal places")
      .refine((val) => {
        try {
          const zats = zecToZatoshis(val);
          return zats > BigInt(0);
        } catch {
          return false;
        }
      }, "Amount must be greater than 0"),
    memo: z.string().max(512, "Memo text cannot exceed 512 characters").optional(),
  })
  .superRefine((data, ctx) => {
    // Address validation
    const addr = inspectAddress(data.recipient, data.network);
    if (!addr.isValidFormat) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recipient"],
        message: addr.errors[0] || "Invalid address format",
      });
    } else if (!addr.networkMatch) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recipient"],
        message: `Address belongs to ${addr.detectedNetwork}, but form is set to ${data.network}`,
      });
    }

    // Transparent address cannot have memo
    if (addr.addressType === "transparent" && data.memo && data.memo.trim().length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["memo"],
        message: "Transparent addresses (t- addresses) cannot receive shielded memos",
      });
    }

    // Memo byte length check
    if (data.memo && data.memo.trim().length > 0) {
      const bytes = utf8ToBytes(data.memo);
      if (bytes.length > 512) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["memo"],
          message: `Memo exceeds 512 bytes when encoded as UTF-8 (currently ${bytes.length} bytes)`,
        });
      }
    }
  });

export type PaymentBuilderFormValues = z.infer<typeof paymentBuilderSchema>;
