import { z } from "zod";

export type ZcashNetwork = "mainnet" | "testnet";
export type ZcashAddressType = "unified" | "sapling" | "transparent" | "sprout" | "unknown";

export interface AddressInspection {
  raw: string;
  trimmed: string;
  hasWhitespace: boolean;
  isValidFormat: boolean;
  addressType: ZcashAddressType;
  detectedNetwork: ZcashNetwork | "unknown";
  networkMatch: boolean;
  isShielded: boolean;
  verificationTier: "preliminary_format_only";
  warnings: string[];
  errors: string[];
}

// Bech32 / Bech32m characters (lowercase alphanumeric except 1, b, i, o)
const BECH32_CHARSET_REGEX = /^[02-9ac-hj-np-z]+$/;
// Base58 characters (alphanumeric except 0, O, I, l)
const BASE58_CHARSET_REGEX = /^[1-9A-HJ-NP-Za-km-z]+$/;

/**
 * Inspects a Zcash address candidate and evaluates structural conformity
 * against ZIP-316 (Unified Addresses), Sapling (Protocol Spec §5.6.3.1), and Transparent formats.
 *
 * NOTE: This is a preliminary format & prefix check. As required by protocol
 * safety rules, this does NOT perform curve point validation or full Bech32m
 * polynomial checksum verification (which requires native Zcash cryptography).
 */
export function inspectAddress(input: string, expectedNetwork: ZcashNetwork = "testnet"): AddressInspection {
  const trimmed = input.trim();
  const hasWhitespace = input !== trimmed || /\s/.test(input);

  const inspection: AddressInspection = {
    raw: input,
    trimmed,
    hasWhitespace,
    isValidFormat: false,
    addressType: "unknown",
    detectedNetwork: "unknown",
    networkMatch: false,
    isShielded: false,
    verificationTier: "preliminary_format_only",
    warnings: [],
    errors: [],
  };

  if (!input || input.length === 0) {
    inspection.errors.push("Address cannot be empty.");
    return inspection;
  }

  if (hasWhitespace) {
    inspection.warnings.push("Input contains leading, trailing, or internal whitespace that was trimmed.");
  }

  if (trimmed.length < 30) {
    inspection.errors.push("Address is too short to be a valid Zcash address.");
    return inspection;
  }

  // 1. Unified Addresses (ZIP 316)
  // Mainnet prefix: u1, Testnet prefix: utest1
  if (trimmed.startsWith("utest1")) {
    inspection.addressType = "unified";
    inspection.detectedNetwork = "testnet";
    const dataPart = trimmed.slice("utest1".length);
    if (dataPart.length > 0 && BECH32_CHARSET_REGEX.test(dataPart)) {
      inspection.isValidFormat = true;
      inspection.isShielded = true;
    } else {
      inspection.errors.push("Invalid Bech32m characters in Unified Testnet address.");
    }
  } else if (trimmed.startsWith("u1")) {
    inspection.addressType = "unified";
    inspection.detectedNetwork = "mainnet";
    const dataPart = trimmed.slice("u1".length);
    if (dataPart.length > 0 && BECH32_CHARSET_REGEX.test(dataPart)) {
      inspection.isValidFormat = true;
      inspection.isShielded = true;
    } else {
      inspection.errors.push("Invalid Bech32m characters in Unified Mainnet address.");
    }
  }

  // 2. Sapling Addresses (ZIP 32)
  // Mainnet prefix: zs1 (78 chars total), Testnet prefix: ztestsapling1 (88 chars total)
  else if (trimmed.startsWith("ztestsapling1")) {
    inspection.addressType = "sapling";
    inspection.detectedNetwork = "testnet";
    const dataPart = trimmed.slice("ztestsapling1".length);
    if (trimmed.length === 88 && BECH32_CHARSET_REGEX.test(dataPart)) {
      inspection.isValidFormat = true;
      inspection.isShielded = true;
    } else {
      inspection.errors.push(`Invalid Sapling testnet address structure (expected 88 chars Bech32, got ${trimmed.length}).`);
    }
  } else if (trimmed.startsWith("zs1")) {
    inspection.addressType = "sapling";
    inspection.detectedNetwork = "mainnet";
    const dataPart = trimmed.slice("zs1".length);
    if (trimmed.length === 78 && BECH32_CHARSET_REGEX.test(dataPart)) {
      inspection.isValidFormat = true;
      inspection.isShielded = true;
    } else {
      inspection.errors.push(`Invalid Sapling mainnet address structure (expected 78 chars Bech32, got ${trimmed.length}).`);
    }
  }

  // 3. Transparent Addresses (Base58Check)
  // Mainnet: t1 (P2PKH, 35 chars), t3 (P2SH, 35 chars)
  // Testnet: tm (P2PKH, 35 chars), t2 (P2SH, 35 chars)
  else if (trimmed.startsWith("tm") || trimmed.startsWith("t2")) {
    inspection.addressType = "transparent";
    inspection.detectedNetwork = "testnet";
    if (trimmed.length === 35 && BASE58_CHARSET_REGEX.test(trimmed)) {
      inspection.isValidFormat = true;
      inspection.isShielded = false;
      inspection.warnings.push("Transparent address (unshielded): transactions will expose public balances and cannot receive ZIP-321 memos.");
    } else {
      inspection.errors.push(`Invalid Transparent testnet address format (expected 35 Base58 characters, got ${trimmed.length}).`);
    }
  } else if (trimmed.startsWith("t1") || trimmed.startsWith("t3")) {
    inspection.addressType = "transparent";
    inspection.detectedNetwork = "mainnet";
    if (trimmed.length === 35 && BASE58_CHARSET_REGEX.test(trimmed)) {
      inspection.isValidFormat = true;
      inspection.isShielded = false;
      inspection.warnings.push("Transparent address (unshielded): transactions will expose public balances and cannot receive ZIP-321 memos.");
    } else {
      inspection.errors.push(`Invalid Transparent mainnet address format (expected 35 Base58 characters, got ${trimmed.length}).`);
    }
  }

  // 4. Legacy Sprout Addresses
  else if (trimmed.startsWith("zt")) {
    inspection.addressType = "sprout";
    inspection.detectedNetwork = "testnet";
    if (trimmed.length === 95 && BASE58_CHARSET_REGEX.test(trimmed)) {
      inspection.isValidFormat = true;
      inspection.isShielded = true;
      inspection.warnings.push("Legacy Sprout address: Sprout pool is deprecated in modern Zcash workflows.");
    } else {
      inspection.errors.push("Invalid Sprout testnet address format.");
    }
  } else if (trimmed.startsWith("zc")) {
    inspection.addressType = "sprout";
    inspection.detectedNetwork = "mainnet";
    if (trimmed.length === 95 && BASE58_CHARSET_REGEX.test(trimmed)) {
      inspection.isValidFormat = true;
      inspection.isShielded = true;
      inspection.warnings.push("Legacy Sprout address: Sprout pool is deprecated in modern Zcash workflows.");
    } else {
      inspection.errors.push("Invalid Sprout mainnet address format.");
    }
  } else {
    inspection.errors.push("Unrecognized address prefix. Must start with u1, utest1, zs1, ztestsapling1, t1, t3, tm, or t2.");
  }

  // Network compatibility check
  if (inspection.detectedNetwork !== "unknown") {
    inspection.networkMatch = inspection.detectedNetwork === expectedNetwork;
    if (!inspection.networkMatch) {
      inspection.errors.push(`Network mismatch: Address is formatted for ${inspection.detectedNetwork}, but expected network is ${expectedNetwork}.`);
    }
  }

  return inspection;
}

/**
 * Zod schema to validate a Zcash address for a given target network.
 */
export function createAddressSchema(expectedNetwork: ZcashNetwork = "testnet") {
  return z
    .string()
    .min(1, "Address is required")
    .transform((val) => val.trim())
    .refine(
      (val) => {
        const res = inspectAddress(val, expectedNetwork);
        return res.isValidFormat && res.networkMatch;
      },
      (val) => {
        const res = inspectAddress(val, expectedNetwork);
        return {
          message: res.errors[0] || `Invalid address for ${expectedNetwork}`,
        };
      }
    );
}

