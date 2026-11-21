import type { ZcashNetwork, ZcashAddressType } from "../zcash/addresses";
import type { PaymentState } from "../zcash/scenarios";
import type { WebhookEventType } from "../zcash/webhooks";

export type ReadinessStatus = "PASS" | "WARNING" | "FAIL";

export type VerificationTier =
  | "automated_unit_test"
  | "simulated"
  | "manual_device_verified"
  | "on_chain_testnet"
  | "not_verified";

export interface AddressValidationAudit {
  status: ReadinessStatus;
  tier: VerificationTier;
  standard: "ZIP-316 & Protocol Specification";
  formatCheckPass: boolean;
  sampleTested: string;
  detectedType: ZcashAddressType;
  detectedNetwork: ZcashNetwork | "unknown";
  isShielded: boolean;
  memoSupported: boolean;
  limitations: string[];
}

export interface Zip321Audit {
  status: ReadinessStatus;
  tier: VerificationTier;
  standard: "ZIP-321 (Zucchini 0.5.2 Subset)";
  uriBuilt: string;
  singleRecipientCompliant: boolean;
  zatoshiPrecisionVerified: boolean;
  memoBase64UrlEncodingPass: boolean;
  transparentMemoRejected: boolean;
  supportedSubsetDescription: string;
  limitations: string[];
}

export interface ZucchiniWalletAudit {
  status: ReadinessStatus;
  tier: VerificationTier;
  standard: "@zucchinifi/dapp-sdk 0.2.0 (EIP-1193)";
  providerDiscovered: boolean;
  providerType: "virtual_simulator" | "injected_extension" | "not_detected";
  networkTested: ZcashNetwork;
  permissionsNegotiated: boolean;
  dispatchMethodTested: string;
  txidEmitted: boolean;
  simulatedVsActualNote: string;
}

export interface ZodlWalletAudit {
  status: ReadinessStatus;
  tier: VerificationTier;
  standard: "ZIP-321 Air-Gapped QR & Deep-Linking";
  walletName: string;
  developer: string;
  supportsBrowserInjection: false;
  supportsDeepLink: true;
  qrCodeGenerated: boolean;
  deepLinkGenerated: boolean;
  checklistStatus: {
    scannedSuccessfully: boolean;
    addressMatched: boolean;
    amountMatched: boolean;
    memoDecoded: boolean;
    feeCalculated: boolean;
  };
  manualTestStatus: "passed" | "pending" | "failed" | "parameter_rejected" | "not_recorded";
  notes: string;
}

export interface PaymentScenarioAudit {
  status: ReadinessStatus;
  tier: VerificationTier;
  statesCovered: PaymentState[];
  invoiceAmountZEC: string;
  receivedAmountZEC: string;
  confirmations: number;
  requiredConfirmations: number;
  currentState: PaymentState;
  canFulfill: boolean;
  arithmeticPrecision: string;
  exceptionPrecedenceEnforced: boolean;
  reorgRecoveryTested: boolean;
  simulationBoundaryNote: string;
}

export interface WebhookSecurityAudit {
  status: ReadinessStatus;
  tier: VerificationTier;
  schemaValidationPass: boolean;
  hmacSha256VerificationPass: boolean;
  signatureHeaderFormat: string;
  rawBodyBindingEnforced: boolean;
  timestampToleranceSeconds: number;
  replayProtectionPass: boolean;
  timingSafeEqualUsed: boolean;
  idempotencyDeduplicationTested: boolean;
  retryBackoffBounded: boolean;
  secretIsolationVerified: boolean;
  persistenceLimitationNote: string;
  secretExposed: false;
}

export interface OverallReadinessSummary {
  overallStatus: ReadinessStatus;
  productionReady: false;
  generatedAt: number; // Unix timestamp ms
  version: string;
  targetNetwork: "Zcash Testnet";
  checks: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
  };
  tierBreakdown: {
    automatedTests: ReadinessStatus;
    simulatorWorkflows: ReadinessStatus;
    manualDeviceVerification: ReadinessStatus;
    onChainVerification: "NOT_VERIFIED";
  };
  criticalNotice: string;
}

export interface IntegrationAuditReport {
  meta: {
    title: string;
    version: string;
    generatedAt: number;
    generatedAtIso: string;
    environment: string;
  };
  overall: OverallReadinessSummary;
  addressValidation: AddressValidationAudit;
  zip321: Zip321Audit;
  walletCompatibility: {
    zucchini: ZucchiniWalletAudit;
    zodl: ZodlWalletAudit;
  };
  paymentScenario: PaymentScenarioAudit;
  webhookSecurity: WebhookSecurityAudit;
  technicalLimitations: string[];
  productionReadinessChecklist: {
    requirement: string;
    implementedInZecForge: boolean;
    productionRequirement: string;
  }[];
}
