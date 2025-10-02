/**
 * Register Tapp Oracle in the Oracle Registry
 */

import { Aptos, AptosConfig, type Network } from "@aptos-labs/ts-sdk";
import { networkName, nodeUrl } from "./_config";
import { publisherAccount } from "./_test-accounts";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

async function main() {
  if (!MODULE_ADDRESS) {
    throw new Error("MODULE_ADDRESS is not set in .env file.");
  }

  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: nodeUrl,
  });
  const aptos = new Aptos(aptosConfig);

  console.log(" Registering Tapp Oracle...");
  console.log(` Publisher: ${publisherAccount.accountAddress}`);
  console.log(`🌐 Network: ${networkName} (${nodeUrl})\n`);

  try {
    // Register tapp_prediction oracle
    console.log("[1/1] Registering 'tapp_prediction' oracle...");

    const registerTxn = await aptos.transaction.build.simple({
      sender: publisherAccount.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::oracle_registry::register_oracle`,
        functionArguments: [
          "tapp_prediction", // oracle_id
          "Tapp Prediction Market Oracle - Provides hook-based resolution for prediction markets", // description
        ],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: publisherAccount,
      transaction: registerTxn,
    });

    await aptos.waitForTransaction({
      transactionHash: committedTxn.hash,
    });

    console.log(` Tapp oracle registered successfully!`);
    console.log(`   Oracle ID: tapp_prediction`);
    console.log(
      `   TX: https://explorer.aptoslabs.com/txn/${committedTxn.hash}?network=${networkName}\n`,
    );

    console.log(" Oracle registration completed!");
    console.log(
      " You can now create markets with oracle_id='tapp_prediction'",
    );
  } catch (error: any) {
    if (error.message && error.message.includes("EORACLE_ALREADY_EXISTS")) {
      console.log(
        "ℹ️  Oracle 'tapp_prediction' already exists. Skipping registration.",
      );
    } else {
      console.error(" Failed to register oracle.", error);
      process.exit(1);
    }
  }
}

main();
