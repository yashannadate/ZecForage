import { describe, it, expect } from "vitest";
import {
  createVirtualZucchiniProvider,
  createZucchiniClient,
} from "../src/lib/zcash/wallet";

const VALID_ZIP321_URI =
  "zcash:utest1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq?amount=0.005&memo=b3JkZXJfOTk5";

describe("Browser Wallet Compatibility & Virtual Zucchini Provider", () => {
  it("creates a virtual Zucchini provider conforming to ZucchiniProvider interface", () => {
    const provider = createVirtualZucchiniProvider({ network: "testnet" });
    expect(typeof provider.request).toBe("function");
    expect(typeof provider.connect).toBe("function");
    expect(typeof provider.disconnect).toBe("function");
    expect(typeof provider.on).toBe("function");
  });

  it("handles connect() and grants approved permissions", async () => {
    const provider = createVirtualZucchiniProvider({ network: "testnet" });
    const client = createZucchiniClient(provider);

    const connection = await client.connect({
      permissions: ["view_addresses", "send_transaction"],
    });

    expect(connection.connected).toBe(true);
    expect(connection.approvedPermissions).toContain("view_addresses");
    expect(connection.approvedPermissions).toContain("send_transaction");
    expect(connection.accounts.length).toBeGreaterThan(0);
    expect(connection.accounts[0].address).toContain("utest1");
  });

  it("reports active network correctly", async () => {
    const testnetProvider = createVirtualZucchiniProvider({ network: "testnet" });
    const testnetClient = createZucchiniClient(testnetProvider);
    expect(await testnetClient.network()).toBe("testnet");

    const mainnetProvider = createVirtualZucchiniProvider({ network: "mainnet" });
    const mainnetClient = createZucchiniClient(mainnetProvider);
    expect(await mainnetClient.network()).toBe("mainnet");
  });

  it("processes ZIP-321 requestPayment(uri) and returns valid txid", async () => {
    const provider = createVirtualZucchiniProvider({ network: "testnet" });
    const client = createZucchiniClient(provider);

    await client.connect();
    const result = await client.requestPayment(VALID_ZIP321_URI);

    expect(result).toHaveProperty("txid");
    expect(typeof result.txid).toBe("string");
    expect(result.txid.length).toBeGreaterThan(16);
  });

  it("rejects requestPayment(uri) if URI is invalid or malformed", async () => {
    const provider = createVirtualZucchiniProvider({ network: "testnet" });
    const client = createZucchiniClient(provider);

    await client.connect();
    const invalidUri = "bitcoin:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";

    await expect(client.requestPayment(invalidUri)).rejects.toThrow();
  });

  it("handles disconnect and notifies listeners", async () => {
    const provider = createVirtualZucchiniProvider({ network: "testnet" });
    const client = createZucchiniClient(provider);

    let disconnectedTriggered = false;
    client.on("disconnect", () => {
      disconnectedTriggered = true;
    });

    await client.connect();
    await client.disconnect();

    expect(disconnectedTriggered).toBe(true);
  });
});
