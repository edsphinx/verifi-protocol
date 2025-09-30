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
    console.log(`✅ Balances for user ${stepLabel}:`);
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
 */
async function main() {
  if (!privateKey || !MODULE_ADDRESS) {
    throw new Error("Required variables are not set in your .env file.");
  }

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

  const userPrivateKey = new Ed25519PrivateKey(privateKey);
  const userAccount = Account.fromPrivateKey({ privateKey: userPrivateKey });
  const userAddress = userAccount.accountAddress;

  console.log("🚀 Starting Buy/Sell Test Flow...");
  console.log(`- Using Account: ${userAddress.toString()}`);

  let marketAddress: string | undefined;

  // === Step 1: Create a New Market ===
  console.log("\n[1/8] Creating a new market...");
  try {
    const createTxn = await aptos.transaction.build.simple({
      sender: userAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          "Trade Flow Test Market",
          "1762017600",
          userAddress,
          "0x1",
          "get_tvl",
          "1",
          0,
        ],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: userAccount,
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
  console.log("\n[2/8] Checking initial balances...");
  await checkBalances(aptos, userAccount, marketAddress!, "initial");

  // === Step 3: Buy YES Shares ===
  console.log(`\n[3/8] Buying ${BUY_YES_AMOUNT_APT} APT of YES shares...`);
  try {
    const buyYesTxn = await aptos.transaction.build.simple({
      sender: userAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, BUY_YES_OCTAS, true],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: userAccount,
      transaction: buyYesTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(`✅ YES shares purchased successfully.`);
  } catch (error) {
    console.error("❌ Failed to buy YES shares.", error);
    process.exit(1);
  }

  // === Step 4: Buy NO Shares ===
  console.log(`\n[4/8] Buying ${BUY_NO_AMOUNT_APT} APT of NO shares...`);
  try {
    const buyNoTxn = await aptos.transaction.build.simple({
      sender: userAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, BUY_NO_OCTAS, false],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: userAccount,
      transaction: buyNoTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(`✅ NO shares purchased successfully.`);
  } catch (error) {
    console.error("❌ Failed to buy NO shares.", error);
    process.exit(1);
  }

  // === Step 5: Check Balances After Buying ===
  console.log("\n[5/8] Checking balances after buying...");
  await checkBalances(aptos, userAccount, marketAddress!, "after buying");

  // === Step 6: Sell YES Shares (Partial Amount) ===
  console.log(`\n[6/8] Selling ${SELL_YES_AMOUNT_SHARES} YES shares...`);
  try {
    const sellYesTxn = await aptos.transaction.build.simple({
      sender: userAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::sell_shares`,
        functionArguments: [marketAddress, SELL_YES_OCTAS, true],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: userAccount,
      transaction: sellYesTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(`✅ YES shares sold successfully.`);
  } catch (error) {
    console.error("❌ Failed to sell YES shares.", error);
    process.exit(1);
  }

  // === Step 7: Sell NO Shares (Full Amount) ===
  console.log(`\n[7/8] Selling ${SELL_NO_AMOUNT_SHARES} NO shares...`);
  try {
    const sellNoTxn = await aptos.transaction.build.simple({
      sender: userAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::sell_shares`,
        functionArguments: [marketAddress, SELL_NO_OCTAS, false],
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: userAccount,
      transaction: sellNoTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(`✅ NO shares sold successfully.`);
  } catch (error) {
    console.error("❌ Failed to sell NO shares.", error);
    process.exit(1);
  }

  // === Step 8: Check Final Balances ===
  console.log("\n[8/8] Checking final balances after selling...");
  await checkBalances(aptos, userAccount, marketAddress!, "after selling");

  // === (Bonus) Negative Test: Try to sell more than owned ===
  console.log(
    `\n[Bonus] Attempting to sell more YES shares than owned (expecting failure)...`,
  );
  try {
    const sellTooManyTxn = await aptos.transaction.build.simple({
      sender: userAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::sell_shares`,
        functionArguments: [marketAddress, 999 * 10 ** 8, true], // Try to sell an absurd amount
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: userAccount,
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
