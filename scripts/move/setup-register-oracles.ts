/**
 * Register Common Oracles
 * Registers the most commonly used oracles for testing
 */

import { Aptos, AptosConfig, type Network } from "@aptos-labs/ts-sdk";
import { networkName, nodeUrl } from "./_config";
import { publisherAccount } from "./_test-accounts";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

const ORACLES = [
  {
    id: "aptos-balance",
    description:
      "Aptos Native Balance Oracle - Checks APT balance of an address",
  },
  {
    id: "usdc-total-supply",
    description: "USDC Total Supply Oracle - Checks total USDC supply",
  },
  {
    id: "tapp_prediction",
    description: "Tapp Prediction Market Oracle - Hook-based resolution",
  },
];

async function main() {
  if (!MODULE_ADDRESS) {
    throw new Error("MODULE_ADDRESS is not set in .env file.");
  }

  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: nodeUrl,
  });
  const aptos = new Aptos(aptosConfig);

  console.log(" Registering Common Oracles...");
  console.log(` Publisher: ${publisherAccount.accountAddress}\n`);

  for (const oracle of ORACLES) {
    try {
      console.log(`[*] Registering '${oracle.id}'...`);

      const registerTxn = await aptos.transaction.build.simple({
        sender: publisherAccount.accountAddress,
        data: {
          function: `${MODULE_ADDRESS}::oracle_registry::register_oracle`,
          functionArguments: [oracle.id, oracle.description],
        },
      });

      const committedTxn = await aptos.signAndSubmitTransaction({
        signer: publisherAccount,
        transaction: registerTxn,
      });

      await aptos.waitForTransaction({
        transactionHash: committedTxn.hash,
      });

      console.log(` '${oracle.id}' registered successfully!\n`);
    } catch (error: any) {
      if (error.message && error.message.includes("EORACLE_ALREADY_EXISTS")) {
        console.log(`ℹ️  '${oracle.id}' already exists. Skipping.\n`);
      } else {
        console.error(` Failed to register '${oracle.id}':`, error.message);
      }
    }
  }

  console.log(" Oracle registration completed!");
}

main();
