# ZecForage

**Build, validate, simulate, and inspect Zcash Testnet payment integrations.**

An open-source, pure-black monochrome developer workbench for designing and testing shielded Zcash merchant payment flows on **Zcash Testnet** before building production infrastructure.  
Created for the **Zcash India Build on Zcash Bounty** (November 2026) · **MIT Licensed**.

---

## What is ZecForage?

**ZecForage is a developer integration workbench — not a cryptocurrency wallet, custody service, or production payment processor.**

Shielded Zcash checkout integrations require strict protocol boundaries and deterministic edge-case handling before any mainnet integration:

1. **Merchant Settlement Boundary Rule:** A customer wallet broadcast (`txid`) does **not** equal confirmed merchant receipt. Note decryption must occur independently on a merchant backend via an incoming viewing key (IVK) scanner with canonical block confirmation accumulation.
2. **ZIP-321 Constraints:** Payment URIs must enforce max 8-decimal ZEC amounts (`BigInt` zatoshis), unpadded `base64url` memo encoding (`<= 512` bytes), Testnet address prefix validation, and strict rejection of shielded memos on transparent (`tm` / `t2`) addresses.
3. **Dual Wallet Modalities:** Browser extensions (**Zucchini Wallet** via `@zucchinifi/dapp-sdk`) and mobile wallets (**Zodl**, formerly Zashi) operate differently — desktop EIP-1193 RPC injection vs. air-gapped ZIP-321 QR scanning and `zcash:` deep links on iOS/Android Testnet builds.
4. **Exception Precedence:** Underpayments, overpayments, late post-expiry arrivals, and chain reorganizations must permanently block automated fulfillment (`canFulfill: false`) regardless of accumulated confirmation depth.
5. **Authenticated Webhooks:** Webhook consumers must verify raw-body HMAC-SHA256 signatures in constant time (`crypto.timingSafeEqual`), enforce timestamp replay tolerances, and handle duplicate deliveries idempotently.

ZecForage provides an isolated, **Testnet-only** browser sandbox and reference local API routes to inspect and test every stage of this workflow.

---

## Verification & Simulation Matrix (Honest Status)

| Feature / Route | Classification | Scope & Notes |
|---|---|---|
| **Public Landing Page (`/`)** | **Verified (UI)** | Full-width black/cyan Next.js landing page with inline local previews and direct workbench entry. |
| **Onboarding Dashboard (`/dashboard`)** | **Verified (Local Browser)** | Compact workspace, browser-local 3-step onboarding checklist, 2×2 inline developer tool launcher, real session activity log, and live extension detection. |
| **Address Validator (`/validator`)** | **Partial (Format-Only)** | Validates Testnet prefixes (`utest1`, `ztestsapling1`, `tm`, `t2`), Bech32/Base58 character sets, lengths, and Mainnet mismatch rejection. Does **not** verify checksums or curve points. |
| **ZIP-321 Builder (`/builder`)** | **Verified (Local)** | Generates canonical Testnet `zcash:` URIs, `BigInt` zatoshis, unpadded `base64url` memos, high-contrast QR PNGs, Copy/Download controls, and syncs latest URI to `/wallets`. |
| **Wallet Compatibility (`/wallets`)** | **Simulated (Zucchini Virtual) / Manual (Zodl QR)** | Supports real `window.zucchini` EIP-1193 discovery plus an explicit Virtual Simulator (mock txids). Zodl iOS/Android generates Testnet QR/deep links and saves manual device verification logs locally. |
| **Scenario Simulator (`/scenarios`)** | **Simulated (Offline FSM)** | Deterministic 8-state reconciliation engine synced with `/settings` confirmation threshold (`BigInt` zatoshi accounting). Zero blockchain node connection. |
| **Webhook Workbench (`/webhooks` & `/api/webhooks/*`)** | **Verified (Local Loopback API)** | Server-side HMAC-SHA256 signing, constant-time verification, raw body check, `300s` replay window, `5xx` bounded retries, SSRF guard, and process-local in-memory idempotency. |
| **Integration Audit Report (`/reports`)** | **Verified (Local)** | Aggregates unit test baseline (`111/111`), local confirmation policy, and recorded Zodl device runs into `.md` and `.json` exports. Always marks on-chain verification `NOT_VERIFIED` and `productionReady: false`. |
| **Merchant Config Hub (`/settings`)** | **Simulated / Reference Only** | Stores local Testnet lightwalletd RPC endpoint references (`host:port` validated), syncs confirmation threshold (`1–50` blocks) to `/scenarios` & `/reports`, and provides Express, Next.js, and FastAPI HMAC receiver templates. |

---

## Core Safety & Security Invariants

- **Testnet-Only Workbench:** All UI address validators, URI builders, wallet dispatch guards, and RPC preset lists are scoped exclusively to Zcash Testnet.
- **Zero Private Key Ingestion:** Never collects, stores, or logs spending keys, seed phrases, or viewing keys.
- **Honest Local State:** Onboarding checklists, settings, and activity logs persist strictly in browser `localStorage` and are never sent to external third parties. Never fabricates balances or on-chain confirmations.
- **Server-Only Webhook Secret:** `ZECFORGE_WEBHOOK_SECRET` is accessed solely in Next.js server routes and never exposed to client bundles, logs, or exported reports.

---

## Architecture Overview

```text
[Developer / Checkout UI] (/dashboard, /builder)
       │ (1) Canonical Testnet ZIP-321 Request (Amount + Base64url Memo)
       ▼
[Wallet Sandbox] (/wallets)
       ├── Browser: @zucchinifi/dapp-sdk (window.zucchini or Virtual Simulator)
       └── Mobile:  Zodl iOS / Android Testnet QR & zcash: Deep Link
       │ (2) Customer Signs & Broadcasts (or Virtual Simulator emits mock txid)
       ▼
[Scenario State Machine] (/scenarios — Offline Simulation)
       │ (3) Validates Exact Amount, Expiry Window & Confirmation Policy (default 10 blocks)
       ▼
[HMAC-SHA256 Webhook Loopback] (/api/webhooks/dispatch -> /api/webhooks/receiver)
       │ (4) Verifies t={unix_s},v1={hex} over "${ts}.${rawBody}" with timingSafeEqual
       ▼
[Compliance Audit Export] (/reports -> .md / .json)
```

---

## Tech Stack

- **Framework:** Next.js 14 (App Router with `(marketing)` and `(workbench)` route groups)
- **Language:** TypeScript 5 (`strict: true`)
- **Styling & Typography:** Tailwind CSS 3 (`#000000` canvas, `#080808` cards, `#262626` borders, `#35C9E8` cyan accent), Geist & Geist Mono fonts
- **Icons:** Lucide React (`16–20px`, `1.5px` stroke width)
- **Validation & Zcash SDK:** Zod, `qrcode`, `@zucchinifi/dapp-sdk` `0.2.0`
- **Testing & Linting:** Vitest (`111` unit tests across `8` suites), ESLint (`next/core-web-vitals`)

---

## Getting Started

### Prerequisites

- **Node.js** `>= 20` (tested on Node `v22` / `v24`)
- **npm**

### 1. Installation

```bash
git clone https://github.com/yashannadate/ZecForage.git
cd ZecForage
npm install
```

### 2. Environment Setup

Copy the example environment file for server-side webhook signing:

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
|---|---|---|
| `ZECFORGE_WEBHOOK_SECRET` | Server-side HMAC-SHA256 webhook signing secret (32+ byte hex recommended). Never prefix with `NEXT_PUBLIC_`. | Development fallback secret when unset |
| `ZECFORGE_CONFIRMATION_THRESHOLD` | Reference confirmation threshold documented for backend templates. | `10` |

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the landing page, or [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to open the Developer Onboarding Workbench.

### 4. Verification Commands

Run automated tests, ESLint, production build, and TypeScript checks:

```bash
# Run all 111 Vitest unit tests across 8 test suites
npm test

# Lint codebase
npm run lint

# Build production bundle (12 App Router routes)
npm run build

# Strict TypeScript check
npx tsc --noEmit
```

**Automated Test Suites (`test/`):**
- `test/addresses.test.ts` (9 tests) — Prefix, charset, whitespace, transparent/sprout warnings, network mismatch
- `test/zip321.test.ts` (11 tests) — Zatoshi `BigInt` precision, 512B base64url memos, SDK round-trip & network mismatch
- `test/wallet.test.ts` (6 tests) — Virtual Zucchini EIP-1193 provider contract, connect, requestPayment, disconnect
- `test/zodl.test.ts` (8 tests) — Zodl QR/deep-link parameter construction & manual audit record builder
- `test/scenarios.test.ts` (11 tests) — 8-state FSM, sticky exception precedence, reorg drop/recovery, reset
- `test/webhooks.test.ts` (26 tests) — HMAC-SHA256 signing, tamper detection, replay window, idempotency, retries
- `test/reports.test.ts` (9 tests) — Audit report tier classification, JSON/Markdown exports, secret exclusion
- `test/settings.test.ts` (31 tests) — Confirmation risk policy, RPC presets, Express/Next.js/FastAPI templates

---

## Known Limitations

1. **No Live Blockchain / Lightwalletd Scanner:** ZecForage does not yet connect to `lightwalletd` gRPC endpoints or perform incoming viewing key (IVK) trial decryption on compact blocks.
2. **Structural Address Checks Only:** Prefix, length, and Bech32/Base58 character checks run client-side; polynomial checksum verification and Pallas/Jubjub curve decompression require native Zcash cryptography.
3. **Single-Recipient ZIP-321 Subset:** Multi-recipient indexed parameters (`?address.1=...`) are rejected per the Zucchini 0.5.2 single-recipient profile.
4. **In-Memory Server Deduplication:** `/api/webhooks/receiver` uses a process-local `InMemoryIdempotencyStore` (not persisted across server restarts; use Redis or SQL unique constraints in production).
5. **Simulated Wallet & Testnet-Only Defaults:** Virtual Zucchini mode returns mock 64-char hex transaction IDs; real wallet signing requires the Zucchini browser extension on Testnet or a Zodl iOS/Android Testnet developer build.

---

## License

Released under the [MIT License](LICENSE).
