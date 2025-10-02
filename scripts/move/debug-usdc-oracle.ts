import {
  Account,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  isUserTransactionResponse,
  type Network,
} from "@aptos-labs/ts-sdk";
import assert from "assert";
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

  console.log("🚀 Starting Advanced USDC Oracle Debug Flow...");
  console.log(`- Using Account: ${adminAddress}`);

  let marketAddress: string;

  // === Paso 1: Crear el Mercado de USDC ===
  console.log("\n[1/4] Creating the USDC market...");
  try {
    const createTxn = await aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          "Will USDC Total Supply be > 1,000,000?",
          (Math.floor(Date.now() / 1000) + 15).toString(), // Resuelve en 15 segundos
          adminAddress,
          "usdc-total-supply", // <-- Oráculo de USDC
          "0x1", // Target address (no usado por este oráculo)
          "get_total_supply",
          "1000000", // Target value
          0, // Operador: >
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

    assert(
      event && typeof event.data.market_address === "string",
      "Market creation failed or event not found.",
    );
    marketAddress = event.data.market_address;
    console.log(`  ✅ USDC Market created successfully: ${marketAddress}`);
  } catch (e) {
    console.error("  ❌ Failed to create USDC market.", e);
    process.exit(1);
  }

  // === Paso 2: Verificación PRE-Resolución (La Prueba Clave) ===
  console.log(
    "\n[2/4] Performing pre-resolution check with 'debug_check_outcome'...",
  );
  let preResolutionOutcome: boolean | undefined;
  try {
    const outcome = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::debug_check_outcome`,
        functionArguments: [marketAddress],
      },
    });
    preResolutionOutcome = outcome[0] as boolean;
    console.log(
      `  ✅ DATO IRREFUTABLE: The contract's logic determined the outcome should be YES: ${preResolutionOutcome}`,
    );
  } catch (e) {
    console.error("  ❌ Failed to run diagnostic view function.", e);
    process.exit(1);
  }

  // === Paso 3: Esperar y Resolver ===
  console.log("\n[3/4] Waiting and resolving market...");
  await new Promise((resolve) => setTimeout(resolve, 16000));
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
    console.log(`  ✅ Post-resolution final status from chain: ${finalStatus}`);

    // Análisis Final
    const expectedStatus = preResolutionOutcome ? 2 : 3;
    if (finalStatus === expectedStatus) {
      console.log(
        "  ✨ LOGIC IS CONSISTENT! The final status matches the pre-resolution check.",
      );
    } else {
      console.error(
        `  🔥 DISCREPANCY DETECTED: The pre-resolution check was ${preResolutionOutcome} (expected status ${expectedStatus}), but the final status is ${finalStatus}.`,
      );
    }
  } catch (e) {
    console.error(`  ❌ Failed to verify final state.`, e);
    process.exit(1);
  }
}

main();
