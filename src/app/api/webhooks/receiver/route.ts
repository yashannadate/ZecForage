import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  WebhookEventPayloadSchema,
  globalIdempotencyStore,
  getServerWebhookSecret,
  WEBHOOK_SIGNATURE_HEADER,
} from "@/lib/zcash/webhooks";

export const dynamic = "force-dynamic";

/**
 * ZecForge Reference Webhook Receiver Endpoint
 *
 * Implements strict security invariants:
 * 1. Reads raw bytes before JSON parsing.
 * 2. Cryptographic HMAC-SHA256 signature verification in constant time.
 * 3. Replay attack rejection via timestamp tolerance check.
 * 4. Schema validation with Zod.
 * 5. Idempotent fulfillment execution via event deduplication.
 *
 * Security Boundary: A valid HMAC proves payload integrity and authenticity
 * from the dispatch secret holder. It DOES NOT prove on-chain settlement,
 * which requires backend incoming viewing key scanning.
 */
export async function POST(req: NextRequest) {
  // Test hook: allow simulator to request transient 500 errors to test retries
  const simulateError = req.headers.get("x-simulate-error");
  if (simulateError === "500") {
    return new NextResponse(
      JSON.stringify({
        error: "Internal Server Error (Simulated 500 for retry testing)",
        transient: true,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 1. Read raw body as text before any parsing
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json(
      { error: "Unable to read request payload body" },
      { status: 400 }
    );
  }

  // 2. Read signature header
  const signatureHeader = req.headers.get(WEBHOOK_SIGNATURE_HEADER);
  const secret = getServerWebhookSecret();

  // 3. Cryptographically verify signature
  const verification = verifyWebhookSignature({
    rawBody,
    signatureHeader,
    secret,
  });

  if (!verification.isValid) {
    return NextResponse.json(
      {
        received: false,
        error: "Webhook signature verification failed",
        reason: verification.reason,
        securityRule: "Fail-closed: unverified or tampered webhooks are rejected immediately.",
      },
      { status: 401 }
    );
  }

  // 4. Parse JSON
  let json: unknown;
  try {
    json = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Malformed JSON payload body" },
      { status: 400 }
    );
  }

  // 5. Validate schema
  const parsed = WebhookEventPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        received: false,
        error: "Invalid webhook event schema",
        details: parsed.error.issues,
      },
      { status: 400 }
    );
  }

  const event = parsed.data;

  // 6. Check Idempotency & Replay Protection
  if (globalIdempotencyStore.has(event.id)) {
    const existing = globalIdempotencyStore.get(event.id);
    return NextResponse.json(
      {
        received: true,
        idempotent: true,
        eventId: event.id,
        invoiceId: event.data.invoiceId,
        message: "Duplicate event acknowledged idempotently. Fulfillment not re-triggered.",
        firstProcessedAt: existing?.processedAt,
        status: "already_processed",
      },
      { status: 200 }
    );
  }

  // 7. Process fulfillment and record into idempotency store
  const canFulfill = event.data.canFulfill;
  const responseMessage = canFulfill
    ? `Order fulfillment authorized for invoice ${event.data.invoiceId} (received ${event.data.receivedAmountZEC} ZEC with ${event.data.confirmations} confs).`
    : `Event ${event.type} logged for invoice ${event.data.invoiceId} (state: ${event.data.reconciliationState}). Fulfillment not authorized.`;

  globalIdempotencyStore.record({
    eventId: event.id,
    eventType: event.type,
    invoiceId: event.data.invoiceId,
    processedAt: Date.now(),
    statusCode: 200,
    responseMessage,
    canFulfill,
    receivedAmountZEC: event.data.receivedAmountZEC,
  });

  return NextResponse.json(
    {
      received: true,
      idempotent: false,
      eventId: event.id,
      eventType: event.type,
      invoiceId: event.data.invoiceId,
      reconciliationState: event.data.reconciliationState,
      confirmations: event.data.confirmations,
      canFulfill,
      message: responseMessage,
      timestamp: verification.timestamp,
    },
    { status: 200 }
  );
}

/**
 * GET handler to inspect idempotency store records during development testing
 */
export async function GET() {
  const records = globalIdempotencyStore.getAll();
  return NextResponse.json({
    description: "ZecForge In-Memory Webhook Idempotency Store Status",
    totalProcessed: records.length,
    records,
  });
}
