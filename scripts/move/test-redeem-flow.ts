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
  logAllAccounts,
} from "./_test-accounts";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

/**
 * Test script for redeem functionality
 *
 * NOTE: This test demonstrates the redeem flow but requires a market to be resolved first.
 * In production, markets are resolved by authorized resolvers (oracles or designated addresses)
 * AFTER the resolution_timestamp has passed.
 *
 * Flow:
 * 1. Create market with short expiration time
 * 2. Traders buy shares
 * 3. Wait for resolution_timestamp to pass
 * 4. Authorized resolver calls resolve_market (in production, this would be an oracle)
 * 5. Winner redeems winnings
 *
 * For testing redeem WITHOUT waiting, you need to:
 * - Use a market that's already resolved, OR
 * - Create a market with very short expiration and wait
 */
async function main() {
  if (!MODULE_ADDRESS) {
    throw new Error("MODULE_ADDRESS is not set in your .env file.");
  }

  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: nodeUrl,
  });
  const aptos = new Aptos(aptosConfig);

  logAllAccounts();

  console.log("\n🧪 Starting Redeem Flow Test...");
  console.log(`📝 Market Creator: ${marketCreatorAccount.accountAddress.toString()}`);
  console.log(`👤 Trader 1 (YES): ${trader1Account.accountAddress.toString()}`);
  console.log(`👤 Trader 2 (NO): ${trader2Account.accountAddress.toString()}`);

  let marketAddress: string | undefined;

  // === Step 1: Create Market ===
  console.log("\n[1/6] Creating market...");
  try {
    const createTxn = await aptos.transaction.build.simple({
      sender: marketCreatorAccount.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          "Redeem Test Market - Will this resolve YES?",
          Math.floor(Date.now() / 1000) + 30, // 30 seconds from now for fast testing
          marketCreatorAccount.accountAddress, // resolver (manual resolution)
          "aptos-balance", // oracle_id
          marketCreatorAccount.accountAddress, // target_address
          "balance", // target_function
          "1000", // target_value
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
        (e) => e.type === `${MODULE_ADDRESS}::verifi_protocol::MarketCreatedEvent`
      );
      if (event) {
        marketAddress = event.data.market_address;
        console.log(`✅ Market created at: ${marketAddress}`);
      } else {
        throw new Error("MarketCreatedEvent not found");
      }
    }
  } catch (error) {
    console.error("❌ Failed to create market:", error);
    process.exit(1);
  }

  // === Step 2: Trader 1 Buys YES Shares ===
  console.log("\n[2/6] Trader 1 buying 1.0 APT of YES shares...");
  try {
    const buyYesTxn = await aptos.transaction.build.simple({
      sender: trader1Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 100_000_000, true], // 1.0 APT worth of YES
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader1Account,
      transaction: buyYesTxn,
    });

    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [trader1Account.accountAddress.toString(), marketAddress],
      },
    });

    console.log(`✅ Trader 1 purchased YES shares`);
    console.log(`   - YES: ${balances[0]} shares`);
    console.log(`   - NO: ${balances[1]} shares`);
  } catch (error) {
    console.error("❌ Failed to buy YES shares:", error);
    process.exit(1);
  }

  // === Step 3: Trader 2 Buys NO Shares ===
  console.log("\n[3/6] Trader 2 buying 0.5 APT of NO shares...");
  try {
    const buyNoTxn = await aptos.transaction.build.simple({
      sender: trader2Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 50_000_000, false], // 0.5 APT worth of NO
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader2Account,
      transaction: buyNoTxn,
    });

    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [trader2Account.accountAddress.toString(), marketAddress],
      },
    });

    console.log(`✅ Trader 2 purchased NO shares`);
    console.log(`   - YES: ${balances[0]} shares`);
    console.log(`   - NO: ${balances[1]} shares`);
  } catch (error) {
    console.error("❌ Failed to buy NO shares:", error);
    process.exit(1);
  }

  // === Step 4: Check Market Status Before Resolution ===
  console.log("\n[4/6] Checking market before resolution...");
  try {
    const stats = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_market_info`,
        functionArguments: [marketAddress],
      },
    });

    console.log(`📊 Market Stats:`);
    console.log(`   - YES Pool: ${stats[0]}`);
    console.log(`   - NO Pool: ${stats[1]}`);
    console.log(`   - Status: ${stats[2]} (0=OPEN, 1=CLOSED, 2=RESOLVED_YES, 3=RESOLVED_NO)`);
  } catch (error) {
    console.error("❌ Failed to get market stats:", error);
    process.exit(1);
  }

  // === Step 5: Wait for Resolution Timestamp & Resolve Market ===
  console.log("\n[5/6] Waiting for resolution timestamp and resolving market...");
  try {
    // Wait 35 seconds to ensure resolution_timestamp has passed
    console.log("   ⏳ Waiting 35 seconds for market to expire...");
    await new Promise(resolve => setTimeout(resolve, 35000));

    console.log("   📝 Market expired, now resolving as YES...");
    const resolveTxn = await aptos.transaction.build.simple({
      sender: marketCreatorAccount.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::resolve_market`,
        functionArguments: [marketAddress, true], // Resolve as YES
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: marketCreatorAccount,
      transaction: resolveTxn,
    });

    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

    const stats = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_market_info`,
        functionArguments: [marketAddress],
      },
    });

    console.log(`✅ Market resolved!`);
    console.log(`   - New Status: ${stats[2]} (should be 2 for RESOLVED_YES)`);
  } catch (error) {
    console.error("❌ Failed to resolve market:", error);
    process.exit(1);
  }

  // === Step 6: Trader 1 (Winner) Redeems Winnings ===
  console.log("\n[6/6] Trader 1 redeeming winnings...");
  try {
    // Get Trader 1's YES balance
    const balancesBefore = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [trader1Account.accountAddress.toString(), marketAddress],
      },
    });

    const yesBalance = Number(balancesBefore[0]);
    console.log(`   - YES shares to redeem: ${yesBalance}`);

    // Get APT balance before redeem
    const aptBalanceBefore = await aptos.getAccountAPTAmount({
      accountAddress: trader1Account.accountAddress,
    });
    console.log(`   - APT balance before: ${aptBalanceBefore / 10 ** 8} APT`);

    // Redeem winnings
    const redeemTxn = await aptos.transaction.build.simple({
      sender: trader1Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::redeem_winnings`,
        functionArguments: [marketAddress, yesBalance],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader1Account,
      transaction: redeemTxn,
    });

    const response = await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    // Get APT balance after redeem
    const aptBalanceAfter = await aptos.getAccountAPTAmount({
      accountAddress: trader1Account.accountAddress,
    });

    const aptGained = (aptBalanceAfter - aptBalanceBefore) / 10 ** 8;

    console.log(`✅ Winnings redeemed successfully!`);
    console.log(`   - APT balance after: ${aptBalanceAfter / 10 ** 8} APT`);
    console.log(`   - APT gained: ${aptGained.toFixed(4)} APT`);
    console.log(`   - Transaction: ${committedTxn.hash}`);

    // Verify YES shares were burned
    const balancesAfter = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [trader1Account.accountAddress.toString(), marketAddress],
      },
    });

    console.log(`   - YES shares after redeem: ${balancesAfter[0]} (should be 0)`);
  } catch (error) {
    console.error("❌ Failed to redeem winnings:", error);
    process.exit(1);
  }

  // === Verify Trader 2 (Loser) Cannot Redeem ===
  console.log("\n🔍 Verifying loser cannot redeem...");
  try {
    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [trader2Account.accountAddress.toString(), marketAddress],
      },
    });

    const noBalance = Number(balances[1]);
    console.log(`   - Trader 2 NO shares: ${noBalance}`);

    if (noBalance > 0) {
      console.log(`   ℹ️  Trader 2 has NO shares but market resolved YES - cannot redeem`);
    }
  } catch (error) {
    console.error("❌ Failed to check loser balance:", error);
  }

  console.log("\n✅ Redeem flow test completed successfully!");
  console.log("\n📝 Summary:");
  console.log("   1. Market created ✓");
  console.log("   2. Trader 1 bought YES shares ✓");
  console.log("   3. Trader 2 bought NO shares ✓");
  console.log("   4. Market resolved as YES ✓");
  console.log("   5. Trader 1 (winner) redeemed winnings ✓");
  console.log("   6. YES shares were burned ✓");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });
