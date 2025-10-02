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
 * Main function to run the full e2e test flow.
 * Uses configured test accounts: Market Creator creates the market, Traders buy shares
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

  // Log all test accounts
  logAllAccounts();

  console.log("🚀 Starting Full End-to-End Test Flow...");
  console.log(
    `📝 Market Creator: ${marketCreatorAccount.accountAddress.toString()}`,
  );
  console.log(`👤 Trader 1: ${trader1Account.accountAddress.toString()}`);
  console.log(`👤 Trader 2: ${trader2Account.accountAddress.toString()}`);

  let marketAddress: string | undefined;

  // === Step 1: Market Creator Creates a New Market ===
  console.log("\n[1/6] Market Creator creating a new market...");
  try {
    const createTxn = await aptos.transaction.build.simple({
      sender: marketCreatorAccount.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          "E2E Test Market - Will APT reach $50?",
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
        throw new Error("MarketCreatedEvent not found in transaction events.");
      }
    } else {
      throw new Error("Transaction was not a UserTransactionResponse.");
    }
  } catch (error) {
    console.error("❌ Failed to create market.", error);
    process.exit(1);
  }

  // === Step 2: Trader 1 Buys YES Shares ===
  console.log("\n[2/6] Trader 1 buying 0.5 APT of YES shares...");
  try {
    const buyYesTxn = await aptos.transaction.build.simple({
      sender: trader1Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 50_000_000, true], // 0.5 APT
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader1Account,
      transaction: buyYesTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(`✅ Trader 1 purchased YES shares successfully.`);

    // Check balance
    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [
          trader1Account.accountAddress.toString(),
          marketAddress,
        ],
      },
    });
    console.log(`   📊 Trader 1 Balances:`);
    console.log(`      - YES Shares: ${balances[0]}`);
    console.log(`      - NO Shares:  ${balances[1]}`);
  } catch (error) {
    console.error("❌ Failed to buy YES shares.", error);
    process.exit(1);
  }

  // === Step 3: Trader 2 Buys NO Shares ===
  console.log("\n[3/6] Trader 2 buying 0.5 APT of NO shares...");
  try {
    const buyNoTxn = await aptos.transaction.build.simple({
      sender: trader2Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::buy_shares`,
        functionArguments: [marketAddress, 50_000_000, false], // 0.5 APT
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader2Account,
      transaction: buyNoTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(`✅ Trader 2 purchased NO shares successfully.`);

    // Check balance
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
    console.log(`      - YES Shares: ${balances[0]}`);
    console.log(`      - NO Shares:  ${balances[1]}`);
  } catch (error) {
    console.error("❌ Failed to buy NO shares.", error);
    process.exit(1);
  }

  // === Step 4: Trader 1 Sells Some YES Shares ===
  console.log("\n[4/6] Trader 1 selling some YES shares...");
  try {
    const sellYesTxn = await aptos.transaction.build.simple({
      sender: trader1Account.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::sell_shares`,
        functionArguments: [marketAddress, 10_000_000, true], // Sell 10M shares (units)
      },
    });
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: trader1Account,
      transaction: sellYesTxn,
    });
    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    console.log(`✅ Trader 1 sold YES shares successfully.`);

    // Check updated balance
    const balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [
          trader1Account.accountAddress.toString(),
          marketAddress,
        ],
      },
    });
    console.log(`   📊 Trader 1 Updated Balances:`);
    console.log(`      - YES Shares: ${balances[0]}`);
    console.log(`      - NO Shares:  ${balances[1]}`);
  } catch (error) {
    console.error("❌ Failed to sell YES shares.", error);
    process.exit(1);
  }

  // === Step 5: Check Market Stats ===
  console.log("\n[5/6] Checking market statistics...");
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

  // === Step 6: Get All Balances ===
  console.log("\n[6/6] Final balances for all traders...");
  try {
    const trader1Balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [
          trader1Account.accountAddress.toString(),
          marketAddress,
        ],
      },
    });
    const trader2Balances = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_balances`,
        functionArguments: [
          trader2Account.accountAddress.toString(),
          marketAddress,
        ],
      },
    });

    console.log(`✅ Final Balances:`);
    console.log(`   👤 Trader 1:`);
    console.log(`      - YES Shares: ${trader1Balances[0]}`);
    console.log(`      - NO Shares:  ${trader1Balances[1]}`);
    console.log(`   👤 Trader 2:`);
    console.log(`      - YES Shares: ${trader2Balances[0]}`);
    console.log(`      - NO Shares:  ${trader2Balances[1]}`);
  } catch (error) {
    console.error("❌ Failed to get final balances.", error);
    process.exit(1);
  }

  console.log("\n✨ Full flow test completed successfully!");
}

main();
