/**
 * ZecForge — Phase 8: Merchant Config Hub
 * Unit tests for settings types and helpers.
 */

import { describe, it, expect } from "vitest";
import {
  deriveConfirmationPolicy,
  CONFIRMATION_THRESHOLD_MIN,
  CONFIRMATION_THRESHOLD_MAX,
  CONFIRMATION_THRESHOLD_DEFAULT,
  RPC_PRESETS,
  WEBHOOK_TEMPLATES,
} from "../src/lib/settings/types";

// ---------------------------------------------------------------------------
// deriveConfirmationPolicy
// ---------------------------------------------------------------------------
describe("deriveConfirmationPolicy", () => {
  it("returns Very High risk for threshold 1", () => {
    const p = deriveConfirmationPolicy(1);
    expect(p.riskLabel).toBe("Very High");
    expect(p.riskColor).toBe("rose");
    expect(p.threshold).toBe(1);
  });

  it("returns High risk for threshold 2", () => {
    const p = deriveConfirmationPolicy(2);
    expect(p.riskLabel).toBe("High");
    expect(p.riskColor).toBe("amber");
  });

  it("returns Moderate risk for threshold 4", () => {
    const p = deriveConfirmationPolicy(4);
    expect(p.riskLabel).toBe("Moderate");
    expect(p.riskColor).toBe("amber");
  });

  it("returns Low risk for threshold 7", () => {
    const p = deriveConfirmationPolicy(7);
    expect(p.riskLabel).toBe("Low");
    expect(p.riskColor).toBe("emerald");
  });

  it("returns Very Low risk for threshold 10 (default)", () => {
    const p = deriveConfirmationPolicy(10);
    expect(p.riskLabel).toBe("Very Low");
    expect(p.riskColor).toBe("emerald");
  });

  it("returns Very Low risk for threshold 50 (max)", () => {
    const p = deriveConfirmationPolicy(50);
    expect(p.riskLabel).toBe("Very Low");
    expect(p.riskColor).toBe("emerald");
  });

  it("computes estimatedMinutes correctly for threshold 10", () => {
    // 10 blocks × 75s = 750s = 12.5 min → rounds to 13
    const p = deriveConfirmationPolicy(10);
    expect(p.estimatedMinutes).toBe(13);
  });

  it("computes estimatedMinutes correctly for threshold 1", () => {
    // 1 block × 75s = 75s = 1.25 min → rounds to 1
    const p = deriveConfirmationPolicy(1);
    expect(p.estimatedMinutes).toBe(1);
  });

  it("computes estimatedMinutes correctly for threshold 20", () => {
    // 20 × 75 = 1500s = 25 min
    const p = deriveConfirmationPolicy(20);
    expect(p.estimatedMinutes).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// Threshold constants
// ---------------------------------------------------------------------------
describe("confirmation threshold constants", () => {
  it("MIN is 1", () => expect(CONFIRMATION_THRESHOLD_MIN).toBe(1));
  it("MAX is 50", () => expect(CONFIRMATION_THRESHOLD_MAX).toBe(50));
  it("DEFAULT is 10", () => expect(CONFIRMATION_THRESHOLD_DEFAULT).toBe(10));
  it("DEFAULT is within [MIN, MAX]", () => {
    expect(CONFIRMATION_THRESHOLD_DEFAULT).toBeGreaterThanOrEqual(CONFIRMATION_THRESHOLD_MIN);
    expect(CONFIRMATION_THRESHOLD_DEFAULT).toBeLessThanOrEqual(CONFIRMATION_THRESHOLD_MAX);
  });
});

// ---------------------------------------------------------------------------
// RPC_PRESETS
// ---------------------------------------------------------------------------
describe("RPC_PRESETS", () => {
  it("has at least 4 presets", () => expect(RPC_PRESETS.length).toBeGreaterThanOrEqual(4));

  it("every preset has required fields", () => {
    for (const p of RPC_PRESETS) {
      expect(typeof p.id).toBe("string");
      expect(typeof p.label).toBe("string");
      expect(typeof p.url).toBe("string");
      expect(typeof p.tls).toBe("boolean");
      expect(typeof p.note).toBe("string");
      expect(["testnet", "mainnet", "custom"]).toContain(p.network);
      expect(["official", "community", "custom"]).toContain(p.status);
    }
  });

  it("exactly one preset has id 'custom'", () => {
    const customs = RPC_PRESETS.filter((p) => p.id === "custom");
    expect(customs.length).toBe(1);
  });

  it("custom preset has empty url", () => {
    const custom = RPC_PRESETS.find((p) => p.id === "custom")!;
    expect(custom.url).toBe("");
    expect(custom.network).toBe("custom");
  });

  it("all non-custom presets have non-empty urls", () => {
    for (const p of RPC_PRESETS.filter((p) => p.id !== "custom")) {
      expect(p.url.length).toBeGreaterThan(0);
    }
  });

  it("includes at least one testnet preset", () => {
    expect(RPC_PRESETS.some((p) => p.network === "testnet")).toBe(true);
  });

  it("includes at least one mainnet preset", () => {
    expect(RPC_PRESETS.some((p) => p.network === "mainnet")).toBe(true);
  });

  it("all official presets use TLS", () => {
    for (const p of RPC_PRESETS.filter((p) => p.status === "official")) {
      expect(p.tls).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// WEBHOOK_TEMPLATES
// ---------------------------------------------------------------------------
describe("WEBHOOK_TEMPLATES", () => {
  it("has exactly 3 templates", () => expect(WEBHOOK_TEMPLATES.length).toBe(3));

  it("covers express, nextjs, fastapi", () => {
    const ids = WEBHOOK_TEMPLATES.map((t) => t.id);
    expect(ids).toContain("express");
    expect(ids).toContain("nextjs");
    expect(ids).toContain("fastapi");
  });

  it("every template has required fields", () => {
    for (const t of WEBHOOK_TEMPLATES) {
      expect(typeof t.id).toBe("string");
      expect(typeof t.label).toBe("string");
      expect(typeof t.filename).toBe("string");
      expect(typeof t.description).toBe("string");
      expect(typeof t.code).toBe("string");
      expect(t.code.length).toBeGreaterThan(0);
    }
  });

  it("all templates reference ZECFORGE_WEBHOOK_SECRET", () => {
    for (const t of WEBHOOK_TEMPLATES) {
      expect(t.code).toContain("ZECFORGE_WEBHOOK_SECRET");
    }
  });

  it("all templates use constant-time comparison", () => {
    const tsTemplates = WEBHOOK_TEMPLATES.filter((t) => t.language === "typescript");
    for (const t of tsTemplates) {
      expect(t.code).toContain("timingSafeEqual");
    }
    const pyTemplates = WEBHOOK_TEMPLATES.filter((t) => t.language === "python");
    for (const t of pyTemplates) {
      expect(t.code).toContain("compare_digest");
    }
  });

  it("all templates check timestamp before accepting", () => {
    for (const t of WEBHOOK_TEMPLATES) {
      // Should contain timestamp-related logic
      expect(t.code).toMatch(/timestamp|SIGNATURE_MAX_AGE/i);
    }
  });

  it("no template hardcodes a secret value", () => {
    for (const t of WEBHOOK_TEMPLATES) {
      // Should not contain any string that looks like a real secret
      expect(t.code).not.toMatch(/ZECFORGE_WEBHOOK_SECRET\s*=\s*["'][a-f0-9]{32,}/i);
    }
  });

  it("Express template produces .ts filename", () => {
    const e = WEBHOOK_TEMPLATES.find((t) => t.id === "express")!;
    expect(e.filename).toMatch(/\.ts$/);
  });

  it("Next.js template produces route.ts filename", () => {
    const n = WEBHOOK_TEMPLATES.find((t) => t.id === "nextjs")!;
    expect(n.filename).toBe("route.ts");
  });

  it("FastAPI template produces .py filename", () => {
    const f = WEBHOOK_TEMPLATES.find((t) => t.id === "fastapi")!;
    expect(f.filename).toMatch(/\.py$/);
  });
});
