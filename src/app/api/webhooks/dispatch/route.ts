import { NextRequest, NextResponse } from "next/server";
import {
  generateWebhookSignature,
  getServerWebhookSecret,
  dispatchWebhookWithRetries,
  WebhookEventPayload,
} from "@/lib/zcash/webhooks";

export const dynamic = "force-dynamic";

export interface DispatchRequestBody {
  payload: WebhookEventPayload;
  targetUrl: string;
  tamperMode?: "none" | "invalid_signature" | "tampered_body" | "expired_timestamp" | "duplicate" | "simulate_500";
  maxRetries?: number;
}

export async function POST(req: NextRequest) {
  let body: DispatchRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON in dispatch request body" }, { status: 400 });
  }

  const { payload, targetUrl, tamperMode = "none", maxRetries = 3 } = body;

  if (!payload || !targetUrl) {
    return NextResponse.json(
      { error: "Missing required fields: payload and targetUrl" },
      { status: 400 }
    );
  }

  const secret = getServerWebhookSecret();
  const rawBody = JSON.stringify(payload);

  // Determine timestamp and signature based on tamper mode
  const now = Math.floor(Date.now() / 1000);
  let timestamp = now;
  if (tamperMode === "expired_timestamp") {
    // 10 minutes (600 seconds) in the past, exceeding 300s tolerance
    timestamp = now - 600;
  }

  const generated = generateWebhookSignature(rawBody, secret, timestamp);
  let signatureHeader = generated.header;
  let bodyToSend = rawBody;

  if (tamperMode === "invalid_signature") {
    // Corrupt the signature hex
    signatureHeader = `t=${timestamp},v1=bad000000000000000000000000000000000000000000000000000000000dead`;
  } else if (tamperMode === "tampered_body") {
    // Modify body after signature has already been computed
    const tampered = JSON.parse(rawBody);
    tampered.data.receivedAmountZEC = "999.00000000";
    tampered.data.canFulfill = true;
    bodyToSend = JSON.stringify(tampered);
  }

  // Handle URL resolution for relative paths (e.g. "/api/webhooks/receiver")
  let destinationUrl = targetUrl;
  if (targetUrl.startsWith("/")) {
    const origin = req.nextUrl.origin;
    destinationUrl = `${origin}${targetUrl}`;
  }

  // If simulate_500 mode, we pass a custom header through our fetch
  const customFetch: typeof fetch = (input, init) => {
    if (tamperMode === "simulate_500") {
      const headers = new Headers(init?.headers);
      headers.set("x-simulate-error", "500");
      return fetch(input, { ...init, headers });
    }
    return fetch(input, init);
  };

  // Perform delivery with bounded retries
  const result = await dispatchWebhookWithRetries({
    url: destinationUrl,
    rawBody: bodyToSend,
    signatureHeader,
    maxRetries,
    initialBackoffMs: 80,
    fetchFn: customFetch,
  });

  // If duplicate test mode is requested, execute a second immediate delivery
  // to demonstrate idempotency detection
  let secondDeliveryResult = null;
  if (tamperMode === "duplicate" && result.success) {
    secondDeliveryResult = await dispatchWebhookWithRetries({
      url: destinationUrl,
      rawBody: bodyToSend,
      signatureHeader,
      maxRetries: 1,
      fetchFn: customFetch,
    });
  }

  return NextResponse.json({
    success: result.success,
    tamperMode,
    signatureHeader,
    bodySent: bodyToSend,
    result,
    secondDeliveryResult,
  });
}
