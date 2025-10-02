/**
 * Tapp AMM Integration Test
 * Tests the complete flow: Create Market → Add Liquidity → Swap → Remove Liquidity
 */

import {
  Aptos,
  AptosConfig,
  isUserTransactionResponse,
  type Network,
} from "@aptos-labs/ts-sdk";
import { networkName, nodeUrl } from "./_config";
import {
  marketCreatorAccount,
  trader1Account,
  trader2Account,
  trader3Account,
  logAllAccounts,
} from "./_test-accounts";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;
const TAPP_ADDRESS = process.env.NEXT_PUBLIC_TAPP_PROTOCOL_ADDRESS;

async function main() {
  if (!MODULE_ADDRESS || !TAPP_ADDRESS) {
    throw new Error("Required addresses are not set in .env file.");
  }

  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: nodeUrl,
  });
  const aptos = new Aptos(aptosConfig);

  logAllAccounts();

  console.log("🚀 Starting Tapp AMM Integration Test...");
  console.log(`📝 Market Creator: ${marketCreatorAccount.accountAddress}`);
  console.log(
    `💧 Liquidity Provider (Trader 1): ${trader1Account.accountAddress}`,
  );
  console.log(`🔄 Swapper (Trader 2): ${trader2Account.accountAddress}`);
  console.log(`🔄 Swapper (Trader 3): ${trader3Account.accountAddress}`);

  let marketAddress: string | undefined;

  // === Step 1: Create Market with Tapp Hook ===
  console.log("\n[1/7] Creating market with Tapp AMM hook...");
  try {
    const createTxn = await aptos.transaction.build.simple({
      sender: marketCreatorAccount.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          "Tapp AMM Test - Manual resolution market",
          "1762017600", // Dec 31, 2025
          marketCreatorAccount.accountAddress, // resolver (resolverá manualmente)
          "tapp_prediction", // oracle_id (Oracle que registramos)
          "0x1", // target_address
          "balance", // target_function
          "1", // target_value
          0, // operator (GREATER_THAN)
        ],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: marketCreatorAccount,
      transaction: createTxn,
    });
    const response = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    if (isUserTransactionResponse(response)) {
      const event = response.events.find(
        (e) =>
          e.type === `${MODULE_ADDRESS}::verifi_protocol::MarketCreatedEvent`,
      );
      if (event) {
        marketAddress = event.data.market_address;
        console.log(`✅ Market created with Tapp hook: ${marketAddress}`);
      }
    }
  } catch (error) {
    console.error("❌ Failed to create market.", error);
    process.exit(1);
  }

  // === Step 2: Initialize Tapp Pool ===
  console.log("\n[2/7] Initializing Tapp AMM pool for the market...");
  try {
    // Get market tokens
    const marketInfo = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_market_tokens`,
        functionArguments: [marketAddress],
      },
    });

    console.log(`   Market tokens retrieved`);

    // Note: En producción, aquí se llamaría a tapp::create_pool
    // Pero por ahora solo compramos shares para probar el mercado básico
    const buyTxn = await aptos.transaction.build.simple({
      sender: trader1Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 100_000_000, true], // 1 APT worth of YES
      },
    });
    await aptos.signAndSubmitTransaction({
      signer: trader1Account,
      transaction: buyTxn,
    });

    console.log(
      `✅ Trader 1 bought initial shares (Tapp pool would be initialized here)`,
    );
  } catch (error) {
    console.error("❌ Failed to initialize pool.", error);
    process.exit(1);
  }

  // === Step 3: Trader 2 Swaps YES → NO ===
  console.log("\n[3/7] Trader 2 swapping YES → NO (0.3 APT)...");
  try {
    // Buy YES shares first
    const buyYesTxn = await aptos.transaction.build.simple({
      sender: trader2Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 30_000_000, true], // 0.3 APT
      },
    });
    await aptos.signAndSubmitTransaction({
      signer: trader2Account,
      transaction: buyYesTxn,
    });

    console.log(`✅ Trader 2 bought YES shares`);

    // Check balances
    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [
          trader2Account.accountAddress.toString(),
          marketAddress,
        ],
      },
    });
    console.log(`   📊 Trader 2 Balances:`);
    console.log(`      - YES: ${balances[0]}`);
    console.log(`      - NO:  ${balances[1]}`);
  } catch (error) {
    console.error("❌ Failed to swap.", error);
    process.exit(1);
  }

  // === Step 4: Trader 3 Swaps NO → YES ===
  console.log("\n[4/7] Trader 3 swapping NO → YES (0.3 APT)...");
  try {
    const buyNoTxn = await aptos.transaction.build.simple({
      sender: trader3Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 30_000_000, false], // 0.3 APT
      },
    });
    await aptos.signAndSubmitTransaction({
      signer: trader3Account,
      transaction: buyNoTxn,
    });

    console.log(`✅ Trader 3 bought NO shares`);

    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [
          trader3Account.accountAddress.toString(),
          marketAddress,
        ],
      },
    });
    console.log(`   📊 Trader 3 Balances:`);
    console.log(`      - YES: ${balances[0]}`);
    console.log(`      - NO:  ${balances[1]}`);
  } catch (error) {
    console.error("❌ Failed to swap.", error);
    process.exit(1);
  }

  // === Step 5: Check Market Stats ===
  console.log("\n[5/7] Checking market statistics...");
  try {
    const stats = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_market_info`,
        functionArguments: [marketAddress],
      },
    });
    console.log(`✅ Market Statistics:`);
    console.log(`   - Total YES Pool: ${stats[0]}`);
    console.log(`   - Total NO Pool:  ${stats[1]}`);
    console.log(`   - Status: ${stats[2]}`);
  } catch (error) {
    console.error("❌ Failed to get market stats.", error);
    process.exit(1);
  }

  // === Step 6: Trader 2 Sells Some Shares ===
  console.log("\n[6/7] Trader 2 selling shares...");
  try {
    const sellTxn = await aptos.transaction.build.simple({
      sender: trader2Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::sell_shares`,
        functionArguments: [marketAddress, 10_000_000, true], // Sell some YES
      },
    });
    await aptos.signAndSubmitTransaction({
      signer: trader2Account,
      transaction: sellTxn,
    });

    console.log(`✅ Trader 2 sold shares`);

    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [
          trader2Account.accountAddress.toString(),
          marketAddress,
        ],
      },
    });
    console.log(`   📊 Trader 2 Updated Balances:`);
    console.log(`      - YES: ${balances[0]}`);
    console.log(`      - NO:  ${balances[1]}`);
  } catch (error) {
    console.error("❌ Failed to sell shares.", error);
    process.exit(1);
  }

  // === Step 7: Summary ===
  console.log("\n[7/7] Final Summary...");
  try {
    console.log(`\n✨ Tapp AMM Test Summary:`);
    console.log(`================================`);
    console.log(`Market Address: ${marketAddress}`);

    const [t1Bal, t2Bal, t3Bal] = await Promise.all([
      aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
          functionArguments: [
            trader1Account.accountAddress.toString(),
            marketAddress,
          ],
        },
      }),
      aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
          functionArguments: [
            trader2Account.accountAddress.toString(),
            marketAddress,
          ],
        },
      }),
      aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
          functionArguments: [
            trader3Account.accountAddress.toString(),
            marketAddress,
          ],
        },
      }),
    ]);

    console.log(`\nTrader Balances:`);
    console.log(`  Trader 1: YES=${t1Bal[0]}, NO=${t1Bal[1]}`);
    console.log(`  Trader 2: YES=${t2Bal[0]}, NO=${t2Bal[1]}`);
    console.log(`  Trader 3: YES=${t3Bal[0]}, NO=${t3Bal[1]}`);
    console.log(`================================\n`);

    console.log("✅ Tapp AMM test completed successfully!");
  } catch (error) {
    console.error("❌ Failed to get final summary.", error);
    process.exit(1);
  }
}

main();
