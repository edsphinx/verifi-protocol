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
    new AptosConfig({ network: networkName as Network, fullnode: nodeUrl }),
  );
  const admin = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(privateKey),
  });
  const adminAddress = admin.accountAddress.toString();

  console.log("🚀 Starting Advanced Debug Flow...");
  console.log(`- Using Account: ${adminAddress}`);

  let marketAddress: string;

  // === Paso 1: Crear el Mercado ===
  console.log("\n[1/4] Creating a new market...");
  try {
    const createTxn = await aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          "Advanced Debug Market",
          (Math.floor(Date.now() / 1000) + 10).toString(),
          adminAddress,
          "aptos-balance",
          adminAddress,
          "balance",
          "1000",
          0,
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

    if (!event || typeof event.data.market_address !== "string") {
      throw new Error("Market creation failed or event not found.");
    }
    marketAddress = event.data.market_address;
    console.log(`  ✅ Market created successfully: ${marketAddress}`);
  } catch (e) {
    console.error("  ❌ Failed to create market.", e);
    process.exit(1);
  }

  // === Paso 2: Verificación PRE-Resolución (La Prueba Clave) ===
  console.log("\n[2/4] Performing pre-resolution check...");
  try {
    const outcome = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::debug_check_outcome`,
        functionArguments: [marketAddress],
      },
    });
    console.log(
      `  ✅ DATO IRREFUTABLE: The contract's logic determined the outcome should be YES: ${outcome[0]}`,
    );
  } catch (e) {
    console.error("  ❌ Failed to run diagnostic view function.", e);
    process.exit(1);
  }

  // === Paso 3: Esperar y Resolver ===
  console.log("\n[3/4] Waiting and resolving market...");
  await new Promise((resolve) => setTimeout(resolve, 11000));
  try {
    const resolveTxn = await aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::resolve_market_programmatically`,
        functionArguments: [marketAddress],
      },
    });
    await aptos.signAndSubmitTransaction({
      signer: admin,
      transaction: resolveTxn,
    });
    console.log("  ✅ Resolve transaction sent successfully.");
  } catch (e) {
    console.error(`  ❌ Failed to resolve market.`, e);
    process.exit(1);
  }

  // === Paso 4: Verificar el Estado Final ===
  console.log("\n[4/4] Checking final state...");
  try {
    const state = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_market_state`,
        functionArguments: [marketAddress],
      },
    });
    const finalStatus = parseInt(state[0] as string, 10);
    console.log(`  ✅ Post-resolution final status: ${finalStatus}`);
    if (finalStatus !== 2) {
      console.error(
        "  🔥 DISCREPANCY DETECTED: The pre-resolution check was YES, but the final status is NOT 2.",
      );
    } else {
      console.log("  ✨ Logic is consistent. State updated correctly.");
    }
  } catch (e) {
    console.error(`  ❌ Failed to verify final state.`, e);
    process.exit(1);
  }
}

main();
