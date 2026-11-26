import {
  CONFIRMATION_THRESHOLD_DEFAULT,
  CONFIRMATION_THRESHOLD_MAX,
  CONFIRMATION_THRESHOLD_MIN,
  RPC_PRESETS,
} from "./types";

export interface PersistedMerchantSettings {
  rpcPresetId: string;
  customRpcUrl: string;
  customRpcTls: boolean;
  confirmationThreshold: number;
}

export interface PersistedZodlSummary {
  id?: string;
  platform?: "ios" | "android" | "debug_build";
  network?: "testnet" | "mainnet";
  uri?: string;
  notes?: string;
  result: "passed" | "failed" | "parameter_rejected";
  checklist: {
    scannedSuccessfully: boolean;
    addressMatched: boolean;
    amountMatched: boolean;
    memoDecoded: boolean;
    feeCalculated: boolean;
  };
  observedTxid?: string;
  timestamp: number;
}

export interface PersistedScenarioSummary {
  currentState: string;
  confirmations: number;
  requiredConfirmations: number;
  canFulfill: boolean;
  timestamp: number;
}

export interface OnboardingChecklistState {
  step1: boolean;
  step2: boolean;
  step3: boolean;
}

export interface WorkbenchActivityItem {
  id: string;
  tool: string;
  label: string;
  kind: "local" | "simulated" | "api";
  timestamp: number;
}

export interface PersistedWorkbenchState {
  settings: PersistedMerchantSettings;
  lastTestedAddress?: string;
  lastTestedNetwork?: "testnet" | "mainnet";
  lastGeneratedUri?: string;
  zodlRun?: PersistedZodlSummary;
  zodlHistory: PersistedZodlSummary[];
  scenario?: PersistedScenarioSummary;
  checklist: OnboardingChecklistState;
  recentActivity: WorkbenchActivityItem[];
}

const STORAGE_KEY = "zecforage_workbench_state_v1";

export const DEFAULT_MERCHANT_SETTINGS: PersistedMerchantSettings = {
  rpcPresetId: RPC_PRESETS[0].id,
  customRpcUrl: "",
  customRpcTls: true,
  confirmationThreshold: CONFIRMATION_THRESHOLD_DEFAULT,
};

export const DEFAULT_CHECKLIST: OnboardingChecklistState = {
  step1: false,
  step2: false,
  step3: false,
};

export function clampThreshold(value: number): number {
  if (!Number.isFinite(value)) return CONFIRMATION_THRESHOLD_DEFAULT;
  return Math.min(
    CONFIRMATION_THRESHOLD_MAX,
    Math.max(CONFIRMATION_THRESHOLD_MIN, Math.round(value))
  );
}

export function loadWorkbenchState(): PersistedWorkbenchState {
  if (typeof window === "undefined") {
    return {
      settings: { ...DEFAULT_MERCHANT_SETTINGS },
      zodlHistory: [],
      checklist: { ...DEFAULT_CHECKLIST },
      recentActivity: [],
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        settings: { ...DEFAULT_MERCHANT_SETTINGS },
        zodlHistory: [],
        checklist: { ...DEFAULT_CHECKLIST },
        recentActivity: [],
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedWorkbenchState>;
    const rawSettings = parsed.settings || ({} as Partial<PersistedMerchantSettings>);
    const presetExists = RPC_PRESETS.some((p) => p.id === rawSettings.rpcPresetId);
    const rawChecklist = parsed.checklist || ({} as Partial<OnboardingChecklistState>);
    const rawActivity = Array.isArray(parsed.recentActivity) ? parsed.recentActivity : [];
    const rawZodlHistory = Array.isArray(parsed.zodlHistory) ? parsed.zodlHistory : [];

    return {
      settings: {
        rpcPresetId: presetExists ? (rawSettings.rpcPresetId as string) : DEFAULT_MERCHANT_SETTINGS.rpcPresetId,
        customRpcUrl: typeof rawSettings.customRpcUrl === "string" ? rawSettings.customRpcUrl : "",
        customRpcTls: typeof rawSettings.customRpcTls === "boolean" ? rawSettings.customRpcTls : true,
        confirmationThreshold: clampThreshold(Number(rawSettings.confirmationThreshold)),
      },
      lastTestedAddress: typeof parsed.lastTestedAddress === "string" ? parsed.lastTestedAddress : undefined,
      lastTestedNetwork: parsed.lastTestedNetwork === "mainnet" ? "mainnet" : parsed.lastTestedNetwork === "testnet" ? "testnet" : undefined,
      lastGeneratedUri: typeof parsed.lastGeneratedUri === "string" ? parsed.lastGeneratedUri : undefined,
      zodlRun: parsed.zodlRun,
      zodlHistory: rawZodlHistory.slice(0, 10),
      scenario: parsed.scenario,
      checklist: {
        step1: Boolean(rawChecklist.step1),
        step2: Boolean(rawChecklist.step2),
        step3: Boolean(rawChecklist.step3),
      },
      recentActivity: rawActivity
        .filter(
          (item): item is WorkbenchActivityItem =>
            Boolean(item) &&
            typeof item.id === "string" &&
            typeof item.tool === "string" &&
            typeof item.label === "string" &&
            typeof item.timestamp === "number"
        )
        .slice(0, 12),
    };
  } catch {
    return {
      settings: { ...DEFAULT_MERCHANT_SETTINGS },
      zodlHistory: [],
      checklist: { ...DEFAULT_CHECKLIST },
      recentActivity: [],
    };
  }
}

export function saveWorkbenchState(patch: Partial<PersistedWorkbenchState>): PersistedWorkbenchState {
  const current = loadWorkbenchState();
  const next: PersistedWorkbenchState = {
    ...current,
    ...patch,
    settings: patch.settings
      ? {
          ...current.settings,
          ...patch.settings,
          confirmationThreshold: clampThreshold(patch.settings.confirmationThreshold),
        }
      : current.settings,
    zodlHistory: patch.zodlHistory ?? current.zodlHistory,
    checklist: patch.checklist
      ? { ...current.checklist, ...patch.checklist }
      : current.checklist,
    recentActivity: patch.recentActivity ?? current.recentActivity,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("zecforage:state-updated", { detail: next }));
    } catch {
      // Ignore storage quota or private browsing errors
    }
  }
  return next;
}

export function appendWorkbenchActivity(
  entry: Omit<WorkbenchActivityItem, "id" | "timestamp">
): PersistedWorkbenchState {
  const current = loadWorkbenchState();
  const nextItem: WorkbenchActivityItem = {
    id: `act_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
    ...entry,
  };
  return saveWorkbenchState({
    recentActivity: [nextItem, ...current.recentActivity].slice(0, 12),
  });
}
