import { describe, it, expect } from "vitest";
import {
  buildZip321Uri,
  parseZip321Uri,
  zecToZatoshis,
  encodeMemoToBase64Url,
  decodeBase64UrlMemo,
  utf8ToBytes,
} from "../src/lib/zcash/zip321";
import { parsePaymentUri } from "@zucchinifi/dapp-sdk/merchant";

const FIXTURES = {
  VALID_UNIFIED_TESTNET:
    "utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  VALID_SAPLING_TESTNET:
    "ztestsapling1000000000000000000000000000000000000000000000000000000000000000000000000000",
  VALID_TRANSPARENT_TESTNET: "tm9iMLAuYMzJ6kWYEqQCzNhpW9gSnhmXv2X",
};

describe("ZIP-321 Payment Request Builder & Parser (Zucchini 0.5.2 Subset)", () => {
  it("converts ZEC decimal strings to exact zatoshis", () => {
    expect(zecToZatoshis("1")).toBe(100_000_000n);
    expect(zecToZatoshis("0.001")).toBe(100_000n);
    expect(zecToZatoshis("0.00000001")).toBe(1n);
    expect(zecToZatoshis("2.50000000")).toBe(250_000_000n);
  });

  it("rejects amounts with more than 8 decimal places", () => {
    expect(() => zecToZatoshis("0.123456789")).toThrow("at most 8 decimal places");
  });

  it("rejects non-positive and malformed amounts", () => {
    expect(() => zecToZatoshis("0")).toThrow("Amount must be greater than 0");
    expect(() => zecToZatoshis("-1")).toThrow("Invalid ZEC amount format");
    expect(() => zecToZatoshis("abc")).toThrow("Invalid ZEC amount format");
    expect(() => zecToZatoshis("21000001")).toThrow("Amount exceeds maximum Zcash total supply");
  });

  it("encodes and decodes UTF-8 memos to RFC 4648 §5 unpadded base64url", () => {
    const text = "Invoice #9824 - Coffee & Croissant";
    const encoded = encodeMemoToBase64Url(text);
    // Unpadded base64url: no '+', '/', or '='
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");

    const decoded = decodeBase64UrlMemo(encoded);
    expect(decoded).toBe(text);
  });

  it("enforces 512-byte limit on memos", () => {
    // 512 ASCII bytes is valid
    const valid512 = "A".repeat(512);
    expect(() => encodeMemoToBase64Url(valid512)).not.toThrow();

    // 513 bytes throws
    const invalid513 = "A".repeat(513);
    expect(() => encodeMemoToBase64Url(invalid513)).toThrow("Memo exceeds 512 byte limit");

    // Multi-byte UTF-8 character length test (e.g. euro sign € is 3 bytes)
    const euroString = "€".repeat(171); // 171 * 3 = 513 bytes
    expect(utf8ToBytes(euroString).length).toBe(513);
    expect(() => encodeMemoToBase64Url(euroString)).toThrow("Memo exceeds 512 byte limit");
  });

  it("builds a canonical ZIP-321 URI for Unified Testnet address with memo", () => {
    const req = {
      recipient: FIXTURES.VALID_UNIFIED_TESTNET,
      amount: "0.05",
      memo: "Order 101",
      network: "testnet" as const,
    };
    const res = buildZip321Uri(req);
    expect(res.uri).toContain(`zcash:${FIXTURES.VALID_UNIFIED_TESTNET}?amount=0.05&memo=`);
    expect(res.amountZatoshis).toBe("5000000");
    expect(res.isTransparent).toBe(false);
  });

  it("strictly rejects memos for transparent addresses", () => {
    const req = {
      recipient: FIXTURES.VALID_TRANSPARENT_TESTNET,
      amount: "0.1",
      memo: "Test memo on transparent",
      network: "testnet" as const,
    };
    expect(() => buildZip321Uri(req)).toThrow(
      "Memos are strictly rejected for transparent addresses"
    );
  });

  it("allows transparent address when NO memo is provided", () => {
    const req = {
      recipient: FIXTURES.VALID_TRANSPARENT_TESTNET,
      amount: "0.1",
      network: "testnet" as const,
    };
    const res = buildZip321Uri(req);
    expect(res.uri).toBe(`zcash:${FIXTURES.VALID_TRANSPARENT_TESTNET}?amount=0.1`);
    expect(res.isTransparent).toBe(true);
    expect(res.warnings[0]).toContain("Unshielded payment");
  });

  it("parses generated URI and performs round-trip verification", () => {
    const original = {
      recipient: FIXTURES.VALID_UNIFIED_TESTNET,
      amount: "0.12345678",
      memo: "Roundtrip Test #1",
      network: "testnet" as const,
    };

    const generated = buildZip321Uri(original);
    const parsed = parseZip321Uri(generated.uri, "testnet");

    expect(parsed.recipient).toBe(original.recipient);
    expect(parsed.amount).toBe(original.amount);
    expect(parsed.memoText).toBe(original.memo);
    expect(parsed.amountZatoshis).toBe("12345678");
  });

  it("rejects multi-recipient or indexed parameters", () => {
    const indexedUri = `zcash:${FIXTURES.VALID_UNIFIED_TESTNET}?amount=0.1&address.1=tm9iMLAuYMzJ6kWYEqQCzNhpW9gSnhmXv2X&amount.1=0.2`;
    expect(() => parseZip321Uri(indexedUri, "testnet")).toThrow(
      "Unsupported ZIP-321 parameter"
    );
  });

  it("verifies compatibility with @zucchinifi/dapp-sdk/merchant parsePaymentUri", async () => {
    const req = {
      recipient: FIXTURES.VALID_UNIFIED_TESTNET,
      amount: "0.01",
      memo: "SDK Test Verification",
      network: "testnet" as const,
    };
    const { uri } = buildZip321Uri(req);

    // Mock validator function matching SDK contract
    const mockValidator = async (address: string, network: string) => ({
      valid: true,
      network,
      shielded: true,
    });

    const sdkParsed = await parsePaymentUri(uri, "testnet", mockValidator);
    expect(sdkParsed.address).toBe(FIXTURES.VALID_UNIFIED_TESTNET);
    expect(sdkParsed.amountZatoshis).toBe("1000000");
    expect(sdkParsed.memoBase64url).toBe(encodeMemoToBase64Url("SDK Test Verification"));
  });
});

