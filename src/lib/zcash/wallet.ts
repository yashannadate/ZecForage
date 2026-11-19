import {
  discoverZucchiniProvider,
  createZucchiniClient,
  type ZucchiniProvider,
  type ZucchiniNetwork,
  type ZucchiniPermission,
  type Connection,
} from "@zucchinifi/dapp-sdk/zcash";
import { parseZip321Uri } from "./zip321";

export interface WalletRpcLog {
  id: string;
  timestamp: number;
  method: string;
  params?: unknown;
  result?: unknown;
  error?: string;
  durationMs: number;
  source: "real_extension" | "virtual_simulator";
}

export interface WalletState {
  isInstalled: boolean;
  isConnected: boolean;
  isSimulatorActive: boolean;
  network?: ZucchiniNetwork;
  accounts: readonly { name: string; address: string }[];
  approvedPermissions: readonly ZucchiniPermission[];
  lastTxid?: string;
  isSimulatedTxid?: boolean;
}

/**
 * Deterministic Virtual Zucchini Wallet Provider for testing in environments
 * where the browser extension is not currently installed.
 * Adheres strictly to the ZucchiniProvider interface contract.
 */
export function createVirtualZucchiniProvider(options?: {
  network?: ZucchiniNetwork;
  autoApprove?: boolean;
}): ZucchiniProvider {
  const currentNetwork = options?.network || "testnet";
  let connected = false;
  const listeners = new Map<string, Set<(value: unknown) => void>>();

  const mockAccounts = [
    {
      name: "ZecForge Testnet Merchant",
      address:
        "utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq",
    },
  ];

  return {
    async request(args: { method: string; params?: unknown }): Promise<unknown> {
      // Simulate realistic latency
      await new Promise((r) => setTimeout(r, 150));

      switch (args.method) {
        case "getNetwork":
        case "zcash_network":
          return { network: currentNetwork === "mainnet" ? "main" : "test" };

        case "zcash_accounts":
          return connected ? mockAccounts.map((a) => a.address) : [];

        case "zcash_requestPayment": {
          const params = args.params as { uri?: string } | undefined;
          if (!params?.uri) {
            throw new Error("Missing 'uri' parameter in zcash_requestPayment");
          }
          // Validate URI conforms to ZIP-321 Zucchini profile
          parseZip321Uri(params.uri, currentNetwork);

          // Return 64-character lowercase hex string as required by Zucchini SDK
          const randomHex = Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join("");
          return randomHex;
        }

        case "sendTransaction": {
          const randomHex = Array.from({ length: 64 }, () =>
            Math.floor(Math.random() * 16).toString(16)
          ).join("");
          return randomHex;
        }

        default:
          throw new Error(`Unsupported method '${args.method}'`);
      }
    },

    async connect(permissions?: readonly ZucchiniPermission[]): Promise<Connection> {
      await new Promise((r) => setTimeout(r, 200));
      connected = true;
      const defaultPerms: readonly ZucchiniPermission[] = ["view_addresses", "send_transaction"];
      const approved: readonly ZucchiniPermission[] = permissions && permissions.length > 0 ? permissions : defaultPerms;

      // Notify any listeners
      const accountListeners = listeners.get("accountsChanged");
      if (accountListeners) {
        accountListeners.forEach((fn) => fn(mockAccounts));
      }

      return {
        connected: true,
        approvedPermissions: approved,
        accounts: mockAccounts,
      };
    },

    async disconnect(): Promise<void> {
      await new Promise((r) => setTimeout(r, 100));
      connected = false;
      const discListeners = listeners.get("disconnect");
      if (discListeners) {
        discListeners.forEach((fn) => fn(null));
      }
    },

    on(event: string, listener: (value: unknown) => void) {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(listener);
    },

    off(event: string, listener: (value: unknown) => void) {
      const set = listeners.get(event);
      if (set) {
        set.delete(listener);
      }
    },
  };
}

/**
 * SSR-safe discovery of Zucchini browser wallet provider.
 */
export function getAvailableProvider(): {
  provider: ZucchiniProvider | undefined;
  isRealExtension: boolean;
} {
  if (typeof window === "undefined") {
    return { provider: undefined, isRealExtension: false };
  }

  const realProvider = discoverZucchiniProvider();
  if (realProvider) {
    return { provider: realProvider, isRealExtension: true };
  }

  return { provider: undefined, isRealExtension: false };
}

export { discoverZucchiniProvider, createZucchiniClient };
