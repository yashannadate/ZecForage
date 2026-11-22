/**
 * ZecForge — Phase 8: Merchant Config Hub
 * Settings types and constants.
 *
 * All values are developer-side policy config only.
 * No private keys, viewing keys, or webhook secrets are stored here.
 */

// ---------------------------------------------------------------------------
// RPC Endpoint
// ---------------------------------------------------------------------------

export type NetworkTarget = "testnet" | "mainnet" | "custom";

export interface RpcEndpointPreset {
  id: string;
  label: string;
  network: NetworkTarget;
  url: string;
  tls: boolean;
  note: string;
  status: "community" | "official" | "custom";
}

export const RPC_PRESETS: RpcEndpointPreset[] = [
  {
    id: "lightwalletd-testnet-zec-community",
    label: "ZEC Community Testnet",
    network: "testnet",
    url: "lightwalletd.testnet.electriccoin.co:9067",
    tls: true,
    note: "ECC-operated community testnet lightwalletd. Recommended for development.",
    status: "official",
  },
  {
    id: "lightwalletd-mainnet-zec-community",
    label: "ZEC Community Mainnet",
    network: "mainnet",
    url: "lightwalletd.electriccoin.co:9067",
    tls: true,
    note: "ECC-operated mainnet lightwalletd. Use only with a production signing key guard.",
    status: "official",
  },
  {
    id: "lightwalletd-mainnet-zecha",
    label: "Zecha Mainnet (Community)",
    network: "mainnet",
    url: "zecha.io:9067",
    tls: true,
    note: "Community-operated mainnet node. Verify before using in production.",
    status: "community",
  },
  {
    id: "custom",
    label: "Custom Endpoint",
    network: "custom",
    url: "",
    tls: true,
    note: "Connect to your own lightwalletd instance.",
    status: "custom",
  },
];

// ---------------------------------------------------------------------------
// Confirmation Policy
// ---------------------------------------------------------------------------

export interface ConfirmationPolicy {
  threshold: number; // blocks
  estimatedMinutes: number; // at ~75s/block
  riskLabel: "Very Low" | "Low" | "Moderate" | "High" | "Very High";
  riskColor: "emerald" | "emerald" | "amber" | "amber" | "rose";
}

export function deriveConfirmationPolicy(threshold: number): ConfirmationPolicy {
  const estimatedMinutes = Math.round((threshold * 75) / 60);
  let riskLabel: ConfirmationPolicy["riskLabel"];
  let riskColor: ConfirmationPolicy["riskColor"];

  if (threshold >= 10) {
    riskLabel = "Very Low";
    riskColor = "emerald";
  } else if (threshold >= 6) {
    riskLabel = "Low";
    riskColor = "emerald";
  } else if (threshold >= 3) {
    riskLabel = "Moderate";
    riskColor = "amber";
  } else if (threshold >= 2) {
    riskLabel = "High";
    riskColor = "amber";
  } else {
    riskLabel = "Very High";
    riskColor = "rose";
  }

  return { threshold, estimatedMinutes, riskLabel, riskColor };
}

export const CONFIRMATION_THRESHOLD_MIN = 1;
export const CONFIRMATION_THRESHOLD_MAX = 50;
export const CONFIRMATION_THRESHOLD_DEFAULT = 10;

// ---------------------------------------------------------------------------
// Webhook Boilerplate Templates
// ---------------------------------------------------------------------------

export type TemplateFramework = "express" | "nextjs" | "fastapi";

export interface WebhookTemplate {
  id: TemplateFramework;
  label: string;
  language: string;
  filename: string;
  description: string;
  code: string;
}

export const WEBHOOK_TEMPLATES: WebhookTemplate[] = [
  {
    id: "express",
    label: "Express.js",
    language: "typescript",
    filename: "webhook-receiver.ts",
    description: "Node.js Express receiver with HMAC-SHA256 signature verification, replay protection, and idempotency.",
    code: `import express, { Request, Response } from "express";
import crypto from "crypto";

const app = express();

// --- Configuration ---------------------------------------------------------
const WEBHOOK_SECRET = process.env.ZECFORGE_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) throw new Error("ZECFORGE_WEBHOOK_SECRET is not set");

const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
const processedEventIds = new Set<string>(); // Use Redis in production

// --- Middleware: raw body --------------------------------------------------
app.use("/webhooks/zecforge", express.raw({ type: "application/json" }));

// --- Receiver Endpoint ----------------------------------------------------
app.post("/webhooks/zecforge", (req: Request, res: Response) => {
  const sigHeader = req.headers["x-zecforge-signature"] as string | undefined;
  const tsHeader  = req.headers["x-zecforge-timestamp"] as string | undefined;

  if (!sigHeader || !tsHeader) {
    return res.status(400).json({ error: "Missing signature headers" });
  }

  // 1. Replay / timestamp check
  const ts = parseInt(tsHeader, 10);
  if (isNaN(ts) || Date.now() - ts > SIGNATURE_MAX_AGE_MS) {
    return res.status(400).json({ error: "Timestamp expired or invalid" });
  }

  // 2. Reconstruct expected signature
  const payload  = \`\${tsHeader}.\${(req.body as Buffer).toString("utf-8")}\`;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload, "utf-8")
    .digest("hex");

  // 3. Constant-time comparison
  const actual = Buffer.from(sigHeader.replace(/^sha256=/, ""), "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (actual.length !== expBuf.length || !crypto.timingSafeEqual(actual, expBuf)) {
    return res.status(401).json({ error: "Signature mismatch" });
  }

  // 4. Parse and validate event
  let event: Record<string, unknown>;
  try {
    event = JSON.parse((req.body as Buffer).toString("utf-8"));
  } catch {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  if (typeof event.eventId !== "string") {
    return res.status(400).json({ error: "Missing eventId" });
  }

  // 5. Idempotency / deduplication
  if (processedEventIds.has(event.eventId)) {
    return res.status(200).json({ status: "duplicate", eventId: event.eventId });
  }
  processedEventIds.add(event.eventId);

  // 6. Handle event
  console.log("[ZecForge Webhook]", event.type, event.eventId);
  // TODO: implement your business logic per event.type

  return res.status(200).json({ status: "accepted", eventId: event.eventId });
});

app.listen(3001, () => console.log("Webhook receiver on :3001"));
`,
  },
  {
    id: "nextjs",
    label: "Next.js App Router",
    language: "typescript",
    filename: "route.ts",
    description: "Next.js App Router API route with raw body access, HMAC-SHA256 verification and idempotency.",
    code: `import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// --- Configuration ---------------------------------------------------------
const WEBHOOK_SECRET = process.env.ZECFORGE_WEBHOOK_SECRET;
const SIGNATURE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
const processedEventIds = new Set<string>(); // Use Redis / DB in production

// --- POST /api/webhooks/zecforge -------------------------------------------
export async function POST(req: NextRequest) {
  const sigHeader = req.headers.get("x-zecforge-signature");
  const tsHeader  = req.headers.get("x-zecforge-timestamp");

  if (!WEBHOOK_SECRET) {
    console.error("ZECFORGE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!sigHeader || !tsHeader) {
    return NextResponse.json({ error: "Missing signature headers" }, { status: 400 });
  }

  // 1. Timestamp replay check
  const ts = parseInt(tsHeader, 10);
  if (isNaN(ts) || Date.now() - ts > SIGNATURE_MAX_AGE_MS) {
    return NextResponse.json({ error: "Timestamp expired" }, { status: 400 });
  }

  // 2. Read raw bytes — must be done BEFORE any .json() call
  const rawBody = await req.text();

  // 3. Recompute HMAC over timestamp.rawBody
  const payload  = \`\${tsHeader}.\${rawBody}\`;
  const expected = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(payload, "utf-8")
    .digest("hex");

  const actual = Buffer.from(sigHeader.replace(/^sha256=/, ""), "hex");
  const expBuf = Buffer.from(expected, "hex");

  if (actual.length !== expBuf.length || !crypto.timingSafeEqual(actual, expBuf)) {
    return NextResponse.json({ error: "Signature mismatch" }, { status: 401 });
  }

  // 4. Parse JSON after signature is confirmed
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof event.eventId !== "string") {
    return NextResponse.json({ error: "Missing eventId" }, { status: 400 });
  }

  // 5. Idempotency
  if (processedEventIds.has(event.eventId)) {
    return NextResponse.json({ status: "duplicate", eventId: event.eventId });
  }
  processedEventIds.add(event.eventId);

  // 6. Business logic
  console.log("[ZecForge Webhook]", event.type, event.eventId);
  // TODO: implement your business logic per event.type

  return NextResponse.json({ status: "accepted", eventId: event.eventId });
}
`,
  },
  {
    id: "fastapi",
    label: "FastAPI (Python)",
    language: "python",
    filename: "webhook_receiver.py",
    description: "Python FastAPI receiver with HMAC-SHA256 verification, replay protection, and idempotency.",
    code: `import hashlib
import hmac
import os
import time
from fastapi import FastAPI, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse

# --- Configuration ----------------------------------------------------------
WEBHOOK_SECRET: str = os.environ["ZECFORGE_WEBHOOK_SECRET"]
SIGNATURE_MAX_AGE_S: int = 300  # 5 minutes
processed_event_ids: set[str] = set()  # Use Redis / DB in production

app = FastAPI()

# --- POST /webhooks/zecforge ------------------------------------------------
@app.post("/webhooks/zecforge")
async def receive_webhook(
    request: Request,
    x_zecforge_signature: str = Header(...),
    x_zecforge_timestamp: str = Header(...),
) -> JSONResponse:
    # 1. Timestamp replay check
    try:
        ts = int(x_zecforge_timestamp)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid timestamp")

    if abs(time.time() - ts / 1000) > SIGNATURE_MAX_AGE_S:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Timestamp expired")

    # 2. Read raw bytes BEFORE any JSON parsing
    raw_body: bytes = await request.body()

    # 3. Recompute HMAC
    payload = f"{x_zecforge_timestamp}.{raw_body.decode('utf-8')}"
    expected = hmac.new(
        WEBHOOK_SECRET.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    received = x_zecforge_signature.removeprefix("sha256=")

    # 4. Constant-time comparison
    if not hmac.compare_digest(received, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Signature mismatch")

    # 5. Parse JSON after signature verified
    try:
        import json
        event = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON")

    event_id = event.get("eventId")
    if not isinstance(event_id, str):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing eventId")

    # 6. Idempotency
    if event_id in processed_event_ids:
        return JSONResponse({"status": "duplicate", "eventId": event_id})

    processed_event_ids.add(event_id)

    # 7. Business logic
    print(f"[ZecForge Webhook] {event.get('type')} {event_id}")
    # TODO: implement your business logic per event["type"]

    return JSONResponse({"status": "accepted", "eventId": event_id})
`,
  },
];
