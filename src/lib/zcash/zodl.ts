import {
  buildZip321Uri,
  parseZip321Uri,
  type Zip321PaymentRequest,
  type GeneratedPaymentUri,
} from "./zip321";
import { type ZcashNetwork } from "./addresses";

export type ZodlPlatform = "ios" | "android" | "debug_build";

export interface ZodlCompatibilityProfile {
  name: string;
  formerName: string;
  developer: string;
  repositoryUrl: string;
  integrationType: "air_gapped_qr_and_deeplink";
  supportedNetworks: readonly ZcashNetwork[];
  supportedAddressTypes: readonly ["unified", "sapling", "transparent"];
  maxMemoBytes: number;
  maxDecimalPlaces: number;
  supportsBrowserInjection: false;
  supportsDeepLink: true;
}

export const ZODL_PROFILE: ZodlCompatibilityProfile = {
  name: "Zodl",
  formerName: "Zashi",
  developer: "Zcash Open Development Lab (ZODL)",
  repositoryUrl: "https://github.com/zodl-inc",
  integrationType: "air_gapped_qr_and_deeplink",
  supportedNetworks: ["mainnet", "testnet"],
  supportedAddressTypes: ["unified", "sapling", "transparent"],
  maxMemoBytes: 512,
  maxDecimalPlaces: 8,
  supportsBrowserInjection: false,
  supportsDeepLink: true,
};

export interface ZodlPaymentRequestOptions extends Zip321PaymentRequest {
  network: ZcashNetwork;
}

export interface ZodlPaymentResult {
  uri: string;
  deepLink: string;
  recipient: string;
  amount: string;
  amountZatoshis: string;
  memoBase64Url?: string;
  network: ZcashNetwork;
  isTransparent: boolean;
  warnings: string[];
  parameterAudit: {
    singleRecipient: boolean;
    validAmountFormat: boolean;
    memoCompliant: boolean;
    transparentMemoRejected: boolean;
  };
}

export interface ZodlTestRunRecord {
  id: string;
  timestamp: number;
  platform: ZodlPlatform;
  network: ZcashNetwork;
  uri: string;
  checklist: {
    scannedSuccessfully: boolean;
    addressMatched: boolean;
    amountMatched: boolean;
    memoDecoded: boolean;
    feeCalculated: boolean;
  };
  result: "passed" | "failed" | "parameter_rejected";
  observedTxid?: string;
  notes?: string;
  isManualRecord: true;
}

/**
 * Builds and verifies a ZIP-321 payment request tailored for Zodl mobile wallet scanning.
 */
export function generateZodlPaymentRequest(
  options: ZodlPaymentRequestOptions
): ZodlPaymentResult {
  const generated: GeneratedPaymentUri = buildZip321Uri(options);

  // Validate round-trip parsing
  parseZip321Uri(generated.uri, options.network);

  const isTransparent = generated.isTransparent;
  const warnings = [...generated.warnings];

  if (options.network === "mainnet") {
    warnings.push(
      "Mainnet Request: This URI will trigger real funds transfer if scanned by production Zodl."
    );
  } else {
    warnings.push(
      "Testnet Request: Requires a developer/debug build of Zodl configured for Zcash Testnet."
    );
  }

  return {
    uri: generated.uri,
    deepLink: generated.uri, // RFC standard zcash:... scheme serves as deep link
    recipient: generated.recipient,
    amount: generated.amount,
    amountZatoshis: generated.amountZatoshis,
    memoBase64Url: generated.memoBase64Url,
    network: options.network,
    isTransparent,
    warnings,
    parameterAudit: {
      singleRecipient: true,
      validAmountFormat: true,
      memoCompliant: !options.memo || options.memo.length <= 512,
      transparentMemoRejected: !(isTransparent && options.memo),
    },
  };
}

/**
 * Creates a structured audit record of a manual Zodl compatibility test run.
 */
export function createZodlTestRun(params: {
  platform: ZodlPlatform;
  network: ZcashNetwork;
  uri: string;
  checklist: {
    scannedSuccessfully: boolean;
    addressMatched: boolean;
    amountMatched: boolean;
    memoDecoded: boolean;
    feeCalculated: boolean;
  };
  result: "passed" | "failed" | "parameter_rejected";
  observedTxid?: string;
  notes?: string;
}): ZodlTestRunRecord {
  return {
    id: `zodl_run_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: Date.now(),
    platform: params.platform,
    network: params.network,
    uri: params.uri,
    checklist: params.checklist,
    result: params.result,
    observedTxid: params.observedTxid?.trim() || undefined,
    notes: params.notes?.trim() || undefined,
    isManualRecord: true,
  };
}
