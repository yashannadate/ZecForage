import crypto from "crypto";
import { z } from "zod";
import type { PaymentState } from "./scenarios";

// ============================================================================
// 1. WEBHOOK EVENT SCHEMAS & TYPES
// ============================================================================

export const WebhookEventTypeEnum = z.enum([
  "payment.detected",
  "payment.confirming",
  "payment.paid",
  "payment.underpaid",
  "payment.overpaid",
  "payment.late",
  "payment.reorg_review",
]);

export type WebhookEventType = z.infer<typeof WebhookEventTypeEnum>;

export const WebhookEventDataSchema = z.object({
  invoiceId: z.string().min(1),
  requestedAmountZEC: z.string().regex(/^\d+(\.\d{1,8})?$/),
  receivedAmountZEC: z.string().regex(/^\d+(\.\d{1,8})?$/),
  currency: z.literal("ZEC"),
  confirmations: z.number().int().nonnegative(),
  requiredConfirmations: z.number().int().positive(),
  reconciliationState: z.enum([
    "awaiting_payment",
    "detected",
    "confirming",
    "paid",
    "underpaid",
    "overpaid",
    "late_payment",
    "reorg_review",
  ]),
  canFulfill: z.boolean(),
  simulatedTxRef: z.string().nullable(),
  isSimulated: z.literal(true),
});

export const WebhookEventPayloadSchema = z.object({
  id: z.string().min(1),
  type: WebhookEventTypeEnum,
  createdAt: z.number().int().positive(),
  data: WebhookEventDataSchema,
});

export type WebhookEventPayload = z.infer<typeof WebhookEventPayloadSchema>;

// ============================================================================
// 2. CONSTANTS & CONFIGURATION
// ============================================================================

export const WEBHOOK_SIGNATURE_HEADER = "x-zecforge-signature";
export const DEFAULT_TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes
export const DEFAULT_DEV_WEBHOOK_SECRET = "zecforge_dev_secret_0123456789abcdef0123456789abcdef";

/**
 * Retrieves the server-side webhook signing secret.
 * Never expose this function or secret to client-side components.
 */
export function getServerWebhookSecret(): string {
  const envSecret = process.env.ZECFORGE_WEBHOOK_SECRET;
  if (envSecret && envSecret.trim().length > 0) {
    return envSecret.trim();
  }
  return DEFAULT_DEV_WEBHOOK_SECRET;
}

// ============================================================================
// 3. HMAC-SHA256 SIGNING & VERIFICATION
// ============================================================================

/**
 * Computes an HMAC-SHA256 hex digest over the timestamp and raw serialized payload.
 * Canonical message format: `${timestamp}.${rawBody}`
 */
export function computeHmacSignature(rawBody: string, timestamp: number, secret: string): string {
  if (!secret || secret.trim().length === 0) {
    throw new Error("HMAC signing requires a non-empty secret.");
  }
  const payloadToSign = `${timestamp}.${rawBody}`;
  return crypto.createHmac("sha256", secret).update(payloadToSign).digest("hex");
}

/**
 * Generates the standard X-ZecForge-Signature header value.
 * Format: `t=${timestamp},v1=${signatureHex}`
 */
export function generateWebhookSignature(
  rawBody: string,
  secret: string,
  timestamp?: number
): {
  header: string;
  timestamp: number;
  signature: string;
} {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const signature = computeHmacSignature(rawBody, ts, secret);
  const header = `t=${ts},v1=${signature}`;
  return {
    header,
    timestamp: ts,
    signature,
  };
}

export interface SignatureVerificationResult {
  isValid: boolean;
  reason?: string;
  timestamp?: number;
  signature?: string;
}

/**
 * Cryptographically verifies an incoming webhook's HMAC-SHA256 signature
 * against raw request body bytes using constant-time comparison.
 */
export function verifyWebhookSignature(params: {
  rawBody: string;
  signatureHeader: string | null | undefined;
  secret: string;
  toleranceSeconds?: number;
  currentTimestamp?: number;
}): SignatureVerificationResult {
  const { rawBody, signatureHeader, secret } = params;
  const tolerance = params.toleranceSeconds ?? DEFAULT_TIMESTAMP_TOLERANCE_SECONDS;
  const now = params.currentTimestamp ?? Math.floor(Date.now() / 1000);

  if (!signatureHeader || signatureHeader.trim().length === 0) {
    return { isValid: false, reason: "Missing signature header" };
  }

  // Parse `t={timestamp},v1={signature}`
  const match = signatureHeader.match(/^t=(\d+),v1=([a-fA-F0-9]+)$/);
  if (!match) {
    return {
      isValid: false,
      reason: "Malformed signature header. Expected format: t={unix_seconds},v1={hex_digest}",
    };
  }

  const timestamp = parseInt(match[1], 10);
  const providedSignature = match[2].toLowerCase();

  // Replay protection & timestamp freshness validation
  const age = now - timestamp;
  if (age > tolerance) {
    return {
      isValid: false,
      reason: `Signature expired: timestamp is ${age}s old (tolerance: ${tolerance}s)`,
      timestamp,
      signature: providedSignature,
    };
  }

  // Clock skew tolerance: allow at most 5 seconds into the future
  if (timestamp - now > 5) {
    return {
      isValid: false,
      reason: `Signature timestamp is in the future (${timestamp - now}s ahead)`,
      timestamp,
      signature: providedSignature,
    };
  }

  // Calculate expected HMAC
  let expectedSignature: string;
  try {
    expectedSignature = computeHmacSignature(rawBody, timestamp, secret).toLowerCase();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return { isValid: false, reason: `Failed to compute HMAC: ${errorMsg}` };
  }

  // Constant-time comparison to prevent timing side-channel attacks
  const providedBuf = Buffer.from(providedSignature, "hex");
  const expectedBuf = Buffer.from(expectedSignature, "hex");

  if (providedBuf.length !== expectedBuf.length) {
    return {
      isValid: false,
      reason: "Signature length mismatch",
      timestamp,
      signature: providedSignature,
    };
  }

  const isMatch = crypto.timingSafeEqual(providedBuf, expectedBuf);
  if (!isMatch) {
    return {
      isValid: false,
      reason: "Signature mismatch: payload tampered or secret incorrect",
      timestamp,
      signature: providedSignature,
    };
  }

  return {
    isValid: true,
    timestamp,
    signature: providedSignature,
  };
}

// ============================================================================
// 4. IDEMPOTENCY & REPLAY PROTECTION STORAGE ABSTRACTION
// ============================================================================

export interface ProcessedWebhookRecord {
  eventId: string;
  eventType: WebhookEventType;
  invoiceId: string;
  processedAt: number;
  statusCode: number;
  responseMessage: string;
  canFulfill: boolean;
  receivedAmountZEC: string;
}

export interface IdempotencyStore {
  has(eventId: string): Promise<boolean> | boolean;
  get(eventId: string): Promise<ProcessedWebhookRecord | null> | ProcessedWebhookRecord | null;
  record(record: ProcessedWebhookRecord): Promise<void> | void;
  clear(): void;
  getAll(): Promise<ProcessedWebhookRecord[]> | ProcessedWebhookRecord[];
}

/**
 * In-memory deduplication store.
 *
 * NOTE: Designed for local development, simulation, and tests.
 * This in-memory store DOES NOT persist across application restarts
 * and DOES NOT synchronize across horizontally scaled multi-instance clusters.
 * In production environments, replace with Redis or PostgreSQL unique constraint.
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private records = new Map<string, ProcessedWebhookRecord>();

  has(eventId: string): boolean {
    return this.records.has(eventId);
  }

  get(eventId: string): ProcessedWebhookRecord | null {
    return this.records.get(eventId) || null;
  }

  record(record: ProcessedWebhookRecord): void {
    this.records.set(record.eventId, record);
  }

  clear(): void {
    this.records.clear();
  }

  getAll(): ProcessedWebhookRecord[] {
    return Array.from(this.records.values());
  }
}

// Global process-wide singleton store for the local server instance
declare global {
  // eslint-disable-next-line no-var
  var __zecforge_idempotency_store__: InMemoryIdempotencyStore | undefined;
}

export const globalIdempotencyStore: InMemoryIdempotencyStore =
  globalThis.__zecforge_idempotency_store__ ||
  (globalThis.__zecforge_idempotency_store__ = new InMemoryIdempotencyStore());

// ============================================================================
// 5. CONTROLLED DELIVERY SIMULATOR WITH BOUNDED RETRIES
// ============================================================================

export interface DeliveryAttempt {
  attemptNumber: number;
  timestamp: number;
  httpStatus: number | null;
  responseBody: string | null;
  success: boolean;
  error?: string;
  backoffDelayMs?: number;
}

export interface WebhookDeliveryResult {
  success: boolean;
  finalStatus: number | null;
  totalAttempts: number;
  attempts: DeliveryAttempt[];
  idempotentDuplicate?: boolean;
}

export interface DispatchOptions {
  url: string;
  rawBody: string;
  signatureHeader: string;
  maxRetries?: number;
  initialBackoffMs?: number;
  fetchFn?: typeof fetch;
}

/**
 * Dispatches a webhook to a target URL with observable bounded retries and exponential backoff.
 * Guaranteed never to enter an infinite loop (bounded strictly by maxRetries).
 */
export async function dispatchWebhookWithRetries(
  options: DispatchOptions
): Promise<WebhookDeliveryResult> {
  const { url, rawBody, signatureHeader } = options;
  const maxRetries = Math.min(Math.max(options.maxRetries ?? 3, 1), 5); // Bound between 1 and 5
  const baseBackoff = options.initialBackoffMs ?? 50;
  const customFetch = options.fetchFn ?? fetch;

  const attempts: DeliveryAttempt[] = [];
  let isSuccess = false;
  let finalStatus: number | null = null;
  let isIdempotentDuplicate = false;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const attemptRecord: DeliveryAttempt = {
      attemptNumber: attempt,
      timestamp: Date.now(),
      httpStatus: null,
      responseBody: null,
      success: false,
    };

    try {
      const response = await customFetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [WEBHOOK_SIGNATURE_HEADER]: signatureHeader,
          "User-Agent": "ZecForge-Webhook-Dispatcher/1.0",
        },
        body: rawBody,
      });

      attemptRecord.httpStatus = response.status;
      finalStatus = response.status;

      let text = "";
      try {
        text = await response.text();
        attemptRecord.responseBody = text;
      } catch {
        attemptRecord.responseBody = "<unreadable response>";
      }

      // Check if response indicates success (2xx)
      if (response.status >= 200 && response.status < 300) {
        attemptRecord.success = true;
        isSuccess = true;

        try {
          const parsed = JSON.parse(text);
          if (parsed.idempotent === true) {
            isIdempotentDuplicate = true;
          }
        } catch {
          // Non-JSON 2xx is still treated as success
        }

        attempts.push(attemptRecord);
        break; // Successful delivery, terminate retry loop
      } else if (response.status >= 400 && response.status < 500) {
        // Client errors (4xx: invalid signature, bad request) should NOT be retried
        // because the payload or signature is inherently rejected by receiver policy.
        attemptRecord.error = `Receiver rejected payload with HTTP ${response.status}: ${text}`;
        attempts.push(attemptRecord);
        break;
      } else {
        // Server errors (5xx) are transient and eligible for retry
        attemptRecord.error = `Transient server error HTTP ${response.status}`;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      attemptRecord.error = `Network/Connection error: ${errorMsg}`;
    }

    attempts.push(attemptRecord);

    // If more attempts remain, sleep with bounded exponential backoff
    if (attempt < maxRetries) {
      const delayMs = baseBackoff * Math.pow(2, attempt - 1);
      attemptRecord.backoffDelayMs = delayMs;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    success: isSuccess,
    finalStatus,
    totalAttempts: attempts.length,
    attempts,
    idempotentDuplicate: isIdempotentDuplicate,
  };
}

// ============================================================================
// 6. SAMPLE EVENT FACTORY & PROTOCOL PRESETS
// ============================================================================

export function createSampleWebhookEvent(
  type: WebhookEventType,
  overrides?: Partial<WebhookEventPayload>
): WebhookEventPayload {
  const invoiceId = `inv_test_${Math.random().toString(36).substring(2, 9)}`;
  const eventId = `evt_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = Math.floor(Date.now() / 1000);

  let state: PaymentState = "detected";
  let confs = 0;
  let canFulfill = false;
  let reqAmount = "0.05000000";
  let recAmount = "0.05000000";
  let simTx: string | null = `sim_tx_${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;

  switch (type) {
    case "payment.detected":
      state = "detected";
      confs = 0;
      canFulfill = false;
      break;
    case "payment.confirming":
      state = "confirming";
      confs = 4;
      canFulfill = false;
      break;
    case "payment.paid":
      state = "paid";
      confs = 10;
      canFulfill = true;
      break;
    case "payment.underpaid":
      state = "underpaid";
      confs = 10;
      canFulfill = false;
      recAmount = "0.03500000";
      break;
    case "payment.overpaid":
      state = "overpaid";
      confs = 10;
      canFulfill = false;
      recAmount = "0.06500000";
      break;
    case "payment.late":
      state = "late_payment";
      confs = 10;
      canFulfill = false;
      break;
    case "payment.reorg_review":
      state = "reorg_review";
      confs = 3; // Dropped from 10
      canFulfill = false;
      break;
  }

  const payload: WebhookEventPayload = {
    id: eventId,
    type,
    createdAt: now,
    data: {
      invoiceId,
      requestedAmountZEC: reqAmount,
      receivedAmountZEC: recAmount,
      currency: "ZEC",
      confirmations: confs,
      requiredConfirmations: 10,
      reconciliationState: state,
      canFulfill,
      simulatedTxRef: simTx,
      isSimulated: true,
    },
  };

  if (overrides) {
    return {
      ...payload,
      ...overrides,
      data: {
        ...payload.data,
        ...(overrides.data || {}),
      },
    };
  }

  return payload;
}
