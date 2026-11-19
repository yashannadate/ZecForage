import { describe, it, expect } from "vitest";
import {
  ZODL_PROFILE,
  generateZodlPaymentRequest,
  createZodlTestRun,
} from "../src/lib/zcash/zodl";

const FIXTURES = {
  UNIFIED_TESTNET:
    "utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  UNIFIED_MAINNET:
    "u1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  SAPLING_MAINNET:
    "zs1" + "0".repeat(75),
  TRANSPARENT_TESTNET: "tm9iMLAuYMzJ6kWYEqQCzNhpW9gSnhmXv2X",
  TRANSPARENT_MAINNET: "t1VpYagocmrPfBqLdwwkDej8sJ1zL84gQeY",
};

describe("Zodl (formerly Zashi) Mobile Wallet Compatibility", () => {
  it("verifies the Zodl profile characteristics", () => {
    expect(ZODL_PROFILE.name).toBe("Zodl");
    expect(ZODL_PROFILE.formerName).toBe("Zashi");
    expect(ZODL_PROFILE.integrationType).toBe("air_gapped_qr_and_deeplink");
    expect(ZODL_PROFILE.supportsBrowserInjection).toBe(false);
    expect(ZODL_PROFILE.supportsDeepLink).toBe(true);
    expect(ZODL_PROFILE.maxMemoBytes).toBe(512);
    expect(ZODL_PROFILE.maxDecimalPlaces).toBe(8);
  });

  it("generates a valid ZIP-321 QR payload for Unified Testnet address with memo", () => {
    const res = generateZodlPaymentRequest({
      recipient: FIXTURES.UNIFIED_TESTNET,
      amount: "0.025",
      memo: "Zodl Testnet Checkout #55",
      network: "testnet",
    });

    expect(res.uri).toContain(`zcash:${FIXTURES.UNIFIED_TESTNET}?amount=0.025&memo=`);
    expect(res.deepLink).toBe(res.uri);
    expect(res.amountZatoshis).toBe("2500000");
    expect(res.parameterAudit.singleRecipient).toBe(true);
    expect(res.parameterAudit.memoCompliant).toBe(true);
    expect(res.warnings[0]).toContain("Testnet Request");
  });

  it("generates a valid ZIP-321 QR payload for Unified Mainnet address", () => {
    const res = generateZodlPaymentRequest({
      recipient: FIXTURES.UNIFIED_MAINNET,
      amount: "0.1",
      memo: "Production Order 99",
      network: "mainnet",
    });

    expect(res.uri).toContain(`zcash:${FIXTURES.UNIFIED_MAINNET}?amount=0.1&memo=`);
    expect(res.amountZatoshis).toBe("10000000");
    expect(res.network).toBe("mainnet");
    expect(res.warnings[0]).toContain("Mainnet Request");
  });

  it("generates a valid ZIP-321 QR payload for Sapling Mainnet address", () => {
    const res = generateZodlPaymentRequest({
      recipient: FIXTURES.SAPLING_MAINNET,
      amount: "0.05",
      network: "mainnet",
    });

    expect(res.uri).toBe(`zcash:${FIXTURES.SAPLING_MAINNET}?amount=0.05`);
    expect(res.amountZatoshis).toBe("5000000");
    expect(res.memoBase64Url).toBeUndefined();
  });

  it("strictly rejects memos on transparent addresses for Zodl", () => {
    expect(() =>
      generateZodlPaymentRequest({
        recipient: FIXTURES.TRANSPARENT_TESTNET,
        amount: "0.01",
        memo: "Should fail on transparent",
        network: "testnet",
      })
    ).toThrow("Memos are strictly rejected for transparent addresses");
  });

  it("rejects amounts exceeding 8 decimal places for Zodl", () => {
    expect(() =>
      generateZodlPaymentRequest({
        recipient: FIXTURES.UNIFIED_TESTNET,
        amount: "0.123456789",
        network: "testnet",
      })
    ).toThrow("at most 8 decimal places");
  });

  it("rejects memos exceeding 512 bytes for Zodl", () => {
    const oversizedMemo = "X".repeat(513);
    expect(() =>
      generateZodlPaymentRequest({
        recipient: FIXTURES.UNIFIED_TESTNET,
        amount: "0.01",
        memo: oversizedMemo,
        network: "testnet",
      })
    ).toThrow("Memo exceeds 512 bytes");
  });

  it("creates a structured audit record for a manual Zodl test run", () => {
    const run = createZodlTestRun({
      platform: "ios",
      network: "mainnet",
      uri: `zcash:${FIXTURES.UNIFIED_MAINNET}?amount=0.01`,
      checklist: {
        scannedSuccessfully: true,
        addressMatched: true,
        amountMatched: true,
        memoDecoded: true,
        feeCalculated: true,
      },
      result: "passed",
      observedTxid: "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b",
      notes: "Scanned instantly with Zodl iOS 1.2 on iPhone 15",
    });

    expect(run.id).toContain("zodl_run_");
    expect(run.platform).toBe("ios");
    expect(run.result).toBe("passed");
    expect(run.isManualRecord).toBe(true);
    expect(run.checklist.scannedSuccessfully).toBe(true);
    expect(run.observedTxid).toBe(
      "4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b"
    );
  });
});
