# ZecForge
### Build. Test. Verify. Shield.

An open-source developer workbench for building, testing, and validating shielded Zcash merchant payment integrations before deploying to production.  
Built for the **Zcash India Build on Zcash Bounty** (November 2026).  
MIT Licensed.

---

## What is ZecForge?

**ZecForge is NOT another cryptocurrency wallet or a generic payment gateway.**

Instead, it is an **integration workbench and developer tool** designed to help merchants, Web3 developers, and payment processors rigorously test, validate, and understand shielded Zcash checkout integrations before touching mainnet funds.

Integrating shielded Zcash payments into e-commerce applications presents specific cryptographic and consensus challenges:
1. **The Merchant Settlement Boundary Rule:** A customer wallet broadcast (`txid`) does **not** equal confirmed merchant receipt. Note decryption must occur independently via an incoming viewing key scanner on the merchant backend with canonical block confirmation accumulation.
2. **ZIP-321 Invariants:** Payment request URIs must adhere to strict decimal limits (max 8 decimals), unpadded base64url memo encodings, and network address validation. Memos are strictly forbidden on transparent addresses.
3. **Wallet Compatibility Realities:** Web3 desktop browser extensions (such as Zucchini via `@zucchinifi/dapp-sdk` EIP-1193 providers) and mobile wallets (such as Zodl, formerly Zashi) operate via completely different integration modalities (browser RPC vs. air-gapped QR scanning and OS-level deep-linking). Mobile wallets do not inject desktop browser providers.
4. **Reconciliation Exceptions & Precedence:** Real-world checkouts encounter underpayments, overpayments, late arrivals, missing invoice memos, and chain reorganizations. In standard merchant accounting, **exceptions take precedence over confirmations**; an underpayment or late arrival must never silently transition to `paid` simply by accumulating blocks.
5. **Deterministic Webhook Verification:** Merchant backends must authenticate HMAC-SHA256 status updates without accepting replayed, forged, or duplicate events.

ZecForge provides a deterministic, interactive environment to test every stage of this pipeline.

---

## Intended Users

- **Web3 & Full-Stack Developers:** Building e-commerce checkout plugins, donation widgets, or custom merchant payment processors for Zcash.
- **E-Commerce Merchants:** Testing wallet handoffs and understanding the confirmation lifecycle before accepting real ZEC.
- **Payment Gateway Integrators:** Auditing ZIP-316/ZIP-321 compliance, evaluating wallet compatibility, and testing edge-case payment scenarios (underpayments, reorgs).

---

## Implementation Status

| Module | Standard / Protocol | Status | Description |
|---|---|:---:|---|
| **Workbench Dashboard & Shell (`/`)** | Fintech Design System | ✅ Implemented | Deep navy fintech theme, responsive sidebar drawer, simulated testnet block counter, and 4-stage pipeline visualization. |
| **Receiving Address Validator (`/validator`)** | ZIP-316 & Protocol Spec §5.6.3.1 | ✅ Implemented | Preliminary format check for Unified (`u1`/`utest1`), Sapling (`zs1`/`ztestsapling1`), and Transparent (`t1`/`tm`). Network mismatch detection. |
| **Payment Request Builder (`/builder`)** | ZIP-321 (Zucchini 0.5.2 Subset) | ✅ Implemented | Canonical URI generation, 8-decimal zatoshi precision, unpadded base64url memo encoder, QR code rendering, and transparent memo rejection. |
| **Multi-Wallet Compatibility Sandbox (`/wallets`)** | Zucchini (SDK) & Zodl (QR / Deep Link) | ✅ Implemented | Dual-target testing: browser wallet (Zucchini Dapp SDK) EIP-1193 discovery & dispatch, plus mobile air-gapped wallet (Zodl / Zashi) ZIP-321 QR generation, mobile deep-links, and 5-point manual audit recording. |
| **Edge Case Scenario Simulator (`/scenarios`)** | Fail-Closed Reconciliation FSM | ✅ Implemented | Deterministic 8-state offline reconciliation engine simulating exact integer zatoshis (`BigInt`), `underpaid`, `overpaid`, `late_payment`, and `reorg_review` with structured audit logging. |
| **HMAC Webhook Dispatcher (`/webhooks`)** | HMAC-SHA256 Webhooks | ✅ Implemented | Server-side signing, timestamp binding (`t={ts},v1={hex}`), 300s replay tolerance, constant-time `timingSafeEqual`, schema validation, deduplication store, and bounded retries. |
| **Integration Audit Report (`/reports`)** | Compliance Audit & Export | ✅ Implemented | Consolidated technical audit report with PASS/WARNING/FAIL classifications, 4-tier verification matrix, and Markdown (`.md`) and JSON (`.json`) download exports. |

---

## Core Engineering & Security Invariants

- **Zero Key Ingestion:** ZecForge never collects, stores, or handles private spending keys or seed phrases.
- **Fail-Closed Verification:** No payment is marked confirmed based solely on browser wallet assertions or third-party block explorer APIs.
- **Strict Network Boundary:** Designed and isolated for Zcash Testnet.
- **Format Validation Tier:** Preliminary format checks verify prefix, charset, and length rules. As required by protocol safety standards, ZecForge explicitly informs users that full cryptographic validity requires node/scanner verification.
- **No Pseudo-Cryptography:** Uses standard, documented protocols (ZIP 316, ZIP 321) and `@zucchinifi/dapp-sdk` 0.2.0 integration contracts.
- **Settlement Boundary Rule:** A valid HMAC-SHA256 signature proves that a webhook originated from the holder of the shared secret and was not tampered with in transit. **It does NOT prove that an on-chain Zcash payment took place.** Real settlement requires backend incoming viewing key note decryption.

---

## Module Breakdown

### 1. Receiving Address Validator (`/validator`)
Inspects address structural conformity against Zcash specifications:
- **Unified Addresses (ZIP-316):** Validates `u1` (mainnet) and `utest1` (testnet) Bech32m encodings.
- **Sapling Addresses (Protocol Spec §5.6.3.1):** Validates `zs1` (mainnet) and `ztestsapling1` (testnet) Bech32 encodings.
- **Transparent Addresses (Protocol Spec §5.6.1.1):** Validates `t1` (mainnet) and `tm` (testnet) Base58Check encodings.
- **Network Mismatch Detection:** Flags when a mainnet address is provided while targeting testnet, or vice-versa.
- **Shielded Status & Memo Compatibility:** Warns immediately that transparent addresses cannot receive shielded memos.
- *Notice:* This module performs preliminary structural and character validation. It does not perform cryptographic curve point decompression (Pallas/Jubjub) or verify UTXO/note existence.

### 2. ZIP-321 Payment Request Builder (`/builder`)
Constructs canonical payment requests adhering to the Zucchini Wallet 0.5.2 single-recipient profile:
- **Exact Decimal Arithmetic:** Enforces maximum 8 decimal places for ZEC amounts and converts to exact integer zatoshis (`BigInt`).
- **Base64url Memo Encoder:** Encodes UTF-8 memo text into unpadded base64url strings (max 512 bytes).
- **Transparent Address Restriction:** Automatically disables and forbids memo input when a transparent recipient is selected.
- **Real-Time QR Rendering:** Generates scannable high-contrast QR codes directly containing the canonical `zcash:...` URI.

### 3. Multi-Wallet Compatibility Sandbox (`/wallets`)
Provides dedicated developer test environments for two distinct wallet modalities:
- **Zucchini Wallet (Desktop Browser Extension):**
  - EIP-1193 provider discovery (`window.zucchini`).
  - Permission negotiation and active account detection.
  - Dispatch testing via `provider.request({ method: "requestPayment", params: [uri] })`.
  - Built-in Virtual Provider simulator for deterministic testing without installing the physical extension.
- **Zodl Wallet (Mobile / Air-Gapped):**
  - Clarifies that mobile wallets do not inject desktop browser providers (`window.zodl` does not exist).
  - Generates ZIP-321 QR codes and standard OS deep-links (`zcash:...`).
  - Interactive 5-point manual verification checklist (Scanned, Address Match, Amount Match, Memo Decoded, Fee Calculated).
  - Audit trail recording observed test runs, device platforms (iOS / Android), and transaction references.

### 4. Payment Edge Case Scenario Simulator (`/scenarios`)
A deterministic, offline 8-state finite state machine modeling real-world merchant checkout anomalies:
- **States:** `awaiting_payment` → `detected` (0 confs) → `confirming` (1–9 confs) → `paid` (≥10 confs).
- **Exceptions (Fail-Closed):**
  - `underpaid`: Received amount is less than requested. Automated fulfillment is blocked (`canFulfill: false`). Accumulating confirmations will **never** silently mark an underpayment as `paid`.
  - `overpaid`: Received amount exceeds requested. Flags for manual merchant review/refund.
  - `late_payment`: Payment received after invoice expiry window.
  - `reorg_review`: Blockchain reorganisation dropped confirmation depth below threshold or invalidated the block. If depth re-accumulates on the canonical chain, state recovers safely to `paid`.
- **Configurable Confirmation Policy:** Default 10 confirmations demonstrates a deep reorg-resistance policy (a merchant risk policy, not a protocol rule).
- **BigInt Zatoshi Arithmetic:** Zero floating-point math; all monetary amounts are calculated in exact integer zatoshis.

### 5. HMAC-SHA256 Webhook Dispatcher & Receiver (`/webhooks`)
Enterprise-grade reference webhook architecture for asynchronous status notifications:
- **Canonical Signature Scheme:** Signs `${timestamp}.${rawBody}` using HMAC-SHA256.
- **Header Format:** `X-ZecForge-Signature: t={unix_timestamp},v1={hex_digest}`.
- **Replay Protection:** Timestamps are cryptographically bound to the raw body. Requests older than 300 seconds (5 minutes) or more than 5 seconds in the future are rejected before parsing.
- **Constant-Time Verification:** Uses `crypto.timingSafeEqual` to eliminate timing side-channel attacks.
- **Idempotency & Deduplication:** Tracks event IDs in an `IdempotencyStore`. Duplicate deliveries are acknowledged with HTTP 200 without duplicate order fulfillment.
- **Bounded Retries:** Dispatcher retries transient server errors (HTTP 5xx) with bounded exponential backoff (max 3–5 attempts). Client errors (HTTP 4xx) fail-fast without retry.
- **Secret Isolation:** Signing secrets are loaded exclusively on the server (`.env.example`) and never exposed to client bundles or responses.

### 6. Integration Audit Report (`/reports`)
A consolidated technical readiness report evaluating all workbench modules:
- **Classifications:** Explicitly categorizes checks into **PASS**, **WARNING**, and **FAIL** (no arbitrary numerical readiness score; does not claim pre-production code is "production ready").
- **4-Tier Verification Matrix:**
  1. *Automated Unit Tests:* Verified passing via Vitest (80 tests).
  2. *Simulator Engines:* Verified deterministic offline state machines.
  3. *Manual Device Verification:* Verified via user-recorded physical device checklists.
  4. *On-Chain Verification:* Marked **NOT VERIFIED** (requires future backend scanning node).
- **Export Capabilities:** One-click download of structured Markdown (`.md`) and JSON (`.json`) audit reports.
- **Sanitized Outputs:** Certifies that zero private keys, viewing keys, or webhook secrets are included in report data or exports.

---

## Architecture Overview

```
[Customer Browser / Checkout UI]
       │ (1) Canonical ZIP-321 Payment Request (Unsigned / Memo-bound)
       ▼
[Wallet: Zucchini (Extension) or Zodl (Mobile QR)]
       │ (2) Customer Reviews Recipient, Amount & Memo, Signs & Broadcasts
       ▼
[Zcash Testnet Network] (Halo 2 / Orchard Pool)
       │
       ▼ (3) Compact Block Scanning & Note Decryption (Backend Scanner)
[Merchant Viewing-Only Scanner] (Backend Isolated)
       │ (4) Accumulate 10 Confirmations (`canFulfill: true`)
       ▼
[Merchant Backend Listener] ── HMAC-SHA256 Webhook Verification ── Order Fulfilled
```

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5 (Strict Mode, Target: ES2022)
- **Styling:** Tailwind CSS (Deep navy `#080C14`, elevated surfaces `#0F1626` / `#151F36`, violet `#7C3AED`, emerald `#10B981`)
- **Icons:** Lucide React (featuring `Anvil` wordmark icon)
- **Validation:** Zod
- **QR Generation:** `qrcode`
- **Zcash Integration:** `@zucchinifi/dapp-sdk` 0.2.0
- **Testing:** Vitest (80 unit tests)

---

## Environment Variables

Copy `.env.example` to `.env` or `.env.local` to configure server-side settings:

```bash
cp .env.example .env.local
```

| Variable | Description | Default / Example |
|---|---|---|
| `ZECFORGE_WEBHOOK_SECRET` | Server-side secret key for HMAC-SHA256 webhook signing. | `your_32_byte_hex_secret_here` |
| `ZECFORGE_CONFIRMATION_THRESHOLD` | Default block confirmation threshold for scenario simulation. | `10` |

*Security Notice:* `ZECFORGE_WEBHOOK_SECRET` is never prefixed with `NEXT_PUBLIC_` and is never exposed to browser bundles or client-side code.

---

## Getting Started

### Prerequisites

- Node.js `>= 22` (tested on Node v24.12.0)
- npm or pnpm

### Installation

```bash
git clone https://github.com/yashannadate/ZecForage.git
cd ZecForage
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running Automated Tests

```bash
npm run test
```

Executes the complete Vitest automated test suite covering all 7 test files (80 passing tests):
- `test/addresses.test.ts` (9 tests)
- `test/zip321.test.ts` (11 tests)
- `test/wallet.test.ts` (6 tests)
- `test/zodl.test.ts` (8 tests)
- `test/scenarios.test.ts` (11 tests)
- `test/webhooks.test.ts` (26 tests)
- `test/reports.test.ts` (9 tests)

### Building for Production

```bash
npm run build
npm run start
```

---

## Current Technical Limitations & Roadmap

1. **No Live Blockchain Scanner:** Decrypting incoming shielded notes with an incoming viewing key (IVK) requires a backend lightwalletd or compact block scanner service. This is not implemented in the current workbench and must be built before live mainnet settlement.
2. **Preliminary Address Validation:** The address validator checks structural prefixes, character sets (Bech32m / Base58Check), and length bounds. Full cryptographic curve point decompression (Pallas/Jubjub) requires native cryptographic libraries.
3. **In-Memory Idempotency Store:** The reference webhook receiver deduplication store is in-memory and process-local. In production, backends must use Redis or PostgreSQL unique constraints on `event_id`.
4. **Demonstration Confirmation Threshold:** The default 10-confirmation policy is a configurable merchant demonstration policy against deep reorgs, not a universal Zcash protocol rule.
5. **ZIP-321 Subset:** The current builder implements single-recipient payments conforming to the Zucchini profile. Multi-recipient requests (`?address.1=...`) are not implemented in the current subset.

---

## License

MIT © 2026 ZecForge Contributors
