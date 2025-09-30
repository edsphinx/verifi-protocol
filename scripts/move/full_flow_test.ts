import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  isUserTransactionResponse,
  type Network,
} from "@aptos-labs/ts-sdk";
import { networkName, nodeUrl, privateKey } from "./_config";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

/**
 * Main function to run the full e2e test flow.
 */
async function main() {
  if (!privateKey || !MODULE_ADDRESS) {
    throw new Error("Required variables are not set in your .env file.");
  }

  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: `${nodeUrl}/v1`,
  });
  const aptos = new Aptos(aptosConfig);

  // For this test, we'll use the publisher account as the "user"
  const userPrivateKey = new Ed25519PrivateKey(privateKey);
  const userAccount = Account.fromPrivateKey({ privateKey: userPrivateKey });
  const userAddress = userAccount.accountAddress;

  console.log("🚀 Starting Full End-to-End Test Flow...");
  console.log(`- Using Account: ${userAddress.toString()}`);

  let marketAddress: string | undefined;

  // === Step 1: Create a New Market ===
  console.log("\n[1/5] Creating a new market...");
  try {
    const createTxn = await aptos.transaction.build.simple({
      sender: userAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          "E2E Test Market",
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
        throw new Error("MarketCreatedEvent not found in transaction events.");
      }
    } else {
      throw new Error("Transaction was not a UserTransactionResponse.");
    }
  } catch (error) {
    console.error("❌ Failed to create market.", error);
    process.exit(1);
  }

  // === Step 2: Check Initial Balances ===
  console.log("\n[2/5] Checking initial balances...");
  try {
    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [userAddress.toString(), marketAddress],
      },
    });
    console.log(`✅ Balances for user ${userAddress.toString()}:`);
    console.log(`   - YES Shares: ${balances[0]}`);
    console.log(`   - NO Shares:  ${balances[1]}`);
  } catch (error) {
    console.error("❌ Failed to get balances.", error);
    process.exit(1);
  }

  // === Step 3: Buy YES Shares ===
  console.log("\n[3/5] Buying 0.1 APT of YES shares...");
  try {
    const buyYesTxn = await aptos.transaction.build.simple({
      sender: userAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 10_000_000, true], // 0.1 APT
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

  console.log("\n[4/5] Buying 0.2 APT of NO shares...");
  try {
    const buyNoTxn = await aptos.transaction.build.simple({
      sender: userAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 20_000_000, false], // 0.2 APT
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

  // === Step 5: Check Final Balances ===
  console.log("\n[5/5] Checking final balances...");
  try {
    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [userAddress.toString(), marketAddress],
      },
    });
    console.log(`✅ Balances for user ${userAddress.toString()}:`);
    console.log(`   - YES Shares: ${balances[0]}`);
    console.log(`   - NO Shares:  ${balances[1]}`);
  } catch (error) {
    console.error("❌ Failed to get balances.", error);
    process.exit(1);
  }

  console.log("\n✨ Full flow test completed successfully!");
}

main();
