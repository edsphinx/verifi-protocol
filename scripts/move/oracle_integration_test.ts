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

const ORACLES_TO_TEST = [
  {
    id: "aptos-balance",
    name: "Aptos Native Balance",
    createArgs: (adminAddress: string) => ({
      description: `Will balance of ${adminAddress.slice(0, 6)}... be > 1000 Octas?`,
      targetAddress: adminAddress,
      targetValue: "1000",
      operator: 0, // Greater Than
    }),
    expectedOutcome: 2, // YES
  },
  {
    id: "usdc-total-supply",
    name: "USDC Total Supply",
    createArgs: (_adminAddress: string) => ({
      description: "Will USDC total supply be > 1,000,000?",
      targetAddress: "0x1", // No es relevante para este oráculo
      targetValue: "1000000",
      operator: 0, // Greater Than
    }),
    expectedOutcome: 2, // YES
  },
];

async function registerOracle(
  aptos: Aptos,
  admin: Account,
  id: string,
  name: string,
) {
  try {
    const txn = await aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::oracle_registry::register_oracle`,
        functionArguments: [id, name],
      },
    });
    const committed = await aptos.signAndSubmitTransaction({
      signer: admin,
      transaction: txn,
    });
    await aptos.waitForTransaction({ transactionHash: committed.hash });
    console.log(`- Oracle "${id}" registered successfully.`);
  } catch (e: any) {
    if (e.message?.includes("0x6407")) {
      console.log(`- Oracle "${id}" is already registered. Skipping.`);
    } else {
      throw e;
    }
  }
}

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

  console.log("🚀 Starting Final Architecture Test Flow...");
  console.log(`- Using Admin Account: ${admin.accountAddress.toString()}`);

  // === 1. Registrar todos los oráculos ===
  console.log("\n[1/3] Registering all oracles...");
  for (const oracle of ORACLES_TO_TEST) {
    await registerOracle(aptos, admin, oracle.id, oracle.name);
  }

  // === 2. Probar el flujo de creación y resolución para cada oráculo ===
  console.log(
    "\n[2/3] Testing market creation and resolution for each oracle...",
  );
  for (const oracle of ORACLES_TO_TEST) {
    console.log(`\n--- Testing Oracle: ${oracle.id} ---`);
    let marketAddress: string | undefined;
    const args = oracle.createArgs(admin.accountAddress.toString());

    // Crear mercado
    try {
      const createTxn = await aptos.transaction.build.simple({
        sender: admin.accountAddress,
        data: {
          function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
          functionArguments: [
            args.description,
            (Math.floor(Date.now() / 1000) + 10).toString(),
            admin.accountAddress.toString(),
            oracle.id,
            args.targetAddress,
            "metric",
            args.targetValue,
            args.operator,
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
      if (isUserTransactionResponse(response)) {
        const event = response.events.find(
          (e) =>
            e.type === `${MODULE_ADDRESS}::verifi_protocol::MarketCreatedEvent`,
        );
        if (event && typeof event.data.market_address === "string") {
          marketAddress = event.data.market_address;
          if (marketAddress !== undefined)
            console.log(
              `  ✅ Market created successfully: ${marketAddress.slice(0, 10)}...`,
            );
        }
      }
    } catch (e) {
      console.error(`  ❌ Failed to create market for ${oracle.id}.`, e);
      process.exit(1);
    }

    // Esperar y resolver
    await new Promise((resolve) => setTimeout(resolve, 11000));
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
      await aptos.waitForTransaction({ transactionHash: committed.hash });
      console.log("  ✅ Market resolved programmatically.");
    } catch (e) {
      console.error(`  ❌ Failed to resolve market for ${oracle.id}.`, e);
      process.exit(1);
    }

    // Verificar estado
    try {
      const state = await aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::verifi_protocol::get_market_state`,
          functionArguments: [marketAddress],
        },
      });
      const finalStatus = parseInt(state[0] as string, 10);
      console.log(`  Status from view: ${finalStatus}`);
      console.log(`  Expected outcome: ${oracle.expectedOutcome}`);
      if (finalStatus === oracle.expectedOutcome) {
        console.log(
          `  ✅ Market resolved to expected outcome (Status: ${finalStatus}).`,
        );
      } else {
        throw new Error(
          `Expected status ${oracle.expectedOutcome}, but got ${finalStatus}`,
        );
      }
    } catch (e) {
      console.error(`  ❌ Failed to verify final state for ${oracle.id}.`, e);
      process.exit(1);
    }
  }

  // === 3. Prueba Negativa Final ===
  console.log("\n[3/3] Final Negative Test...");
  try {
    const createTxn = await aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          "Invalid",
          "0",
          admin.accountAddress.toString(),
          "unregistered",
          "0x1",
          "m",
          "1",
          0,
        ],
      },
    });
    const committed = await aptos.signAndSubmitTransaction({
      signer: admin,
      transaction: createTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committed.hash });
    console.error(
      "  ❌ Negative Test FAILED: Market was created with an unregistered oracle.",
    );
    process.exit(1);
  } catch (error: any) {
    if (error.message?.includes("verifi_protocol") && (error.message?.includes("0xc") || error.message?.includes(": 12"))) {
      console.log(
        "  ✅ Negative Test PASSED: Contract correctly rejected the transaction (E_ORACLE_NOT_ACTIVE).",
      );
    } else {
      console.error(
        "  ❌ Negative Test FAILED with an unexpected error:",
        error.message,
      );
      process.exit(1);
    }
  }

  console.log("\n✨ Final architecture test completed successfully!");
}

main();
