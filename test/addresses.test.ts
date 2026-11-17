import { describe, it, expect } from "vitest";
import { inspectAddress } from "../src/lib/zcash/addresses";

// Test fixtures labeled with their structural type and network
const FIXTURES = {
  // Valid-looking Unified testnet address (ZIP-316)
  VALID_UNIFIED_TESTNET:
    "utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  // Valid-looking Unified mainnet address (ZIP-316)
  VALID_UNIFIED_MAINNET:
    "u1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
  // Valid-looking Sapling testnet address (88 chars, ZIP-32)
  VALID_SAPLING_TESTNET:
    "ztestsapling1000000000000000000000000000000000000000000000000000000000000000000000000000",
  // Valid-looking Sapling mainnet address (78 chars, ZIP-32)
  VALID_SAPLING_MAINNET:
    "zs10000000000000000000000000000000000000000000000000000000000000000000000000",
  // Valid-looking Transparent testnet address (P2PKH, 35 chars)
  VALID_TRANSPARENT_TESTNET: "tm9iMLAuYMzJ6kWYEqQCzNhpW9gSnhmXv2X",
  // Valid-looking Transparent mainnet address (P2PKH, 35 chars)
  VALID_TRANSPARENT_MAINNET: "t1VpYagocmrPfBqLdwwkDej8sJ1zL84gQeY",
};

describe("Receiving Address Validator (ZIP-316 / ZIP-32 / Transparent)", () => {
  it("rejects empty and whitespace-only addresses", () => {
    const emptyRes = inspectAddress("");
    expect(emptyRes.isValidFormat).toBe(false);
    expect(emptyRes.errors).toContain("Address cannot be empty.");

    const spaceRes = inspectAddress("   ");
    expect(spaceRes.isValidFormat).toBe(false);
    expect(spaceRes.errors[0]).toBeDefined();
  });

  it("detects and trims leading/trailing whitespace", () => {
    const res = inspectAddress(`  ${FIXTURES.VALID_UNIFIED_TESTNET}  `, "testnet");
    expect(res.isValidFormat).toBe(true);
    expect(res.hasWhitespace).toBe(true);
    expect(res.trimmed).toBe(FIXTURES.VALID_UNIFIED_TESTNET);
    expect(res.warnings).toContain("Input contains leading, trailing, or internal whitespace that was trimmed.");
  });

  it("inspects Unified Testnet addresses correctly", () => {
    const res = inspectAddress(FIXTURES.VALID_UNIFIED_TESTNET, "testnet");
    expect(res.isValidFormat).toBe(true);
    expect(res.addressType).toBe("unified");
    expect(res.detectedNetwork).toBe("testnet");
    expect(res.networkMatch).toBe(true);
    expect(res.isShielded).toBe(true);
  });

  it("detects network mismatch when Testnet address is passed with Mainnet expected", () => {
    const res = inspectAddress(FIXTURES.VALID_UNIFIED_TESTNET, "mainnet");
    expect(res.isValidFormat).toBe(true);
    expect(res.detectedNetwork).toBe("testnet");
    expect(res.networkMatch).toBe(false);
    expect(res.errors[0]).toContain("Network mismatch: Address is formatted for testnet, but expected network is mainnet.");
  });

  it("inspects Sapling Testnet addresses correctly", () => {
    const res = inspectAddress(FIXTURES.VALID_SAPLING_TESTNET, "testnet");
    expect(res.isValidFormat).toBe(true);
    expect(res.addressType).toBe("sapling");
    expect(res.detectedNetwork).toBe("testnet");
    expect(res.isShielded).toBe(true);
  });

  it("rejects malformed Sapling address length", () => {
    // Sapling testnet should be 88 chars; provide 50 chars
    const shortSapling = "ztestsapling1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
    const res = inspectAddress(shortSapling, "testnet");
    expect(res.isValidFormat).toBe(false);
    expect(res.errors[0]).toContain("Invalid Sapling testnet address structure");
  });

  it("inspects Transparent addresses and marks unshielded warning", () => {
    const res = inspectAddress(FIXTURES.VALID_TRANSPARENT_TESTNET, "testnet");
    expect(res.isValidFormat).toBe(true);
    expect(res.addressType).toBe("transparent");
    expect(res.detectedNetwork).toBe("testnet");
    expect(res.isShielded).toBe(false);
    expect(res.warnings[0]).toContain("Transparent address (unshielded)");
  });

  it("rejects unknown prefixes", () => {
    const res = inspectAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44e", "testnet");
    expect(res.isValidFormat).toBe(false);
    expect(res.addressType).toBe("unknown");
    expect(res.errors[0]).toContain("Unrecognized address prefix");
  });

  it("rejects invalid characters in Bech32 / Base58 addresses", () => {
    // Bech32 excludes '1', 'b', 'i', 'o' in data part
    const invalidCharUnified = "utest1" + "b".repeat(60);
    const res = inspectAddress(invalidCharUnified, "testnet");
    expect(res.isValidFormat).toBe(false);
    expect(res.errors[0]).toContain("Invalid Bech32m characters");
  });
});
