import {
  Account,
  AccountAddress,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  isUserTransactionResponse,
  type Network,
} from "@aptos-labs/ts-sdk";
import { recordNewMarket } from "../../services/market.service";
import { networkName, nodeUrl, privateKey } from "./_config";

// The address of your deployed module. This should match what's in your .env file.
const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

/**
 * This function generates a variety of mock market descriptions.
 * @param index - The index of the market to generate.
 * @returns A string with a unique market description.
 */
function getMockDescription(index: number): string {
  const topics = [
    "Amnis Finance TVL",
    "Thala Labs LP price",
    "Merkle Trade volume",
    "Pontem Wallet users",
    "Econia order book depth",
  ];
  const conditions = [
    "exceed $5M",
    "drop below 100k APT",
    "reach 1M transactions",
    "surpass 500k users",
    "achieve a 2:1 ratio",
  ];
  return `Will ${topics[index % topics.length]} ${
    conditions[index % conditions.length]
  } by Oct ${index + 1}?`;
}

/**
 * Main function to create multiple mock markets.
 */
async function main() {
  if (!privateKey) {
    throw new Error("Publisher private key is not set in your .env file.");
  }
  if (!MODULE_ADDRESS) {
    throw new Error("Module address is not set in your .env file.");
  }

  // Initialize the Aptos client and the publisher's account
  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: `${nodeUrl}`,
  });
  const aptos = new Aptos(aptosConfig);

  const publisherPrivateKey = new Ed25519PrivateKey(privateKey);
  const publisher = Account.fromPrivateKey({ privateKey: publisherPrivateKey });

  console.log(`\n- Publisher Address: ${publisher.accountAddress.toString()}`);
  console.log(`- Using network: ${networkName}`);
  console.log(`- Creating 20 mock markets...\n`);

  // Loop 20 times to create 20 markets
  for (let i = 0; i < 20; i++) {
    const year = 2026;
    const month = 0; // 0 = Enero
    const day = i + 1;
    const resolutionTimestamp = new Date(Date.UTC(year, month, day, 12, 0, 0));
    const resolutionTimestampSeconds = Math.floor(
      resolutionTimestamp.getTime() / 1000,
    ).toString();

    const transaction = await aptos.transaction.build.simple({
      sender: publisher.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::verifi_protocol::create_market`,
        functionArguments: [
          getMockDescription(i).toString(), // description
          resolutionTimestampSeconds, // resolution_timestamp (dummy future date)
          publisher.accountAddress.toString(),
          "0x1", // target_address (dummy)
          "get_tvl", // target_function (dummy)
          BigInt("1000000000"),
          0, // operator (dummy)
        ],
      },
    });

    try {
      // Sign and submit the transaction
      const committedTxn = await aptos.signAndSubmitTransaction({
        signer: publisher,
        transaction,
      });

      // Wait for the transaction to be committed
      const response = await aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      if (isUserTransactionResponse(response)) {
        const marketCreatedEvent = response.events.find(
          (event) =>
            event.type ===
            `${MODULE_ADDRESS}::verifi_protocol::MarketCreatedEvent`,
        );

        if (marketCreatedEvent) {
          //const marketAddress = marketCreatedEvent.data.market_address;
          const { market_address, creator, description } =
            marketCreatedEvent.data;

          console.log(`✅ Market ${i + 1} created on-chain.`);

          try {
            await recordNewMarket({
              marketAddress: market_address,
              creatorAddress: creator,
              description: description,
              resolutionTimestamp: resolutionTimestamp, // <-- Usar el objeto Date
            });
            console.log(`   - 💾 Saved to database successfully.`);
          } catch (dbError) {
            console.error(`   - ❌ Failed to save to database:`, dbError);
          }
          console.log(`   - Address: ${market_address}`);
          console.log(`   - Txn Hash: ${committedTxn.hash}`);
        } else {
          console.error(
            `- Could not find MarketCreatedEvent for txn: ${committedTxn.hash}`,
          );
        }
      }
    } catch (error) {
      console.error(`❌ Failed to create market ${i + 1}. Error:`, error);
      // Optional: Stop the script if one transaction fails
      // break;
    }
  }

  console.log("\n✨ Done creating mock markets.");
}

main().catch((error) => {
  console.error("An unexpected error occurred:", error);
  process.exit(1);
});
