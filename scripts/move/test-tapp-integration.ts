/**
 * Tapp-VeriFi Full Integration Test
 *
 * This test validates the COMPLETE integration between VeriFi Protocol and Tapp AMM.
 * It uses the actual Tapp router functions (create_pool, add_liquidity, swap) to verify
 * that the prediction hook works correctly with VeriFi markets.
 *
 * Test Flow:
 * 1. Create a VeriFi prediction market
 * 2. Get YES/NO token addresses from the market
 * 3. Buy YES/NO shares from VeriFi (to have tokens for liquidity)
 * 4. Create a Tapp AMM pool using prediction hook
 * 5. Add liquidity to the Tapp pool
 * 6. Execute swaps (YES → NO) via Tapp AMM
 * 7. Verify all functions work correctly
 */

import {
  Aptos,
  AptosConfig,
  isUserTransactionResponse,
  type Network,
  AccountAddress,
  Serializer,
} from "@aptos-labs/ts-sdk";
import { networkName, nodeUrl } from "./_config";
import {
  publisherAccount,
  marketCreatorAccount,
  trader1Account,
  trader2Account,
  trader3Account,
  logAllAccounts,
} from "./_test-accounts";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;
const TAPP_ADDRESS =
  process.env.NEXT_PUBLIC_TAPP_PROTOCOL_ADDRESS || MODULE_ADDRESS;

// Tapp constants
const HOOK_PREDICTION = 4;
const BASE_FEE = 3000n; // 0.3% (fee is in basis points: 3000 = 0.3%) - BigInt for u64

/**
 * Helper to serialize create_pool arguments for Tapp
 * Following the format from tapp/tests/fixtures.move:
 * - hook_type: u8
 * - assets: vector<address>
 * - fee: u64
 */
function serializeCreatePoolArgs(
  hookType: number,
  yesTokenAddr: string,
  noTokenAddr: string,
  fee: bigint,
): Uint8Array {
  const serializer = new Serializer();
  serializer.serializeU8(hookType);

  // Vector of addresses for router
  const addresses = [
    AccountAddress.from(yesTokenAddr),
    AccountAddress.from(noTokenAddr),
  ];
  serializer.serializeVector(addresses);

  serializer.serializeU64(fee);
  return serializer.toUint8Array();
}

/**
 * Helper to serialize add_liquidity arguments for Tapp
 * Format: pool_addr + Option<address> + [yes_amount, no_amount] for hook
 */
function serializeAddLiquidityArgs(
  poolAddr: string,
  amountYes: bigint,
  amountNo: bigint,
): Uint8Array {
  const serializer = new Serializer();

  // Arguments for router
  serializer.serializeFixedBytes(AccountAddress.from(poolAddr).toUint8Array());
  serializer.serializeBool(false); // Option<address> = None

  // Arguments for hook (NO minLpTokens - hook doesn't read it)
  serializer.serializeU64(amountYes);
  serializer.serializeU64(amountNo);

  return serializer.toUint8Array();
}

/**
 * Helper to serialize swap arguments for Tapp
 * Format: pool_addr + [amount_in, yes_to_no, min_amount_out] for hook
 * CRITICAL: Hook expects amount_in FIRST, then yes_to_no boolean
 */
function serializeSwapArgs(
  poolAddr: string,
  yesToNo: boolean,
  amountIn: bigint,
  minAmountOut: bigint,
): Uint8Array {
  const serializer = new Serializer();

  // Argument for router
  serializer.serializeFixedBytes(AccountAddress.from(poolAddr).toUint8Array());

  // Arguments for hook (CORRECT ORDER!)
  serializer.serializeU64(amountIn);      // 1. amount_in (u64)
  serializer.serializeBool(yesToNo);      // 2. yes_to_no (bool)
  serializer.serializeU64(minAmountOut);  // 3. min_amount_out (u64)

  return serializer.toUint8Array();
}

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

  console.log(" Starting Tapp-VeriFi FULL Integration Test...");
  console.log("=".repeat(60));
  console.log(` Market Creator: ${marketCreatorAccount.accountAddress}`);
  console.log(`💧 Liquidity Provider: ${trader1Account.accountAddress}`);
  console.log(`🔄 Swapper: ${trader2Account.accountAddress}`);
  console.log(`🌐 VeriFi Module: ${MODULE_ADDRESS}`);
  console.log(`🌐 Tapp Module: ${TAPP_ADDRESS}`);
  console.log("=".repeat(60) + "\n");

  let marketAddress: string | undefined;
  let yesTokenAddr: string | undefined;
  let noTokenAddr: string | undefined;
  let poolAddress: string | undefined;

  // === Step 0: Check and register oracle if needed ===
  console.log("[0/8] Checking oracle registration...");
  try {
    // Check if oracle exists
    const oracleExists = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::oracle_registry::oracle_exists`,
        functionArguments: ["aptos-balance"],
      },
    });

    if (!oracleExists[0]) {
      console.log("  Oracle 'aptos-balance' not found. Registering...");
      const registerTxn = await aptos.transaction.build.simple({
        sender: publisherAccount.accountAddress,
        data: {
          function: `${MODULE_ADDRESS}::oracle_registry::register_oracle`,
          functionArguments: ["aptos-balance", "Aptos Balance Oracle"],
        },
      });
      const committedTxn = await aptos.signAndSubmitTransaction({
        signer: publisherAccount,
        transaction: registerTxn,
      });
      await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
      console.log(" Oracle registered successfully");
    } else {
      // Oracle exists, check if it's active
      const isActive = await aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::oracle_registry::is_oracle_active`,
          functionArguments: ["aptos-balance"],
        },
      });

      if (!isActive[0]) {
        console.log(
          "  Oracle 'aptos-balance' exists but is not active. Activating...",
        );
        const activateTxn = await aptos.transaction.build.simple({
          sender: publisherAccount.accountAddress,
          data: {
            function: `${MODULE_ADDRESS}::oracle_registry::set_oracle_status`,
            functionArguments: ["aptos-balance", true],
          },
        });
        const committedTxn = await aptos.signAndSubmitTransaction({
          signer: publisherAccount,
          transaction: activateTxn,
        });
        await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
        console.log(" Oracle activated successfully");
      } else {
        console.log(" Oracle 'aptos-balance' is already active");
      }
    }
  } catch (error: any) {
    console.error(
      " Failed to check/register oracle:",
      error.message || error,
    );
    process.exit(1);
  }

  // === Step 1: Create VeriFi Market ===
  console.log("\n[1/8] Creating VeriFi prediction market...");
  try {
    const createTxn = await aptos.transaction.build.simple({
      sender: marketCreatorAccount.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          "Tapp Integration Test - Will ETH hit $10k by 2026?",
          "1762017600", // Dec 31, 2025
          marketCreatorAccount.accountAddress,
          "aptos-balance",
          marketCreatorAccount.accountAddress,
          "balance",
          "1000",
          0,
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
        console.log(` Market created: ${marketAddress}`);
        console.log(
          `   TX: https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=${networkName}`,
        );
      }
    }
  } catch (error: any) {
    console.error(" Failed to create market:", error.message || error);
    process.exit(1);
  }

  // === Step 2: Get YES/NO Token Addresses ===
  console.log("\n[2/8] Getting YES/NO token addresses from market...");
  try {
    const tokens = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_market_tokens`,
        functionArguments: [marketAddress],
      },
    });

    // Debug: log the raw response
    console.log(`    Raw tokens response:`, JSON.stringify(tokens, null, 2));

    // tokens might be objects with inner field, extract the actual address
    const yesToken = tokens[0];
    const noToken = tokens[1];
    let yesAddr =
      typeof yesToken === "string"
        ? yesToken
        : (yesToken as any)?.inner || yesToken?.toString() || "";
    let noAddr =
      typeof noToken === "string"
        ? noToken
        : (noToken as any)?.inner || noToken?.toString() || "";

    // Ensure addresses are padded to 64 hex characters
    const padAddress = (addr: string): string => {
      const hex = addr.replace("0x", "");
      return "0x" + hex.padStart(64, "0");
    };

    yesTokenAddr = padAddress(yesAddr);
    noTokenAddr = padAddress(noAddr);

    console.log(` YES Token: ${yesTokenAddr}`);
    console.log(` NO Token:  ${noTokenAddr}`);
  } catch (error: any) {
    console.error(" Failed to get market tokens:", error.message || error);
    process.exit(1);
  }

  // === Step 3: Buy YES/NO Shares (to have tokens for liquidity) ===
  console.log("\n[3/8] Trader 1 buying YES/NO shares for liquidity...");
  try {
    // Buy 0.05 APT worth of YES (more liquidity for swaps)
    const buyYesTxn = await aptos.transaction.build.simple({
      sender: trader1Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 5_000_000, true], // 0.05 APT
      },
    });
    const yesCommit = await aptos.signAndSubmitTransaction({
      signer: trader1Account,
      transaction: buyYesTxn,
    });
    await aptos.waitForTransaction({ transactionHash: yesCommit.hash });
    console.log(`    Bought YES shares`);

    // Wait a bit before next transaction
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Buy 0.05 APT worth of NO
    const buyNoTxn = await aptos.transaction.build.simple({
      sender: trader1Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 5_000_000, false], // 0.05 APT
      },
    });
    const noCommit = await aptos.signAndSubmitTransaction({
      signer: trader1Account,
      transaction: buyNoTxn,
    });
    await aptos.waitForTransaction({ transactionHash: noCommit.hash });
    console.log(`    Bought NO shares`);

    console.log(` Trader 1 bought 0.05 APT of YES and 0.05 APT of NO shares`);

    // Check balances
    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [
          trader1Account.accountAddress.toString(),
          marketAddress,
        ],
      },
    });
    console.log(`    Balances: YES=${balances[0]}, NO=${balances[1]}`);
  } catch (error: any) {
    console.error(" Failed to buy shares:", error.message || error);
    process.exit(1);
  }

  // === Step 4: Create Tapp AMM Pool ===
  console.log("\n[4/8] Creating Tapp AMM pool with prediction hook...");

  // First, verify the market exists in get_all_market_addresses
  console.log("    Verifying market is in registry...");
  try {
    const allMarketsResult = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_all_market_addresses`,
        functionArguments: [],
      },
    });

    // The result is wrapped in an array
    const allMarkets = (allMarketsResult as any[])[0] || [];
    console.log(`    Total markets in registry: ${allMarkets.length}`);
    console.log(`   📍 Our market address: ${marketAddress}`);

    console.log(`    Checking each market's tokens:`);
    for (let i = 0; i < allMarkets.length; i++) {
      const mktAddr = allMarkets[i];
      const isOurs = mktAddr === marketAddress;
      console.log(`      [${i}] ${mktAddr} ${isOurs ? "👈 OURS" : ""}`);

      // Check tokens for this market
      try {
        const tokensResult = await aptos.view({
          payload: {
            function: `${MODULE_ADDRESS}::verifi_protocol::get_market_tokens`,
            functionArguments: [mktAddr],
          },
        });
        const yesT = (tokensResult[0] as any)?.inner || tokensResult[0];
        const noT = (tokensResult[1] as any)?.inner || tokensResult[1];

        const yesMatch = yesT === yesTokenAddr;
        const noMatch = noT === noTokenAddr;

        console.log(`          YES: ${yesT} ${yesMatch ? "" : ""}`);
        console.log(`          NO:  ${noT} ${noMatch ? "" : ""}`);
      } catch (e: any) {
        console.log(`           Could not get tokens: ${e.message}`);
      }
    }

    const marketFound = allMarkets.includes(marketAddress);
    console.log(
      `   ${marketFound ? "" : ""} Market ${marketFound ? "FOUND" : "NOT FOUND"} in address list`,
    );
  } catch (e: any) {
    console.log(`     Could not verify market registry: ${e.message}`);
  }

  try {
    const poolArgs = serializeCreatePoolArgs(
      HOOK_PREDICTION,
      yesTokenAddr!,
      noTokenAddr!,
      BASE_FEE,
    );

    console.log(`   🔧 Creating pool with:`);
    console.log(`      Hook Type: ${HOOK_PREDICTION}`);
    console.log(`      YES Token: ${yesTokenAddr}`);
    console.log(`      NO Token:  ${noTokenAddr}`);
    console.log(`      Fee: ${BASE_FEE}`);

    // Debug: Verify token addresses are properly padded
    const yesHex = yesTokenAddr!.replace("0x", "");
    const noHex = noTokenAddr!.replace("0x", "");
    console.log(
      `      YES Token length: ${yesHex.length} hex chars (should be 64)`,
    );
    console.log(
      `      NO Token length:  ${noHex.length} hex chars (should be 64)`,
    );

    if (yesHex.length !== 64 || noHex.length !== 64) {
      console.log(`        WARNING: Token addresses are not properly padded!`);
    }

    const createPoolTxn = await aptos.transaction.build.simple({
      sender: trader1Account.accountAddress,
      data: {
        function: `${TAPP_ADDRESS}::router::create_pool`,
        functionArguments: [poolArgs],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader1Account,
      transaction: createPoolTxn,
    });
    const response = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    if (isUserTransactionResponse(response)) {
      const event = response.events.find(
        (e) => e.type === `${TAPP_ADDRESS}::router::PoolCreated`,
      );
      if (event) {
        poolAddress = event.data.pool_addr;
        console.log(` Tapp AMM Pool created: ${poolAddress}`);
        console.log(`   Hook Type: ${event.data.hook_type}`);
        console.log(`   Assets: [${event.data.assets}]`);
        console.log(
          `   TX: https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=${networkName}`,
        );
      }
    }
  } catch (error: any) {
    console.error(" Failed to create Tapp pool:", error.message || error);
    console.error(
      "   This is the CRITICAL test - if this fails, Tapp-VeriFi integration is not working",
    );
    process.exit(1);
  }

  // === Step 5: Add Liquidity to Tapp Pool ===
  console.log("\n[5/8] Adding liquidity to Tapp AMM pool...");
  try {
    const liquidityArgs = serializeAddLiquidityArgs(
      poolAddress!,
      4_000_000n, // 0.04 APT worth of YES (BigInt for u64) - more liquidity for swaps
      4_000_000n, // 0.04 APT worth of NO (BigInt for u64)
    );

    const addLiqTxn = await aptos.transaction.build.simple({
      sender: trader1Account.accountAddress,
      data: {
        function: `${TAPP_ADDRESS}::router::add_liquidity`,
        functionArguments: [liquidityArgs],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader1Account,
      transaction: addLiqTxn,
    });
    const response = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    if (isUserTransactionResponse(response)) {
      const event = response.events.find(
        (e) => e.type === `${TAPP_ADDRESS}::router::LiquidityAdded`,
      );
      if (event) {
        console.log(` Liquidity added successfully`);
        console.log(`   Position Index: ${event.data.position_idx}`);
        console.log(`   Amounts: [${event.data.amounts}]`);
        console.log(
          `   TX: https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=${networkName}`,
        );
      }
    }
  } catch (error: any) {
    console.error(" Failed to add liquidity:", error.message || error);
    process.exit(1);
  }

  // === Step 6: Trader 2 Buys Shares for Swapping ===
  console.log("\n[6/8] Trader 2 buying shares to swap in Tapp AMM...");
  try {
    // Buy YES shares for swapping (reduced amount)
    const buyYesTxn = await aptos.transaction.build.simple({
      sender: trader2Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 1_000_000, true], // 0.01 APT of YES
      },
    });
    const yesCommit = await aptos.signAndSubmitTransaction({
      signer: trader2Account,
      transaction: buyYesTxn,
    });
    await aptos.waitForTransaction({ transactionHash: yesCommit.hash });
    console.log(`    Bought YES shares`);

    // Small NO purchase to initialize primary store for receiving NO from swap
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const buyNoTxn = await aptos.transaction.build.simple({
      sender: trader2Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 10_000, false], // 0.0001 APT of NO (minimal)
      },
    });
    const noCommit = await aptos.signAndSubmitTransaction({
      signer: trader2Account,
      transaction: buyNoTxn,
    });
    await aptos.waitForTransaction({ transactionHash: noCommit.hash });
    console.log(`    Bought NO shares (to initialize store)`);

    console.log(` Trader 2 ready to swap YES → NO with 0.01 APT`);
  } catch (error: any) {
    console.error(" Failed to buy shares:", error.message || error);
    process.exit(1);
  }

  // === Step 7: Execute Swap YES → NO via Tapp AMM ===
  console.log("\n[7/8] Executing swap YES → NO via Tapp AMM...");

  // Wait a bit before swap to avoid mempool issues
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Check Trader 2's balance first
  try {
    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [
          trader2Account.accountAddress.toString(),
          marketAddress,
        ],
      },
    });
    console.log(
      `    Trader 2 balances before swap: YES=${balances[0]}, NO=${balances[1]}`,
    );
  } catch (e: any) {
    console.log(`     Could not check balances: ${e.message}`);
  }

  try {
    // Use smaller amount for swap (100k tokens = 0.001 APT)
    const swapAmount = 100_000n; // 0.001 APT worth of YES tokens (BigInt for u64)
    console.log(`    Attempting to swap ${swapAmount} YES tokens (0.001 APT)...`);

    const swapArgs = serializeSwapArgs(
      poolAddress!,
      true, // YES to NO
      swapAmount,
      0n, // min amount out (BigInt for u64)
    );

    const swapTxn = await aptos.transaction.build.simple({
      sender: trader2Account.accountAddress,
      data: {
        function: `${TAPP_ADDRESS}::router::swap`,
        functionArguments: [swapArgs],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader2Account,
      transaction: swapTxn,
    });
    const response = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    if (isUserTransactionResponse(response)) {
      const event = response.events.find(
        (e) => e.type === `${TAPP_ADDRESS}::router::Swapped`,
      );
      if (event) {
        console.log(` Swap executed successfully via Tapp AMM!`);
        console.log(`   Amount In: ${event.data.amount_in}`);
        console.log(`   Amount Out: ${event.data.amount_out}`);
        console.log(
          `   TX: https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=${networkName}`,
        );
      }
    }
  } catch (error: any) {
    console.error(" Failed to swap YES → NO:", error.message || error);
    process.exit(1);
  }

  // === Step 8: Execute Swap NO → YES via Tapp AMM ===
  console.log("\n[8/8] Executing swap NO → YES via Tapp AMM...");

  // Wait a bit before swap to avoid mempool issues
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Check Trader 3's balance first
  try {
    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [
          trader3Account.accountAddress.toString(),
          marketAddress,
        ],
      },
    });
    console.log(
      `    Trader 3 balances before swap: YES=${balances[0]}, NO=${balances[1]}`,
    );
  } catch (e: any) {
    console.log(`     Could not check balances: ${e.message}`);
  }

  try {
    // First, Trader 3 needs to buy some NO tokens
    console.log("    Trader 3 buying NO shares first...");
    const buyNoTxn = await aptos.transaction.build.simple({
      sender: trader3Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 1_000_000n, false], // 0.01 APT of NO tokens
      },
    });
    const buyNoResponse = await aptos.signAndSubmitTransaction({
      signer: trader3Account,
      transaction: buyNoTxn,
    });
    await aptos.waitForTransaction({ transactionHash: buyNoResponse.hash });
    console.log("    Bought NO shares");

    // Now swap NO → YES (smaller amount to avoid balance issues)
    const swapAmount = 100_000n; // 0.001 APT worth of NO tokens (BigInt for u64)
    console.log(`    Attempting to swap ${swapAmount} NO tokens to YES...`);

    const swapArgs = serializeSwapArgs(
      poolAddress!,
      false, // NO to YES (reverse direction)
      swapAmount,
      0n, // min amount out (BigInt for u64)
    );

    const swapTxn = await aptos.transaction.build.simple({
      sender: trader3Account.accountAddress,
      data: {
        function: `${TAPP_ADDRESS}::router::swap`,
        functionArguments: [swapArgs],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader3Account,
      transaction: swapTxn,
    });
    const response = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    if (isUserTransactionResponse(response)) {
      const event = response.events.find(
        (e) => e.type === `${TAPP_ADDRESS}::router::Swapped`,
      );
      if (event) {
        console.log(` Swap NO → YES executed successfully via Tapp AMM!`);
        console.log(`   Amount In: ${event.data.amount_in}`);
        console.log(`   Amount Out: ${event.data.amount_out}`);
        console.log(
          `   TX: https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=${networkName}`,
        );
      }
    }
  } catch (error: any) {
    console.error(" Failed to swap NO → YES:", error.message || error);
    process.exit(1);
  }

  // === Final Summary ===
  console.log("\n" + "=".repeat(60));
  console.log(" TAPP-VERIFI INTEGRATION TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Market Address:     ${marketAddress}`);
  console.log(`YES Token:          ${yesTokenAddr}`);
  console.log(`NO Token:           ${noTokenAddr}`);
  console.log(`Tapp Pool Address:  ${poolAddress}`);
  console.log("=".repeat(60));
  console.log("\n SUCCESS! Tapp-VeriFi integration is FULLY FUNCTIONAL!\n");
  console.log("📋 Operations Validated:");
  console.log("   verifi_protocol::create_market");
  console.log("   verifi_protocol::get_market_tokens");
  console.log("   verifi_protocol::buy_shares");
  console.log("   tapp::router::create_pool (with prediction hook)");
  console.log("   tapp::router::add_liquidity");
  console.log("   tapp::router::swap");
  console.log(
    "\n All Tapp AMM functions work with VeriFi prediction markets!\n",
  );
}

main();
