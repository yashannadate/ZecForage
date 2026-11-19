import { describe, it, expect } from "vitest";
import {
  createScenarioSession,
  transitionScenario,
} from "../src/lib/zcash/scenarios";

describe("Payment Edge Case Scenario Simulator (State Machine)", () => {
  it("initializes a session in awaiting_payment state with canFulfill: false", () => {
    const session = createScenarioSession({ expectedZEC: "0.05" });
    expect(session.currentState).toBe("awaiting_payment");
    expect(session.receivedZatoshis).toBe(BigInt(0));
    expect(session.confirmations).toBe(0);
    expect(session.canFulfill).toBe(false);
    expect(session.invoice.expectedZatoshis).toBe(5000000n);
    expect(session.auditTrail.length).toBe(1);
    expect(session.auditTrail[0].eventType).toBe("INVOICE_INITIALIZED");
  });

  it("transitions to detected on exact payment arrival at 0 confirmations", () => {
    let session = createScenarioSession({ expectedZEC: "0.05" });
    session = transitionScenario(session, {
      type: "PAYMENT_DETECTED",
      amountZEC: "0.05",
    });

    expect(session.currentState).toBe("detected");
    expect(session.confirmations).toBe(0);
    expect(session.canFulfill).toBe(false);
    expect(session.receivedZatoshis).toBe(5000000n);
    expect(session.simulatedTxid).toBeDefined();
  });

  it("transitions to confirming when confirmations advance between 1 and 9", () => {
    let session = createScenarioSession({ expectedZEC: "0.05" });
    session = transitionScenario(session, {
      type: "PAYMENT_DETECTED",
      amountZEC: "0.05",
    });

    session = transitionScenario(session, {
      type: "CONFIRMATIONS_ADVANCED",
      count: 4,
    });

    expect(session.currentState).toBe("confirming");
    expect(session.confirmations).toBe(4);
    expect(session.canFulfill).toBe(false);
  });

  it("transitions to paid and enables canFulfill: true when reaching 10 confirmations", () => {
    let session = createScenarioSession({
      expectedZEC: "0.05",
      requiredConfirmations: 10,
    });
    session = transitionScenario(session, {
      type: "PAYMENT_DETECTED",
      amountZEC: "0.05",
    });

    session = transitionScenario(session, {
      type: "CONFIRMATIONS_ADVANCED",
      count: 10,
    });

    expect(session.currentState).toBe("paid");
    expect(session.confirmations).toBe(10);
    expect(session.canFulfill).toBe(true);
    expect(session.auditTrail[0].reason).toContain("Settlement finalized");
  });

  it("transitions to underpaid when received amount is less than expected", () => {
    let session = createScenarioSession({ expectedZEC: "0.05" });
    session = transitionScenario(session, {
      type: "PAYMENT_DETECTED",
      amountZEC: "0.04", // 0.01 ZEC short
    });

    expect(session.currentState).toBe("underpaid");
    expect(session.canFulfill).toBe(false);
    expect(session.receivedZatoshis).toBe(4000000n);
  });

  it("prevents an underpaid invoice from becoming paid even at 10 confirmations", () => {
    let session = createScenarioSession({ expectedZEC: "0.05" });
    session = transitionScenario(session, {
      type: "PAYMENT_DETECTED",
      amountZEC: "0.04",
    });

    session = transitionScenario(session, {
      type: "CONFIRMATIONS_ADVANCED",
      count: 10,
    });

    // CRITICAL RECONCILIATION RULE: Confirmations must NOT erase underpayment!
    expect(session.currentState).toBe("underpaid");
    expect(session.canFulfill).toBe(false);
    expect(session.confirmations).toBe(10);
    expect(session.auditTrail[0].reason).toContain("remains UNDERPAID");
  });

  it("transitions to overpaid when received amount exceeds requested amount", () => {
    let session = createScenarioSession({ expectedZEC: "0.05" });
    session = transitionScenario(session, {
      type: "PAYMENT_DETECTED",
      amountZEC: "0.08",
    });

    expect(session.currentState).toBe("overpaid");
    expect(session.canFulfill).toBe(false);

    // Advancing confirmations retains overpaid state and blocks automated fulfillment
    session = transitionScenario(session, {
      type: "CONFIRMATIONS_ADVANCED",
      count: 12,
    });
    expect(session.currentState).toBe("overpaid");
    expect(session.canFulfill).toBe(false);
  });

  it("transitions to late_payment when payment arrives after invoice expiration", () => {
    let session = createScenarioSession({
      expectedZEC: "0.05",
      durationMs: 60000,
    });

    // Advance time past expiry
    const futureTime = session.invoice.expiresAt + 10000;
    session = transitionScenario(session, {
      type: "SIMULATE_LATE_PAYMENT",
      amountZEC: "0.05",
      atTime: futureTime,
    });

    expect(session.currentState).toBe("late_payment");
    expect(session.canFulfill).toBe(false);
    expect(session.auditTrail[0].reason).toContain("Late payment detected");

    // Advance confirmations does not make late payment paid
    session = transitionScenario(session, {
      type: "CONFIRMATIONS_ADVANCED",
      count: 10,
    });
    expect(session.currentState).toBe("late_payment");
    expect(session.canFulfill).toBe(false);
  });

  it("transitions to reorg_review when a chain reorganisation drops confirmations", () => {
    let session = createScenarioSession({
      expectedZEC: "0.05",
      requiredConfirmations: 10,
    });
    session = transitionScenario(session, {
      type: "PAYMENT_DETECTED",
      amountZEC: "0.05",
    });
    session = transitionScenario(session, {
      type: "CONFIRMATIONS_ADVANCED",
      count: 10,
    });
    expect(session.currentState).toBe("paid");
    expect(session.canFulfill).toBe(true);

    // Simulate 7-block reorg dropping confirmations from 10 to 3
    session = transitionScenario(session, {
      type: "SIMULATE_REORG",
      droppedConfirmations: 7,
    });

    expect(session.currentState).toBe("reorg_review");
    expect(session.confirmations).toBe(3);
    expect(session.canFulfill).toBe(false);
    expect(session.auditTrail[0].reason).toContain("Dropped 7 confirmations");

    // Re-accumulate confirmations back to 10 on the canonical chain
    session = transitionScenario(session, {
      type: "CONFIRMATIONS_ADVANCED",
      count: 10,
    });
    expect(session.currentState).toBe("paid");
    expect(session.canFulfill).toBe(true);
  });

  it("rejects invalid transitions and parameters with descriptive errors", () => {
    const session = createScenarioSession({ expectedZEC: "0.05" });

    // Cannot advance confirmations before payment is detected
    expect(() =>
      transitionScenario(session, {
        type: "CONFIRMATIONS_ADVANCED",
        count: 5,
      })
    ).toThrow("Cannot advance confirmations before payment is detected");

    // Cannot simulate reorg before payment is detected
    expect(() =>
      transitionScenario(session, {
        type: "SIMULATE_REORG",
        droppedConfirmations: 2,
      })
    ).toThrow("Cannot simulate reorg on an unpaid invoice");

    // Rejects negative confirmations
    const detectedSession = transitionScenario(session, {
      type: "PAYMENT_DETECTED",
      amountZEC: "0.05",
    });
    expect(() =>
      transitionScenario(detectedSession, {
        type: "CONFIRMATIONS_ADVANCED",
        count: -1,
      })
    ).toThrow("Confirmation count cannot be negative");
  });

  it("handles RESET to return to initial state cleanly", () => {
    let session = createScenarioSession({ expectedZEC: "0.05" });
    session = transitionScenario(session, {
      type: "PAYMENT_DETECTED",
      amountZEC: "0.05",
    });
    session = transitionScenario(session, {
      type: "CONFIRMATIONS_ADVANCED",
      count: 10,
    });
    expect(session.currentState).toBe("paid");

    const resetSession = transitionScenario(session, { type: "RESET" });
    expect(resetSession.currentState).toBe("awaiting_payment");
    expect(resetSession.confirmations).toBe(0);
    expect(resetSession.receivedZatoshis).toBe(BigInt(0));
    expect(resetSession.canFulfill).toBe(false);
  });
});
