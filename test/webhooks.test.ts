import { describe, it, expect, beforeEach } from "vitest";
import {
  computeHmacSignature,
  generateWebhookSignature,
  verifyWebhookSignature,
  WebhookEventPayloadSchema,
  createSampleWebhookEvent,
  InMemoryIdempotencyStore,
  dispatchWebhookWithRetries,
  DEFAULT_DEV_WEBHOOK_SECRET,
} from "../src/lib/zcash/webhooks";

describe("Phase 6: HMAC-SHA256 Webhook Dispatcher & Receiver Tests", () => {
  const testSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  let idempotencyStore: InMemoryIdempotencyStore;

  beforeEach(() => {
    idempotencyStore = new InMemoryIdempotencyStore();
  });

  // --------------------------------------------------------------------------
  // 1. HMAC Generation & Format
  // --------------------------------------------------------------------------
  describe("HMAC Generation & Header Formatting", () => {
    it("generates deterministic 64-character hex HMAC-SHA256 digest", () => {
      const rawBody = JSON.stringify({ hello: "zcash" });
      const timestamp = 1700000000;
      const hmac1 = computeHmacSignature(rawBody, timestamp, testSecret);
      const hmac2 = computeHmacSignature(rawBody, timestamp, testSecret);

      expect(hmac1).toBe(hmac2);
      expect(hmac1).toMatch(/^[a-f0-9]{64}$/);
    });

    it("generates header in format t={timestamp},v1={hex_digest}", () => {
      const rawBody = JSON.stringify({ action: "payment" });
      const { header, timestamp, signature } = generateWebhookSignature(rawBody, testSecret, 1700000000);

      expect(header).toBe(`t=1700000000,v1=${signature}`);
      expect(timestamp).toBe(1700000000);
      expect(signature).toHaveLength(64);
    });

    it("throws error when secret is empty", () => {
      expect(() => computeHmacSignature("body", 1700000000, "")).toThrow(
        "HMAC signing requires a non-empty secret."
      );
    });
  });

  // --------------------------------------------------------------------------
  // 2. Signature Verification & Tampering Rejection
  // --------------------------------------------------------------------------
  describe("Signature Verification & Security Invariants", () => {
    it("verifies valid signature with matching body, timestamp, and secret", () => {
      const payload = createSampleWebhookEvent("payment.paid");
      const rawBody = JSON.stringify(payload);
      const now = Math.floor(Date.now() / 1000);
      const { header } = generateWebhookSignature(rawBody, testSecret, now);

      const result = verifyWebhookSignature({
        rawBody,
        signatureHeader: header,
        secret: testSecret,
        currentTimestamp: now,
      });

      expect(result.isValid).toBe(true);
      expect(result.timestamp).toBe(now);
    });

    it("rejects tampered payload body when signature was signed on original body", () => {
      const payload = createSampleWebhookEvent("payment.underpaid");
      const rawBody = JSON.stringify(payload);
      const now = Math.floor(Date.now() / 1000);
      const { header } = generateWebhookSignature(rawBody, testSecret, now);

      // Attacker tampers with body to claim fulfillment
      const tampered = JSON.parse(rawBody);
      tampered.data.canFulfill = true;
      tampered.data.receivedAmountZEC = "10.00000000";
      const tamperedBody = JSON.stringify(tampered);

      const result = verifyWebhookSignature({
        rawBody: tamperedBody,
        signatureHeader: header,
        secret: testSecret,
        currentTimestamp: now,
      });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Signature mismatch");
    });

    it("rejects invalid signature string", () => {
      const rawBody = JSON.stringify({ test: 123 });
      const now = Math.floor(Date.now() / 1000);
      const badHeader = `t=${now},v1=0000000000000000000000000000000000000000000000000000000000000000`;

      const result = verifyWebhookSignature({
        rawBody,
        signatureHeader: badHeader,
        secret: testSecret,
        currentTimestamp: now,
      });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Signature mismatch");
    });

    it("rejects malformed header missing t or v1", () => {
      const rawBody = JSON.stringify({ test: 123 });
      const result = verifyWebhookSignature({
        rawBody,
        signatureHeader: "invalid-header-format",
        secret: testSecret,
      });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Malformed signature header");
    });

    it("rejects when signature header is missing or empty", () => {
      const result = verifyWebhookSignature({
        rawBody: "{}",
        signatureHeader: "",
        secret: testSecret,
      });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Missing signature header");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Timestamp Freshness & Replay Attack Protection
  // --------------------------------------------------------------------------
  describe("Timestamp Freshness & Replay Protection", () => {
    it("rejects expired timestamp older than tolerance window (300s)", () => {
      const rawBody = JSON.stringify({ action: "expire" });
      const now = 1700000500;
      const oldTimestamp = now - 350; // 350s old > 300s tolerance
      const { header } = generateWebhookSignature(rawBody, testSecret, oldTimestamp);

      const result = verifyWebhookSignature({
        rawBody,
        signatureHeader: header,
        secret: testSecret,
        toleranceSeconds: 300,
        currentTimestamp: now,
      });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Signature expired");
    });

    it("accepts timestamp within the tolerance window", () => {
      const rawBody = JSON.stringify({ action: "fresh" });
      const now = 1700000500;
      const validTimestamp = now - 120; // 120s old <= 300s
      const { header } = generateWebhookSignature(rawBody, testSecret, validTimestamp);

      const result = verifyWebhookSignature({
        rawBody,
        signatureHeader: header,
        secret: testSecret,
        toleranceSeconds: 300,
        currentTimestamp: now,
      });

      expect(result.isValid).toBe(true);
    });

    it("rejects timestamp far in the future (> 5s clock skew)", () => {
      const rawBody = JSON.stringify({ action: "future" });
      const now = 1700000000;
      const futureTimestamp = now + 60; // 60s in future
      const { header } = generateWebhookSignature(rawBody, testSecret, futureTimestamp);

      const result = verifyWebhookSignature({
        rawBody,
        signatureHeader: header,
        secret: testSecret,
        currentTimestamp: now,
      });

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain("Signature timestamp is in the future");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Idempotency & Deduplication
  // --------------------------------------------------------------------------
  describe("Idempotency Storage & Deduplication", () => {
    it("records processed event and identifies duplicate delivery", () => {
      const eventId = "evt_sim_test_001";
      expect(idempotencyStore.has(eventId)).toBe(false);

      idempotencyStore.record({
        eventId,
        eventType: "payment.paid",
        invoiceId: "inv_123",
        processedAt: Date.now(),
        statusCode: 200,
        responseMessage: "Fulfilled",
        canFulfill: true,
        receivedAmountZEC: "0.05000000",
      });

      expect(idempotencyStore.has(eventId)).toBe(true);
      const record = idempotencyStore.get(eventId);
      expect(record?.invoiceId).toBe("inv_123");
      expect(record?.canFulfill).toBe(true);
    });

    it("clears records successfully", () => {
      idempotencyStore.record({
        eventId: "evt_1",
        eventType: "payment.detected",
        invoiceId: "inv_1",
        processedAt: Date.now(),
        statusCode: 200,
        responseMessage: "Detected",
        canFulfill: false,
        receivedAmountZEC: "0.05000000",
      });

      expect(idempotencyStore.getAll()).toHaveLength(1);
      idempotencyStore.clear();
      expect(idempotencyStore.getAll()).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 5. Schema Validation for All 7 Event Types
  // --------------------------------------------------------------------------
  describe("Webhook Event Schema Validation", () => {
    const eventTypes = [
      "payment.detected",
      "payment.confirming",
      "payment.paid",
      "payment.underpaid",
      "payment.overpaid",
      "payment.late",
      "payment.reorg_review",
    ] as const;

    for (const type of eventTypes) {
      it(`validates sample payload for event type: ${type}`, () => {
        const payload = createSampleWebhookEvent(type);
        const parsed = WebhookEventPayloadSchema.safeParse(payload);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
          expect(parsed.data.type).toBe(type);
          expect(parsed.data.data.currency).toBe("ZEC");
          expect(parsed.data.data.isSimulated).toBe(true);
        }
      });
    }

    it("rejects payload missing required fields or having negative confirmations", () => {
      const invalidPayload = {
        id: "evt_invalid",
        type: "payment.paid",
        createdAt: 1700000000,
        data: {
          invoiceId: "inv_bad",
          requestedAmountZEC: "0.05",
          receivedAmountZEC: "0.05",
          currency: "USD", // INVALID CURRENCY
          confirmations: -1, // INVALID CONFIRMATIONS
          requiredConfirmations: 10,
          reconciliationState: "paid",
          canFulfill: true,
          simulatedTxRef: null,
          isSimulated: true,
        },
      };

      const parsed = WebhookEventPayloadSchema.safeParse(invalidPayload);
      expect(parsed.success).toBe(false);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Delivery Simulator with Bounded Retries
  // --------------------------------------------------------------------------
  describe("Delivery Simulator & Bounded Retries", () => {
    it("delivers successfully on first attempt when receiver returns HTTP 200", async () => {
      let callCount = 0;
      const mockFetch: typeof fetch = async () => {
        callCount++;
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      };

      const result = await dispatchWebhookWithRetries({
        url: "http://localhost/test",
        rawBody: "{}",
        signatureHeader: "t=1,v1=abc",
        maxRetries: 3,
        initialBackoffMs: 5,
        fetchFn: mockFetch,
      });

      expect(result.success).toBe(true);
      expect(result.totalAttempts).toBe(1);
      expect(callCount).toBe(1);
    });

    it("retries on HTTP 500 server error up to maxRetries", async () => {
      let callCount = 0;
      const mockFetch: typeof fetch = async () => {
        callCount++;
        return new Response("Internal Server Error", { status: 500 });
      };

      const result = await dispatchWebhookWithRetries({
        url: "http://localhost/test",
        rawBody: "{}",
        signatureHeader: "t=1,v1=abc",
        maxRetries: 3,
        initialBackoffMs: 5,
        fetchFn: mockFetch,
      });

      expect(result.success).toBe(false);
      expect(result.totalAttempts).toBe(3);
      expect(callCount).toBe(3);
      expect(result.attempts[0].backoffDelayMs).toBe(5);
      expect(result.attempts[1].backoffDelayMs).toBe(10);
    });

    it("does NOT retry on client 4xx rejection (e.g. invalid signature)", async () => {
      let callCount = 0;
      const mockFetch: typeof fetch = async () => {
        callCount++;
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 });
      };

      const result = await dispatchWebhookWithRetries({
        url: "http://localhost/test",
        rawBody: "{}",
        signatureHeader: "t=1,v1=bad",
        maxRetries: 3,
        initialBackoffMs: 5,
        fetchFn: mockFetch,
      });

      expect(result.success).toBe(false);
      expect(result.totalAttempts).toBe(1); // Fails immediately without retrying client error
      expect(callCount).toBe(1);
    });

    it("recovers if transient failure succeeds on 2nd attempt", async () => {
      let callCount = 0;
      const mockFetch: typeof fetch = async () => {
        callCount++;
        if (callCount === 1) {
          return new Response("Simulated transient 503", { status: 503 });
        }
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      };

      const result = await dispatchWebhookWithRetries({
        url: "http://localhost/test",
        rawBody: "{}",
        signatureHeader: "t=1,v1=abc",
        maxRetries: 3,
        initialBackoffMs: 5,
        fetchFn: mockFetch,
      });

      expect(result.success).toBe(true);
      expect(result.totalAttempts).toBe(2);
      expect(callCount).toBe(2);
    });
  });

  // --------------------------------------------------------------------------
  // 7. Secret Isolation
  // --------------------------------------------------------------------------
  describe("Secret Isolation & Safe Defaults", () => {
    it("never includes the secret inside generated payload data", () => {
      const payload = createSampleWebhookEvent("payment.paid");
      const serialized = JSON.stringify(payload);

      expect(serialized).not.toContain(testSecret);
      expect(serialized).not.toContain(DEFAULT_DEV_WEBHOOK_SECRET);
    });
  });
});
