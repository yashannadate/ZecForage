# ZecForge
### Build. Test. Verify. Shield.

An open-source developer workbench for building, testing, and validating shielded Zcash merchant payment integrations.  
Built for the **Zcash India Build on Zcash Bounty** (November 2026).  
MIT Licensed.

---

## What is ZecForge?

**ZecForge is NOT another cryptocurrency wallet or a generic payment gateway.**

Instead, it is an **integration workbench and developer tool** designed to help merchants, Web3 developers, and payment processors rigorously test, validate, and understand shielded Zcash checkout integrations before touching mainnet funds.

Integrating shielded Zcash payments into e-commerce applications requires solving specific cryptographic and consensus challenges:
1. **The Settlement Boundary Rule:** A wallet broadcast (`txid`) does **not** equal confirmed merchant receipt. Note decryption must occur independently via an incoming viewing key scanner on the merchant's backend.
2. **ZIP-321 Invariants:** Parsing and URI generation must adhere to strict decimal limits (max 8 decimals), unpadded base64url memo encodings, and network address validation. Memos are strictly forbidden on transparent addresses.
3. **Edge Case Reconciliation:** Real-world checkouts encounter underpayments, overpayments, late arrivals, missing invoice memos, and chain reorganizations.
4. **Deterministic Webhook Verification:** Merchant backends must safely authenticate HMAC status updates without accepting replayed or forged events.

ZecForge provides a deterministic, interactive environment to test every stage of this pipeline.

---

## Intended Users

- **Web3 & Full-Stack Developers:** Building e-commerce checkout plugins, donation widgets, or custom merchant payment processors for Zcash.
- **E-Commerce Merchants:** Testing wallet handoffs and understanding the confirmation lifecycle before accepting real ZEC.
- **Payment Gateway Integrators:** Auditing ZIP-316/ZIP-321 compliance and testing edge-case payment scenarios (underpayments, reorgs).

---

## Implementation Status

| Module | Standard / Protocol | Status | Description |
|---|---|:---:|---|
| **Workbench Dashboard & Shell** | Fintech Design System | ✅ Implemented | Deep navy fintech theme, responsive sidebar, simulated testnet block counter, scanner status. |
| **Receiving Address Validator** | ZIP-316, ZIP-32, Transparent | ✅ Implemented | Preliminary format check for Unified (`u1`/`utest1`), Sapling (`zs1`/`ztestsapling1`), and Transparent (`t1`/`tm`). Network mismatch detection. |
| **Payment Request Builder** | ZIP-321 (Zucchini 0.5.2 Subset) | ✅ Implemented | Canonical URI generation, 8-decimal limit, unpadded base64url memo encoder, QR code rendering, transparent memo rejection. |
| **Multi-Wallet Compatibility Sandbox** | Zucchini (SDK) & Zodl (QR / Deep Link) | ✅ Implemented | Browser wallet (Zucchini Dapp SDK) EIP-1193 discovery & dispatch, plus mobile air-gapped wallet (Zodl / Zashi) ZIP-321 QR generation, mobile deep-links, and 5-point manual audit recording. |
| **Edge Case Scenario Simulator** | Fail-Closed Reconciliation | ✅ Implemented | Deterministic 8-state offline reconciliation engine simulating exact integer zatoshis, `underpaid`, `overpaid`, `late_payment`, and `reorg_review` with structured audit logging. |
| **HMAC Webhook Dispatcher** | HMAC-SHA256 Webhooks | ⏳ In Roadmap | Simulated event signing (`signReceiptWebhook`) and backend payload verification. |
| **Integration Audit Report** | Merchant Compliance Export | ⏳ In Roadmap | Exportable markdown and JSON audit report for merchant readiness. |

---

## Core Engineering & Security Invariants

- **Zero Key Ingestion:** ZecForge never collects, stores, or handles private spending keys or seed phrases.
- **Fail-Closed Verification:** No payment is marked confirmed based solely on browser wallet assertions or third-party block explorer APIs.
- **Strict Network Boundary:** Designed and isolated for Zcash Testnet.
- **Format Validation Tier:** Preliminary format checks verify prefix and charset rules. As required by protocol safety rules, ZecForge explicitly informs users that full cryptographic validity requires node/scanner verification.
- **No Pseudo-Cryptography:** Uses standard, documented protocols (ZIP 316, ZIP 321) and the `@zucchinifi/dapp-sdk` 0.2.0 integration contracts.

---

## Architecture Overview

```
[Customer Browser / Checkout]
       │ (1) ZIP-321 Payment Request (Unsigned / Memo-bound)
       ▼
[Zucchini Wallet / Standards-compliant Wallet]
       │ (2) User Reviews Recipient & Memo, Signs & Broadcasts
       ▼
[Zcash Testnet Network] (Halo 2 / Orchard Pool)
       │
       ▼ (3) Compact Block Scanning & Note Decryption
[Merchant Viewing-Only Scanner] (Backend Isolated)
       │ (4) Accumulate 10 Confirmations (`canFulfill: true`)
       ▼
[Merchant Backend Listener] ── HMAC-SHA256 Webhook Verification ── Order Fulfilled
```

---

## Edge Case Scenario Simulator (`/scenarios`)

Real-world e-commerce integrations inevitably face reconciliation anomalies. ZecForge implements a deterministic, offline 8-state finite state machine with strict precedence rules:

- **States:** `awaiting_payment` → `detected` (0 confs) → `confirming` (1 to N-1 confs) → `paid` (≥ N confs).
- **Exceptions (Fail-Closed):**
  - `underpaid`: Received amount is strictly less than invoice requested amount. Order fulfillment is blocked (`canFulfill: false`). Accumulating confirmations will **never** silently transition an underpayment to `paid`.
  - `overpaid`: Received amount exceeds invoice requested amount. Marked for manual merchant reconciliation / refund.
  - `late_payment`: Payment detected or received after the merchant invoice expiration timestamp.
  - `reorg_review`: A blockchain reorganization dropped confirmed depth below policy threshold or replaced the block.
- **Configurable Confirmation Threshold:** Default 10 confirmations demonstrates a deep reorg-resistance policy (a merchant business policy, not a Zcash protocol rule).
- **Exact Decimal / Integer Zatoshi Arithmetic:** All calculations use exact integer zatoshis (`BigInt` scaling: 1 ZEC = 100,000,000 zatoshis), eliminating floating-point rounding errors.
- **Structured Audit Trail:** Every event logs previous state, new state, event type, timestamp, confirmation count, and transition reason.
- **Simulation Boundary:** Purely offline simulation for developer testing. Does not connect to live nodes or produce real transactions.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5 (Strict Mode, Target: ES2022)
- **Styling:** Tailwind CSS (Deep navy `#080C14`, elevated surfaces `#0F1626` / `#151F36`, violet `#7C3AED`, emerald `#10B981`)
- **Icons:** Lucide React (featuring `Anvil` wordmark icon)
- **Validation:** Zod
- **QR Generation:** `qrcode`
- **Zcash Integration:** `@zucchinifi/dapp-sdk` 0.2.0
- **Testing:** Vitest & Playwright

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

### Building for Production

```bash
npm run build
npm run start
```

---

## License

MIT © 2026 ZecForge Contributors
