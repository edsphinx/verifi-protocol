/**
 * Debug Market Registry
 *
 * Verifies that markets are correctly registered and tokens match
 */

import { Aptos, AptosConfig, type Network } from "@aptos-labs/ts-sdk";
import { networkName, nodeUrl } from "./_config";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

async function main() {
  if (!MODULE_ADDRESS) {
    throw new Error("MODULE_ADDRESS not set");
  }

  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: nodeUrl,
  });
  const aptos = new Aptos(aptosConfig);

  console.log(" Debugging Market Registry");
  console.log("=".repeat(60));

  // Try the new get_all_market_addresses function
  console.log("\n🆕 Testing get_all_market_addresses():");
  const addresses = await aptos.view({
    payload: {
      function: `${MODULE_ADDRESS}::verifi_protocol::get_all_market_addresses`,
      functionArguments: [],
    },
  });
  console.log(`   Raw response:`, JSON.stringify(addresses, null, 2));

  // Get all markets (old way)
  console.log("\n🔧 Testing get_all_markets() (old way):");
  const markets = await aptos.view({
    payload: {
      function: `${MODULE_ADDRESS}::verifi_protocol::get_all_markets`,
      functionArguments: [],
    },
  });

  console.log(`\n Total markets: ${(markets as any[]).length}`);
  console.log(`📍 Raw response:`, JSON.stringify(markets, null, 2));

  // Use the new function's output
  const marketAddresses = addresses as string[];

  console.log(`\n📋 Market Addresses:`);
  for (let i = 0; i < marketAddresses.length; i++) {
    const addr = marketAddresses[i];
    console.log(`\n[${i}] ${addr}`);

    // Get tokens for this market
    try {
      const tokens = await aptos.view({
        payload: {
          function: `${MODULE_ADDRESS}::verifi_protocol::get_market_tokens`,
          functionArguments: [addr],
        },
      });

      const yesToken = (tokens as any[])[0];
      const noToken = (tokens as any[])[1];
      const yesAddr =
        typeof yesToken === "string"
          ? yesToken
          : yesToken?.inner || yesToken?.toString();
      const noAddr =
        typeof noToken === "string"
          ? noToken
          : noToken?.inner || noToken?.toString();

      console.log(`   YES: ${yesAddr}`);
      console.log(`   NO:  ${noAddr}`);
    } catch (e: any) {
      console.log(`    Failed to get tokens: ${e.message}`);
    }
  }
}

main();
