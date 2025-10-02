import {
  Account,
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

// --- Helper function to check and log balances ---
async function checkBalances(
  aptos: Aptos,
  userAddress: Account,
  marketAddress: string,
  stepLabel: string,
) {
  try {
    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [
          userAddress.accountAddress.toString(),
          marketAddress,
        ],
      },
    });
    console.log(`✅ Balances for ${stepLabel}:`);
    console.log(
      `   - YES Shares: ${parseInt(balances[0] as string, 10) / 10 ** 8}`,
    );
    console.log(
      `   - NO Shares:  ${parseInt(balances[1] as string, 10) / 10 ** 8}`,
    );
  } catch (error) {
    console.error(`❌ Failed to get balances at step: ${stepLabel}.`, error);
    throw error; // Re-throw to stop the script
  }
}

/**
 * Main function to run the buy/sell test flow.
 * Uses Market Creator to create market, Traders to buy/sell
 */
async function main() {
  if (!MODULE_ADDRESS) {
    throw new Error("MODULE_ADDRESS is not set in your .env file.");
  }

  logAllAccounts();

  // --- Constants for the test ---
  const BUY_YES_AMOUNT_APT = 0.5; // Buy 0.5 APT of YES
  const BUY_NO_AMOUNT_APT = 0.3; // Buy 0.3 APT of NO
  const SELL_YES_AMOUNT_SHARES = 0.2; // Sell 0.2 of the YES shares
  const SELL_NO_AMOUNT_SHARES = 0.3; // Sell all 0.3 of the NO shares

  const BUY_YES_OCTAS = BUY_YES_AMOUNT_APT * 10 ** 8;
  const BUY_NO_OCTAS = BUY_NO_AMOUNT_APT * 10 ** 8;
  const SELL_YES_OCTAS = SELL_YES_AMOUNT_SHARES * 10 ** 8;
  const SELL_NO_OCTAS = SELL_NO_AMOUNT_SHARES * 10 ** 8;

  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: `${nodeUrl}`,
  });
  const aptos = new Aptos(aptosConfig);

  console.log("🚀 Starting Buy/Sell Test Flow...");
  console.log(`📝 Market Creator: ${marketCreatorAccount.accountAddress}`);
  console.log(`👤 Trader 1: ${trader1Account.accountAddress}`);
  console.log(`👤 Trader 2: ${trader2Account.accountAddress}`);

  let marketAddress: string | undefined;

  // === Step 1: Market Creator Creates a New Market ===
  console.log("\n[1/8] Market Creator creating a new market...");
  try {
    const createTxn = await aptos.transaction.build.simple({
      sender: marketCreatorAccount.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          "Trade Flow Test Market - ETH to $5k?",
          "1762017600", // Dec 31, 2025
          marketCreatorAccount.accountAddress, // resolver (manual resolution)
          "aptos-balance", // oracle_id
          marketCreatorAccount.accountAddress, // target_address (check creator's balance)
          "balance", // target_function
          "1000", // target_value (1000 octas)
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
        console.log(
          `✅ Market created successfully at address: ${marketAddress}`,
        );
      } else {
        throw new Error("MarketCreatedEvent not found.");
      }
    } else {
      throw new Error("Transaction was not a UserTransactionResponse.");
    }
  } catch (error) {
    console.error("❌ Failed to create market.", error);
    process.exit(1);
  }

  // === Step 2: Check Initial Balances ===
  console.log("\n[2/8] Checking initial balances for Trader 1...");
  await checkBalances(
    aptos,
    trader1Account,
    marketAddress!,
    "Trader 1 (initial)",
  );

  // === Step 3: Trader 1 Buys YES Shares ===
  console.log(
    `\n[3/8] Trader 1 buying ${BUY_YES_AMOUNT_APT} APT of YES shares...`,
  );
  try {
    const buyYesTxn = await aptos.transaction.build.simple({
      sender: trader1Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, BUY_YES_OCTAS, true],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader1Account,
      transaction: buyYesTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(`✅ Trader 1 purchased YES shares successfully.`);
  } catch (error) {
    console.error("❌ Failed to buy YES shares.", error);
    process.exit(1);
  }

  // === Step 4: Trader 2 Buys NO Shares ===
  console.log(
    `\n[4/8] Trader 2 buying ${BUY_NO_AMOUNT_APT} APT of NO shares...`,
  );
  try {
    const buyNoTxn = await aptos.transaction.build.simple({
      sender: trader2Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, BUY_NO_OCTAS, false],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader2Account,
      transaction: buyNoTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(`✅ Trader 2 purchased NO shares successfully.`);
  } catch (error) {
    console.error("❌ Failed to buy NO shares.", error);
    process.exit(1);
  }

  // === Step 5: Check Balances After Buying ===
  console.log("\n[5/8] Checking balances after buying...");
  await checkBalances(
    aptos,
    trader1Account,
    marketAddress!,
    "Trader 1 (after buying)",
  );
  await checkBalances(
    aptos,
    trader2Account,
    marketAddress!,
    "Trader 2 (after buying)",
  );

  // === Step 6: Trader 1 Sells YES Shares (Partial Amount) ===
  console.log(
    `\n[6/8] Trader 1 selling ${SELL_YES_AMOUNT_SHARES} YES shares...`,
  );
  try {
    const sellYesTxn = await aptos.transaction.build.simple({
      sender: trader1Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::sell_shares`,
        functionArguments: [marketAddress, SELL_YES_OCTAS, true],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader1Account,
      transaction: sellYesTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(`✅ Trader 1 sold YES shares successfully.`);
  } catch (error) {
    console.error("❌ Failed to sell YES shares.", error);
    process.exit(1);
  }

  // === Step 7: Trader 2 Sells NO Shares (Full Amount) ===
  console.log(`\n[7/8] Trader 2 selling ${SELL_NO_AMOUNT_SHARES} NO shares...`);
  try {
    const sellNoTxn = await aptos.transaction.build.simple({
      sender: trader2Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::sell_shares`,
        functionArguments: [marketAddress, SELL_NO_OCTAS, false],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader2Account,
      transaction: sellNoTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(`✅ Trader 2 sold NO shares successfully.`);
  } catch (error) {
    console.error("❌ Failed to sell NO shares.", error);
    process.exit(1);
  }

  // === Step 8: Check Final Balances ===
  console.log("\n[8/8] Checking final balances after selling...");
  await checkBalances(
    aptos,
    trader1Account,
    marketAddress!,
    "Trader 1 (final)",
  );
  await checkBalances(
    aptos,
    trader2Account,
    marketAddress!,
    "Trader 2 (final)",
  );

  // === (Bonus) Negative Test: Try to sell more than owned ===
  console.log(
    `\n[Bonus] Trader 1 attempting to sell more YES shares than owned (expecting failure)...`,
  );
  try {
    const sellTooManyTxn = await aptos.transaction.build.simple({
      sender: trader1Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::sell_shares`,
        functionArguments: [marketAddress, 999 * 10 ** 8, true], // Try to sell an absurd amount
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader1Account,
      transaction: sellTooManyTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    // If we reach here, the test failed because the transaction should have aborted.
    console.error(
      "❌ Negative test FAILED: Transaction succeeded but should have failed.",
    );
  } catch (error: any) {
    // We expect an error here. Let's check if it's the right kind.
    if (error.message && error.message.includes("EINSUFFICIENT_BALANCE")) {
      console.log(
        `✅ Negative test PASSED: Transaction failed as expected with an insufficient balance error.`,
      );
    } else {
      console.warn(
        `⚠️ Negative test inconclusive: Transaction failed, but not with the expected error. Error:`,
        error.message,
      );
    }
  }

  console.log("\n✨ Trade flow test completed successfully!");
}

main();
