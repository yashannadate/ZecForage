import { describe, it, expect } from "vitest";
import {
  generateIntegrationReport,
  reportToMarkdown,
  reportToJson,
} from "../src/lib/reports/generator";

describe("Phase 7: Integration Audit Report Generator & Exporter Tests", () => {
  // --------------------------------------------------------------------------
  // 1. Report Generation & Structural Validity
  // --------------------------------------------------------------------------
  describe("Report Generation & Structure", () => {
    it("generates a complete integration report with default inputs", () => {
      const report = generateIntegrationReport();

      expect(report).toBeDefined();
      expect(report.meta.title).toContain("ZecForge");
      expect(report.meta.version).toBe("0.1.0");
      expect(report.meta.generatedAt).toBeGreaterThan(0);
      expect(report.meta.environment).toContain("Testnet");

      // Verify all sections exist
      expect(report.overall).toBeDefined();
      expect(report.addressValidation).toBeDefined();
      expect(report.zip321).toBeDefined();
      expect(report.walletCompatibility.zucchini).toBeDefined();
      expect(report.walletCompatibility.zodl).toBeDefined();
      expect(report.paymentScenario).toBeDefined();
      expect(report.webhookSecurity).toBeDefined();
      expect(report.technicalLimitations.length).toBeGreaterThan(0);
      expect(report.productionReadinessChecklist.length).toBeGreaterThan(0);
    });

    it("accepts custom or partial inputs gracefully", () => {
      const report = generateIntegrationReport({
        addressTested: "tm9iMLAuYMzJ6kWYEqQCzNhpW9gSnhmXv2X",
        expectedNetwork: "testnet",
        zodlTestRun: {
          result: "passed",
          checklist: {
            scannedSuccessfully: true,
            addressMatched: true,
            amountMatched: true,
            memoDecoded: true,
            feeCalculated: true,
          },
        },
      });

      expect(report.addressValidation.detectedType).toBe("transparent");
      expect(report.walletCompatibility.zodl.status).toBe("PASS");
      expect(report.walletCompatibility.zodl.checklistStatus.scannedSuccessfully).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Classifications & Verification Tiers
  // --------------------------------------------------------------------------
  describe("Readiness Classifications & Verification Tiers", () => {
    it("marks overall status as WARNING and productionReady as false", () => {
      const report = generateIntegrationReport();

      // In pre-production without live viewing-key scanner, overall status MUST be WARNING, never PASS
      expect(report.overall.overallStatus).toBe("WARNING");
      expect(report.overall.productionReady).toBe(false);
      expect(report.overall.tierBreakdown.onChainVerification).toBe("NOT_VERIFIED");
    });

    it("distinguishes automated tests, simulated workflows, and manual device checks", () => {
      const report = generateIntegrationReport();

      expect(report.addressValidation.tier).toBe("automated_unit_test");
      expect(report.zip321.tier).toBe("automated_unit_test");
      expect(report.walletCompatibility.zucchini.tier).toBe("simulated");
      expect(report.paymentScenario.tier).toBe("simulated");
      expect(report.walletCompatibility.zodl.tier).toBe("manual_device_verified");
      expect(report.overall.tierBreakdown.onChainVerification).toBe("NOT_VERIFIED");
    });

    it("explicitly confirms that Zodl does not support browser injection", () => {
      const report = generateIntegrationReport();
      expect(report.walletCompatibility.zodl.supportsBrowserInjection).toBe(false);
      expect(report.walletCompatibility.zodl.supportsDeepLink).toBe(true);
    });

    it("documents limitations of preliminary address validation", () => {
      const report = generateIntegrationReport();
      expect(report.addressValidation.limitations.length).toBeGreaterThan(0);
      expect(report.addressValidation.limitations[0]).toContain("preliminary format checks");
    });
  });

  // --------------------------------------------------------------------------
  // 3. Export Formatting (Markdown & JSON)
  // --------------------------------------------------------------------------
  describe("Report Export Formatting", () => {
    it("generates valid, formatted JSON export", () => {
      const report = generateIntegrationReport();
      const json = reportToJson(report);

      expect(typeof json).toBe("string");
      const parsed = JSON.parse(json);
      expect(parsed.meta.title).toBe(report.meta.title);
      expect(parsed.overall.overallStatus).toBe("WARNING");
      expect(parsed.productionReadinessChecklist.length).toBe(report.productionReadinessChecklist.length);
    });

    it("generates standard Markdown report with headers and tables", () => {
      const report = generateIntegrationReport();
      const md = reportToMarkdown(report);

      expect(md).toContain("# ZecForge Merchant Integration Audit Report");
      expect(md).toContain("**Overall Readiness Classification:** **WARNING**");
      expect(md).toContain("Pre-Production Notice");
      expect(md).toContain("Receiving Address Validation Audit");
      expect(md).toContain("ZIP-321 Payment Request Audit");
      expect(md).toContain("Wallet Compatibility Audit");
      expect(md).toContain("Payment Scenario Engine Audit");
      expect(md).toContain("HMAC-SHA256 Webhook Security Audit");
      expect(md).toContain("Production Readiness Checklist");
      expect(md).toContain("NOT VERIFIED");
    });
  });

  // --------------------------------------------------------------------------
  // 4. Secret & Sensitive Data Exclusion
  // --------------------------------------------------------------------------
  describe("Secret and Sensitive Data Exclusion", () => {
    it("never includes private keys, viewing keys, or webhook secrets in exports", () => {
      const report = generateIntegrationReport();
      const json = reportToJson(report);
      const md = reportToMarkdown(report);

      expect(report.webhookSecurity.secretExposed).toBe(false);

      // Verify no sensitive keys or environment placeholders are dumped
      expect(json).not.toContain("SECRET");
      expect(json).not.toContain("secret_");
      expect(json).not.toContain("spending_key");
      expect(json).not.toContain("private_key");
      expect(json).not.toContain("viewing_key_hex");

      expect(md).not.toContain("SECRET=");
      expect(md).not.toContain("spending_key");
      expect(md).not.toContain("viewing_key_hex");
    });
  });
});
