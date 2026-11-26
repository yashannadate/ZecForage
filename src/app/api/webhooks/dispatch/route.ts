import { NextRequest, NextResponse } from "next/server";
import {
  generateWebhookSignature,
  getServerWebhookSecret,
  dispatchWebhookWithRetries,
  WebhookEventPayload,
  WebhookEventPayloadSchema,
} from "@/lib/zcash/webhooks";

export const dynamic = "force-dynamic";

export interface DispatchRequestBody {
  payload: WebhookEventPayload;
  targetUrl: string;
  tamperMode?: "none" | "invalid_signature" | "tampered_body" | "expired_timestamp" | "duplicate" | "simulate_500";
  maxRetries?: number;
}

function resolveSafeDestinationUrl(targetUrl: string, origin: string): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = targetUrl.trim();
  if (!trimmed) {
    return { ok: false, error: "Target receiver URL cannot be empty." };
  }
  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) {
      return { ok: false, error: "Protocol-relative target URLs are not permitted." };
    }
    return { ok: true, url: `${origin}${trimmed}` };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: "Malformed target receiver URL. Use a relative path like /api/webhooks/receiver or an http(s) URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: `Unsupported URL protocol '${parsed.protocol}'. Only http: and https: are allowed.` };
  }

  // Block link-local / cloud metadata SSRF ranges
  const host = parsed.hostname.toLowerCase();
  if (host === "169.254.169.254" || host.startsWith("169.254.") || host === "metadata.google.internal") {
    return { ok: false, error: "Target host is blocked by SSRF safety policy." };
  }

  return { ok: true, url: parsed.toString() };
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

  const parsedPayload = WebhookEventPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    return NextResponse.json(
      { error: "Invalid webhook event payload schema", details: parsedPayload.error.issues },
      { status: 400 }
    );
  }

  const resolvedUrl = resolveSafeDestinationUrl(targetUrl, req.nextUrl.origin);
  if (!resolvedUrl.ok) {
    return NextResponse.json({ error: resolvedUrl.error }, { status: 400 });
  }

  const secret = getServerWebhookSecret();
  const rawBody = JSON.stringify(parsedPayload.data);

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

  const destinationUrl = resolvedUrl.url;

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
