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
    "zs1000000000000000000000000000000000000000000000000000000000000000000000000000",
  // Valid-looking Transparent testnet address (P2PKH, 35 chars)
  VALID_TRANSPARENT_TESTNET: "tm9iMLAuYMzJ6kWYEqQCzNhpW9gSnhmXv2X",
  // Valid-looking Transparent testnet P2SH address (35 chars)
  VALID_TRANSPARENT_TESTNET_P2SH: "t26ovBdBWrFFpuzBUtT5DUhE9pG5y3T431e",
  // Valid-looking Transparent mainnet address (P2PKH, 35 chars)
  VALID_TRANSPARENT_MAINNET: "t1VpYagocmrPfBqLdwwkDej8sJ1zL84gQeY",
  // Valid-looking Transparent mainnet P2SH address (35 chars)
  VALID_TRANSPARENT_MAINNET_P2SH: "t3VzFdEkTBggbikQaYQcvpsPGjoqx7GQSem",
};

describe("Receiving Address Validator (ZIP-316 / ZIP-32 / Transparent)", () => {
  it("rejects empty and whitespace-only addresses", () => {
    const emptyRes = inspectAddress("");
    expect(emptyRes.isValidFormat).toBe(false);
    expect(emptyRes.classification).toBe("empty");
    expect(emptyRes.errors).toContain("Address cannot be empty.");

    const spaceRes = inspectAddress("   ");
    expect(spaceRes.isValidFormat).toBe(false);
    expect(spaceRes.classification).toBe("empty");
    expect(spaceRes.errors[0]).toBeDefined();
  });

  it("detects and trims leading/trailing whitespace", () => {
    const res = inspectAddress(`  ${FIXTURES.VALID_UNIFIED_TESTNET}  `, "testnet");
    expect(res.isValidFormat).toBe(true);
    expect(res.classification).toBe("valid_testnet");
    expect(res.hasWhitespace).toBe(true);
    expect(res.trimmed).toBe(FIXTURES.VALID_UNIFIED_TESTNET);
    expect(res.warnings).toContain("Input contains leading, trailing, or internal whitespace that was trimmed.");
  });

  it("inspects Unified Testnet addresses correctly", () => {
    const res = inspectAddress(FIXTURES.VALID_UNIFIED_TESTNET, "testnet");
    expect(res.isValidFormat).toBe(true);
    expect(res.classification).toBe("valid_testnet");
    expect(res.addressType).toBe("unified");
    expect(res.detectedNetwork).toBe("testnet");
    expect(res.networkMatch).toBe(true);
    expect(res.isShielded).toBe(true);
    expect(res.verificationTier).toBe("preliminary_format_only");
  });

  it("detects network mismatch when Testnet address is passed with Mainnet expected", () => {
    const res = inspectAddress(FIXTURES.VALID_UNIFIED_TESTNET, "mainnet");
    expect(res.isValidFormat).toBe(true);
    expect(res.classification).toBe("valid_testnet");
    expect(res.detectedNetwork).toBe("testnet");
    expect(res.networkMatch).toBe(false);
    expect(res.errors[0]).toContain("Network mismatch: Address is formatted for testnet");
  });

  it("inspects Sapling Testnet addresses correctly", () => {
    const res = inspectAddress(FIXTURES.VALID_SAPLING_TESTNET, "testnet");
    expect(res.isValidFormat).toBe(true);
    expect(res.classification).toBe("valid_testnet");
    expect(res.addressType).toBe("sapling");
    expect(res.detectedNetwork).toBe("testnet");
    expect(res.isShielded).toBe(true);
  });

  it("rejects malformed Sapling address length", () => {
    // Sapling testnet should be 88 chars; provide 50 chars
    const shortSapling = "ztestsapling1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq";
    const res = inspectAddress(shortSapling, "testnet");
    expect(res.isValidFormat).toBe(false);
    expect(res.classification).toBe("invalid_structure");
    expect(res.errors[0]).toContain("Invalid Sapling testnet address structure");
  });

  it("inspects Transparent addresses and marks unshielded warning", () => {
    const res = inspectAddress(FIXTURES.VALID_TRANSPARENT_TESTNET, "testnet");
    expect(res.isValidFormat).toBe(true);
    expect(res.classification).toBe("valid_testnet");
    expect(res.addressType).toBe("transparent");
    expect(res.detectedNetwork).toBe("testnet");
    expect(res.isShielded).toBe(false);
    expect(res.warnings[0]).toContain("Transparent address (unshielded)");
  });

  it("rejects unknown prefixes", () => {
    const res = inspectAddress("0x742d35Cc6634C0532925a3b844Bc454e4438f44e", "testnet");
    expect(res.isValidFormat).toBe(false);
    expect(res.classification).toBe("unsupported_prefix");
    expect(res.addressType).toBe("unknown");
    expect(res.errors[0]).toContain("Unrecognized address prefix");
  });

  it("rejects invalid characters in Bech32 / Base58 addresses", () => {
    // Bech32 excludes '1', 'b', 'i', 'o' in data part
    const invalidCharUnified = "utest1" + "b".repeat(60);
    const res = inspectAddress(invalidCharUnified, "testnet");
    expect(res.isValidFormat).toBe(false);
    expect(res.classification).toBe("invalid_structure");
    expect(res.errors[0]).toContain("Invalid Bech32m characters");
  });

  describe("Distinction between Valid Testnet, Valid Mainnet, and Invalid/Unsupported addresses", () => {
    it("identifies valid Mainnet Unified address and reports network mismatch for Testnet workbench", () => {
      const res = inspectAddress(FIXTURES.VALID_UNIFIED_MAINNET, "testnet");
      expect(res.isValidFormat).toBe(true);
      expect(res.classification).toBe("valid_mainnet");
      expect(res.detectedNetwork).toBe("mainnet");
      expect(res.networkMatch).toBe(false);
      expect(res.errors[0]).toContain("Network mismatch: Address is formatted for mainnet");
    });

    it("identifies valid Mainnet Sapling address and reports network mismatch for Testnet workbench", () => {
      const res = inspectAddress(FIXTURES.VALID_SAPLING_MAINNET, "testnet");
      expect(res.isValidFormat).toBe(true);
      expect(res.classification).toBe("valid_mainnet");
      expect(res.detectedNetwork).toBe("mainnet");
      expect(res.networkMatch).toBe(false);
      expect(res.errors[0]).toContain("Network mismatch: Address is formatted for mainnet");
    });

    it("identifies valid Mainnet Transparent address (t1 and t3) with network mismatch", () => {
      const resP2PKH = inspectAddress(FIXTURES.VALID_TRANSPARENT_MAINNET, "testnet");
      expect(resP2PKH.isValidFormat).toBe(true);
      expect(resP2PKH.classification).toBe("valid_mainnet");
      expect(resP2PKH.networkMatch).toBe(false);

      const resP2SH = inspectAddress(FIXTURES.VALID_TRANSPARENT_MAINNET_P2SH, "testnet");
      expect(resP2SH.isValidFormat).toBe(true);
      expect(resP2SH.classification).toBe("valid_mainnet");
      expect(resP2SH.networkMatch).toBe(false);
    });

    it("identifies valid Testnet Transparent address (tm and t2) as valid for Testnet", () => {
      const resP2PKH = inspectAddress(FIXTURES.VALID_TRANSPARENT_TESTNET, "testnet");
      expect(resP2PKH.isValidFormat).toBe(true);
      expect(resP2PKH.classification).toBe("valid_testnet");
      expect(resP2PKH.networkMatch).toBe(true);

      const resP2SH = inspectAddress(FIXTURES.VALID_TRANSPARENT_TESTNET_P2SH, "testnet");
      expect(resP2SH.isValidFormat).toBe(true);
      expect(resP2SH.classification).toBe("valid_testnet");
      expect(resP2SH.networkMatch).toBe(true);
    });

    it("does NOT classify malformed testnet addresses as mainnet", () => {
      // Malformed Sapling testnet (too short)
      const malformedSapling = "ztestsapling1shortshortshort";
      const res = inspectAddress(malformedSapling, "testnet");
      expect(res.isValidFormat).toBe(false);
      expect(res.classification).toBe("invalid_structure");
      expect(res.detectedNetwork).toBe("testnet");
      // Must NOT report a network mismatch!
      expect(res.errors.some((e) => e.includes("Network mismatch"))).toBe(false);
      expect(res.errors[0]).toContain("Invalid Sapling testnet address structure");
    });

    it("does NOT classify malformed transparent addresses as mainnet", () => {
      // Transparent testnet prefix 'tm' but only 20 chars
      const shortTm = "tm9iMLAuYMzJ6kWYEqQC";
      const res = inspectAddress(shortTm, "testnet");
      expect(res.isValidFormat).toBe(false);
      expect(res.classification).toBe("invalid_structure");
      // Must NOT claim network mismatch!
      expect(res.errors.some((e) => e.includes("Network mismatch"))).toBe(false);
      expect(res.errors[0]).toContain("Invalid Transparent testnet address format");
    });

    it("does NOT classify unsupported non-Zcash addresses as mainnet", () => {
      const nonZcashAddresses = [
        "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Ethereum
        "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", // Bitcoin Bech32
        "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",         // Bitcoin Legacy
        "addr1qxy64d7kjjr",                            // Cardano
        "randomnonzcashaddressstring1234567890",       // Arbitrary text
      ];

      for (const addr of nonZcashAddresses) {
        const res = inspectAddress(addr, "testnet");
        expect(res.isValidFormat).toBe(false);
        expect(res.classification).toBe("unsupported_prefix");
        expect(res.detectedNetwork).toBe("unknown");
        expect(res.networkMatch).toBe(false);
        // Must NOT claim network mismatch with mainnet!
        expect(res.errors.some((e) => e.includes("Network mismatch"))).toBe(false);
        expect(res.errors[0]).toContain("Unrecognized address prefix");
      }
    });

    it("keeps verificationTier explicitly preliminary_format_only", () => {
      const res = inspectAddress(FIXTURES.VALID_UNIFIED_TESTNET, "testnet");
      expect(res.verificationTier).toBe("preliminary_format_only");
    });
  });
});
