import { zecToZatoshis } from "./zip321";

export type PaymentState =
  | "awaiting_payment"
  | "detected"
  | "confirming"
  | "paid"
  | "underpaid"
  | "overpaid"
  | "late_payment"
  | "reorg_review";

export interface InvoiceConfig {
  id: string;
  expectedZEC: string;
  expectedZatoshis: bigint;
  createdAt: number;
  expiresAt: number; // Unix timestamp ms
  requiredConfirmations: number;
}

export interface ScenarioAuditEntry {
  id: string;
  timestamp: number;
  previousState: PaymentState;
  newState: PaymentState;
  eventType: string;
  receivedZatoshis: string;
  confirmations: number;
  canFulfill: boolean;
  reason: string;
}

export interface ScenarioSession {
  invoice: InvoiceConfig;
  currentState: PaymentState;
  receivedZatoshis: bigint;
  confirmations: number;
  canFulfill: boolean;
  isExpired: boolean;
  auditTrail: ScenarioAuditEntry[];
  simulatedTxid?: string;
}

export const DEFAULT_REQUIRED_CONFIRMATIONS = 10;
export const DEFAULT_INVOICE_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Creates a new deterministic payment scenario session.
 */
export function createScenarioSession(params?: {
  expectedZEC?: string;
  durationMs?: number;
  requiredConfirmations?: number;
}): ScenarioSession {
  const zec = params?.expectedZEC || "0.05";
  const zatoshis = zecToZatoshis(zec);
  const now = Date.now();
  const duration = params?.durationMs || DEFAULT_INVOICE_DURATION_MS;
  const reqConfs = params?.requiredConfirmations ?? DEFAULT_REQUIRED_CONFIRMATIONS;

  const invoice: InvoiceConfig = {
    id: `inv_sim_${Math.random().toString(36).slice(2, 8)}`,
    expectedZEC: zec,
    expectedZatoshis: zatoshis,
    createdAt: now,
    expiresAt: now + duration,
    requiredConfirmations: reqConfs,
  };

  const initialAudit: ScenarioAuditEntry = {
    id: `audit_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: now,
    previousState: "awaiting_payment",
    newState: "awaiting_payment",
    eventType: "INVOICE_INITIALIZED",
    receivedZatoshis: "0",
    confirmations: 0,
    canFulfill: false,
    reason: `Invoice initialized for ${zec} ZEC (${zatoshis.toString()} zatoshis). Awaiting payment detection.`,
  };

  return {
    invoice,
    currentState: "awaiting_payment",
    receivedZatoshis: BigInt(0),
    confirmations: 0,
    canFulfill: false,
    isExpired: false,
    auditTrail: [initialAudit],
  };
}

/**
 * Transitions the scenario state machine based on deterministic events.
 */
export function transitionScenario(
  session: ScenarioSession,
  event:
    | { type: "PAYMENT_DETECTED"; amountZEC: string; atTime?: number }
    | { type: "CONFIRMATIONS_ADVANCED"; count: number; atTime?: number }
    | { type: "SIMULATE_REORG"; droppedConfirmations: number; atTime?: number }
    | { type: "SIMULATE_LATE_PAYMENT"; amountZEC: string; atTime?: number }
    | { type: "EXPIRE_INVOICE"; atTime?: number }
    | { type: "RESET" }
): ScenarioSession {
  const now = Date.now();
  const prevState = session.currentState;
  let nextState = prevState;
  let receivedZats = session.receivedZatoshis;
  let confs = session.confirmations;
  let reason = "";
  let eventType = event.type;
  let txid = session.simulatedTxid;

  switch (event.type) {
    case "RESET": {
      return createScenarioSession({
        expectedZEC: session.invoice.expectedZEC,
        requiredConfirmations: session.invoice.requiredConfirmations,
      });
    }

    case "EXPIRE_INVOICE": {
      const atTime = event.atTime || session.invoice.expiresAt + 1000;
      if (session.currentState === "awaiting_payment") {
        nextState = "awaiting_payment";
        reason = `Invoice passed expiration threshold (${new Date(session.invoice.expiresAt).toLocaleTimeString()}). Any subsequent arrival will be flagged as late.`;
      } else {
        reason = `Invoice marked expired. Current state remains ${session.currentState}.`;
      }
      return {
        ...session,
        isExpired: true,
        auditTrail: [
          {
            id: `audit_${Math.random().toString(36).slice(2, 8)}`,
            timestamp: atTime,
            previousState: prevState,
            newState: nextState,
            eventType: "EXPIRE_INVOICE",
            receivedZatoshis: receivedZats.toString(),
            confirmations: confs,
            canFulfill: session.canFulfill,
            reason,
          },
          ...session.auditTrail,
        ],
      };
    }

    case "SIMULATE_LATE_PAYMENT": {
      const atTime = event.atTime || session.invoice.expiresAt + 60000;
      receivedZats = zecToZatoshis(event.amountZEC);
      confs = 0;
      nextState = "late_payment";
      txid = `sim_${Array.from({ length: 60 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      reason = `Late payment detected after invoice expiration. Received ${event.amountZEC} ZEC. Automated fulfillment is prohibited to protect merchant inventory.`;
      break;
    }

    case "PAYMENT_DETECTED": {
      const atTime = event.atTime || now;
      const isLate = session.isExpired || atTime > session.invoice.expiresAt;
      receivedZats = zecToZatoshis(event.amountZEC);
      confs = 0;
      txid = `sim_${Array.from({ length: 60 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

      // Rule Precedence:
      // 1. Expiry check
      if (isLate) {
        nextState = "late_payment";
        reason = `Payment arrived after invoice expiration time (${new Date(session.invoice.expiresAt).toLocaleTimeString()}). Flagged for manual merchant review.`;
      }
      // 2. Amount checks
      else if (receivedZats < session.invoice.expectedZatoshis) {
        nextState = "underpaid";
        reason = `Underpayment detected! Received ${event.amountZEC} ZEC (${receivedZats.toString()} zatoshis), expected ${session.invoice.expectedZEC} ZEC (${session.invoice.expectedZatoshis.toString()} zatoshis). Fulfillment withheld.`;
      } else if (receivedZats > session.invoice.expectedZatoshis) {
        nextState = "overpaid";
        reason = `Overpayment detected! Received ${event.amountZEC} ZEC (${receivedZats.toString()} zatoshis), exceeding requested ${session.invoice.expectedZEC} ZEC. Requires manual review / partial refund.`;
      } else {
        // Exact match on time
        nextState = "detected";
        reason = `Exact payment of ${event.amountZEC} ZEC detected in shielded mempool (0 confirmations). Scanner monitoring canonical block inclusion.`;
      }
      break;
    }

    case "CONFIRMATIONS_ADVANCED": {
      if (event.count < 0) {
        throw new Error("Confirmation count cannot be negative.");
      }
      confs = event.count;

      // Exception Precedence: Confirmations do NOT erase underpayment, overpayment, or late payment!
      if (prevState === "underpaid") {
        nextState = "underpaid";
        reason = `Confirmations advanced to ${confs}, but invoice remains UNDERPAID. Merchant fulfillment must not occur without payment resolution.`;
      } else if (prevState === "overpaid") {
        nextState = "overpaid";
        reason = `Confirmations advanced to ${confs}, but invoice remains OVERPAID. Requires reconciliation review.`;
      } else if (prevState === "late_payment") {
        nextState = "late_payment";
        reason = `Confirmations advanced to ${confs}, but invoice arrived LATE. Fulfillment remains withheld.`;
      } else if (prevState === "awaiting_payment") {
        throw new Error("Cannot advance confirmations before payment is detected.");
      } else {
        // Normal progression
        if (confs >= session.invoice.requiredConfirmations) {
          nextState = "paid";
          reason = `Payment reached ${confs} block confirmations (meets ${session.invoice.requiredConfirmations} confirmation policy threshold). Settlement finalized, fulfillment authorized.`;
        } else if (confs > 0) {
          nextState = "confirming";
          reason = `Block height progressed. Payment accumulated ${confs}/${session.invoice.requiredConfirmations} confirmations. Awaiting final threshold.`;
        } else {
          nextState = "detected";
          reason = "Payment remains at 0 confirmations (mempool inclusion).";
        }
      }
      break;
    }

    case "SIMULATE_REORG": {
      if (prevState === "awaiting_payment") {
        throw new Error("Cannot simulate reorg on an unpaid invoice.");
      }
      const dropped = event.droppedConfirmations;
      const newConfs = Math.max(0, confs - dropped);
      confs = newConfs;
      nextState = "reorg_review";
      reason = `Simulated chain reorganisation! Dropped ${dropped} confirmations. New canonical confirmation count: ${newConfs}. Fulfillment authority revoked (canFulfill: false).`;
      break;
    }

    default:
      throw new Error(`Unhandled scenario event`);
  }

  const canFulfill = nextState === "paid";

  const newAudit: ScenarioAuditEntry = {
    id: `audit_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: now,
    previousState: prevState,
    newState: nextState,
    eventType,
    receivedZatoshis: receivedZats.toString(),
    confirmations: confs,
    canFulfill,
    reason,
  };

  return {
    ...session,
    currentState: nextState,
    receivedZatoshis: receivedZats,
    confirmations: confs,
    canFulfill,
    simulatedTxid: txid,
    auditTrail: [newAudit, ...session.auditTrail],
  };
}
