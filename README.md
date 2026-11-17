# ZecPayKit

> **Shielded Zcash Merchant Payment Integration Testbench**  
> Built for the **Zcash India Build on Zcash Bounty** (November 2026).  
> MIT Licensed.

---

## What is ZecPayKit?

**ZecPayKit is NOT another Zcash wallet or generic payment gateway.**

Instead, it is an **integration testbench and developer tool** designed to help merchants, Web3 developers, and payment processors rigorously test, validate, and understand shielded Zcash checkout integrations before touching mainnet funds.

Integrating shielded Zcash payments into merchant e-commerce requires solving specific cryptographic and consensus challenges:
1. **The Settlement Boundary Rule:** A wallet broadcast (`txid`) does **not** equal confirmed merchant receipt. Note decryption must occur independently via an incoming viewing key scanner.
2. **ZIP-321 Invariants:** Parsing and URI generation must adhere to strict decimal limits, memo encodings, and network address validation.
3. **Edge Case Reconciliation:** Real-world checkouts encounter underpayments, overpayments, late arrivals, missing invoice memos, and chain reorganizations.
4. **Deterministic Webhook Verification:** Merchant backends must safely authenticate HMAC status updates without accepting replayed or forged events.

ZecPayKit provides a deterministic, interactive environment to test every stage of this pipeline.

---

## Core Engineering Rules

- **Zero Key Ingestion:** ZecPayKit never collects, stores, or handles private spending keys or seed phrases.
- **Fail-Closed Verification:** No payment is marked confirmed based solely on browser wallet assertions or third-party block explorer APIs.
- **Strict Network Boundary:** Designed and isolated for Zcash Testnet.
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

## Getting Started

### Prerequisites

- Node.js `>= 22` (tested on Node v24.12.0)
- npm or pnpm

### Installation

```bash
git clone https://github.com/your-username/zecpaykit.git
cd zecpaykit
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm run start
```

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling:** Tailwind CSS (Deep navy fintech theme)
- **Icons:** Lucide React
- **Validation:** Zod
- **Zcash Integration:** `@zucchinifi/dapp-sdk` 0.2.0
- **Testing:** Vitest & Playwright

---

## License

MIT © 2026 ZecPayKit Contributors
