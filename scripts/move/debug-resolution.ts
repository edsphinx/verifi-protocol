import {
  Account,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  isUserTransactionResponse,
  type Network,
} from "@aptos-labs/ts-sdk";
import { networkName, nodeUrl, privateKey } from "./_config";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

async function main() {
  if (!privateKey || !MODULE_ADDRESS)
    throw new Error("Missing required .env variables.");

  const aptos = new Aptos(
    new AptosConfig({
      network: networkName as Network,
      fullnode: `${nodeUrl}`,
    }),
  );
  const admin = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(privateKey),
  });
  const adminAddress = admin.accountAddress.toString();

  console.log("🚀 Testing Resolution Debug Flow...");
  console.log(`- Using Account: ${adminAddress}`);

  let marketAddress: string;

  // Create market
  console.log("\n[1/3] Creating test market...");
  try {
    const createTxn = await aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          "Will USDC Total Supply be > 1,000,000?",
          (Math.floor(Date.now() / 1000) + 10).toString(),
          adminAddress,
          "usdc-total-supply",
          "0x1",
          "get_total_supply",
          "1000000",
          0, // Greater Than
        ],
      },
    });
    const committed = await aptos.signAndSubmitTransaction({
      signer: admin,
      transaction: createTxn,
    });
    const response = await aptos.waitForTransaction({
      transactionHash: committed.hash,
    });
    const event = isUserTransactionResponse(response)
      ? response.events.find(
          (e) =>
            e.type === `${MODULE_ADDRESS}::verifi_protocol::MarketCreatedEvent`,
        )
      : undefined;

    if (event && typeof event.data.market_address === "string") {
      marketAddress = event.data.market_address;
      console.log(`  ✅ Market created: ${marketAddress}`);
    } else {
      throw new Error("Market creation failed");
    }
  } catch (e) {
    console.error("  ❌ Failed to create market.", e);
    process.exit(1);
  }

  // Check debug data BEFORE resolution
  console.log("\n[2/3] Checking debug data BEFORE resolution...");
  try {
    const debugData = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::debug_market_resolution_data`,
        functionArguments: [marketAddress],
      },
    });
    console.log("  Oracle value:", debugData[0]);
    console.log("  Target value:", debugData[1]);
    console.log("  Operator:", debugData[2]);
    console.log("  Resolution timestamp:", debugData[3]);
    console.log("  Current timestamp:", debugData[4]);
    console.log("  Status:", debugData[5]);
    console.log(
      "  Time until resolution:",
      Number(debugData[3]) - Number(debugData[4]),
      "seconds",
    );
  } catch (e) {
    console.error("  ❌ Failed to get debug data.", e);
  }

  // Wait
  console.log("\n  Waiting 11 seconds...");
  await new Promise((resolve) => setTimeout(resolve, 11000));

  // Try to resolve
  console.log("\n[3/3] Resolving market...");
  try {
    const resolveTxn = await aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_resolvers::resolve_market`,
        functionArguments: [marketAddress],
      },
    });
    const committed = await aptos.signAndSubmitTransaction({
      signer: admin,
      transaction: resolveTxn,
    });
    const response = await aptos.waitForTransaction({
      transactionHash: committed.hash,
    });

    if (isUserTransactionResponse(response)) {
      console.log("  Transaction success:", response.success);
      console.log("  VM Status:", response.vm_status);
      console.log("  Events emitted:", response.events.length);
      response.events.forEach((event, i) => {
        console.log(`    Event ${i + 1}: ${event.type}`);
        console.log(`      Data:`, JSON.stringify(event.data, null, 6));
      });
    }
  } catch (e: any) {
    console.error("  ❌ Resolution failed:", e.message);
    if (e.transaction) {
      console.error("  Transaction details:", e.transaction);
    }
  }

  // Check debug data AFTER resolution
  console.log("\n[4/3] Checking debug data AFTER resolution...");
  try {
    const debugData = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::debug_market_resolution_data`,
        functionArguments: [marketAddress],
      },
    });
    console.log("  Oracle value:", debugData[0]);
    console.log("  Target value:", debugData[1]);
    console.log("  Operator:", debugData[2]);
    console.log("  Resolution timestamp:", debugData[3]);
    console.log("  Current timestamp:", debugData[4]);
    console.log("  Status:", debugData[5]);

    const expectedStatus = Number(debugData[0]) > Number(debugData[1]) ? 2 : 3;
    if (Number(debugData[5]) === expectedStatus) {
      console.log("  ✅ Status is CORRECT!");
    } else {
      console.log(
        `  ❌ Status is WRONG! Expected ${expectedStatus}, got ${debugData[5]}`,
      );
    }
  } catch (e) {
    console.error("  ❌ Failed to get debug data.", e);
  }
}

main();
