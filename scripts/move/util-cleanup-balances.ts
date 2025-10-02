/**
 * Cleanup Script - Recover APT from accumulated YES/NO tokens
 *
 * This script helps traders recover APT by selling back their YES/NO shares
 * that accumulate when integration tests fail mid-execution.
 *
 * Usage: pnpm cleanup:traders
 */

import { Aptos, AptosConfig, type Network } from "@aptos-labs/ts-sdk";
import { networkName, nodeUrl } from "./_config";
import {
  trader1Account,
  trader2Account,
  trader3Account,
  trader4Account,
  logAllAccounts,
} from "./_test-accounts";

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

const traders = [
  { name: "Trader 1", account: trader1Account },
  { name: "Trader 2", account: trader2Account },
  { name: "Trader 3", account: trader3Account },
  { name: "Trader 4", account: trader4Account },
];

async function main() {
  if (!MODULE_ADDRESS) {
    throw new Error("NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS not set in .env");
  }

  const aptosConfig = new AptosConfig({
    network: networkName as Network,
    fullnode: nodeUrl,
  });
  const aptos = new Aptos(aptosConfig);

  console.log("🧹 Trader Balance Cleanup Tool");
  console.log("=".repeat(60));
  console.log(`🌐 Network: ${networkName}`);
  console.log(`📍 Module: ${MODULE_ADDRESS}`);
  console.log("=".repeat(60) + "\n");

  // Step 1: Get all markets
  console.log("[1/3] Fetching all markets...");
  let allMarkets: string[] = [];
  try {
    const markets = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::verifi_protocol::get_all_markets`,
        functionArguments: [],
      },
    });
    allMarkets = (markets as any[]).map((m: any) =>
      typeof m === "string" ? m : m?.inner || m?.toString(),
    );
    console.log(`✅ Found ${allMarkets.length} markets\n`);
  } catch (error: any) {
    console.error("❌ Failed to fetch markets:", error.message);
    process.exit(1);
  }

  if (allMarkets.length === 0) {
    console.log("ℹ️  No markets found. Nothing to clean up.");
    return;
  }

  // Step 2: Get ALL fungible assets for each trader by querying their account resources
  console.log("[2/3] Scanning trader accounts for ALL YES/NO tokens...\n");

  const cleanupTasks: Array<{
    trader: string;
    account: any;
    market: string;
    yesBalance: number;
    noBalance: number;
  }> = [];

  for (const trader of traders) {
    console.log(`📊 ${trader.name}: ${trader.account.accountAddress}`);

    try {
      // Get all account resources to find FungibleStore resources
      const resources = await aptos.getAccountResources({
        accountAddress: trader.account.accountAddress,
      });

      // Find all FungibleStore resources (these hold FA balances)
      const fungibleStores = resources.filter((r: any) =>
        r.type.includes("0x1::fungible_asset::FungibleStore"),
      );

      console.log(`   Found ${fungibleStores.length} fungible asset stores`);

      // For each fungible store, check if it's a YES/NO token by checking balance
      for (const store of fungibleStores) {
        const balance = Number((store.data as any)?.balance || 0);

        if (balance > 0) {
          const metadata = (store.data as any)?.metadata;
          const metadataAddr =
            typeof metadata === "string"
              ? metadata
              : metadata?.inner || metadata?.toString();

          console.log(
            `   - Asset: ${metadataAddr?.slice(0, 16)}... Balance: ${balance / 100_000_000}`,
          );

          // Now find which market this token belongs to by checking all markets
          for (const marketAddr of allMarkets) {
            try {
              const tokens = await aptos.view({
                payload: {
                  function: `${MODULE_ADDRESS}::verifi_protocol::get_market_tokens`,
                  functionArguments: [marketAddr],
                },
              });

              const yesToken =
                typeof tokens[0] === "string"
                  ? tokens[0]
                  : (tokens[0] as any)?.inner || tokens[0]?.toString();
              const noToken =
                typeof tokens[1] === "string"
                  ? tokens[1]
                  : (tokens[1] as any)?.inner || tokens[1]?.toString();

              // Check if this fungible asset matches YES or NO token
              if (metadataAddr === yesToken) {
                console.log(
                  `     ✓ YES token from market ${marketAddr.slice(0, 10)}...`,
                );

                // Find or create cleanup task for this market
                let task = cleanupTasks.find(
                  (t) =>
                    t.account === trader.account && t.market === marketAddr,
                );
                if (!task) {
                  task = {
                    trader: trader.name,
                    account: trader.account,
                    market: marketAddr,
                    yesBalance: 0,
                    noBalance: 0,
                  };
                  cleanupTasks.push(task);
                }
                task.yesBalance = balance;
              } else if (metadataAddr === noToken) {
                console.log(
                  `     ✓ NO token from market ${marketAddr.slice(0, 10)}...`,
                );

                // Find or create cleanup task for this market
                let task = cleanupTasks.find(
                  (t) =>
                    t.account === trader.account && t.market === marketAddr,
                );
                if (!task) {
                  task = {
                    trader: trader.name,
                    account: trader.account,
                    market: marketAddr,
                    yesBalance: 0,
                    noBalance: 0,
                  };
                  cleanupTasks.push(task);
                }
                task.noBalance = balance;
              }
            } catch (e) {
              // Market might not exist, skip
            }
          }
        }
      }
    } catch (error: any) {
      console.log(`   ⚠️  Could not scan ${trader.name}: ${error.message}`);
    }
    console.log("");
  }

  if (cleanupTasks.length === 0) {
    console.log("✅ All traders have clean balances. Nothing to sell.\n");
    return;
  }

  // Step 3: Sell back shares to recover APT
  console.log(
    `[3/3] Selling shares to recover APT (${cleanupTasks.length} positions)...\n`,
  );

  let successCount = 0;
  let failCount = 0;

  for (const task of cleanupTasks) {
    console.log(
      `🔄 ${task.trader} selling from market ${task.market.slice(0, 10)}...`,
    );

    // Sell YES shares if any
    if (task.yesBalance > 0) {
      try {
        const sellYesTxn = await aptos.transaction.build.simple({
          sender: task.account.accountAddress,
          data: {
            function: `${MODULE_ADDRESS}::verifi_protocol::sell_shares`,
            functionArguments: [task.market, task.yesBalance, true],
          },
        });
        const yesCommit = await aptos.signAndSubmitTransaction({
          signer: task.account,
          transaction: sellYesTxn,
        });
        await aptos.waitForTransaction({ transactionHash: yesCommit.hash });
        console.log(`   ✅ Sold ${task.yesBalance / 100_000_000} YES shares`);
        successCount++;

        // Small delay between transactions
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        console.log(`   ❌ Failed to sell YES: ${error.message}`);
        failCount++;
      }
    }

    // Sell NO shares if any
    if (task.noBalance > 0) {
      try {
        const sellNoTxn = await aptos.transaction.build.simple({
          sender: task.account.accountAddress,
          data: {
            function: `${MODULE_ADDRESS}::verifi_protocol::sell_shares`,
            functionArguments: [task.market, task.noBalance, false],
          },
        });
        const noCommit = await aptos.signAndSubmitTransaction({
          signer: task.account,
          transaction: sellNoTxn,
        });
        await aptos.waitForTransaction({ transactionHash: noCommit.hash });
        console.log(`   ✅ Sold ${task.noBalance / 100_000_000} NO shares`);
        successCount++;

        // Small delay between transactions
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error: any) {
        console.log(`   ❌ Failed to sell NO: ${error.message}`);
        failCount++;
      }
    }

    console.log("");
  }

  // Summary
  console.log("=".repeat(60));
  console.log("✨ CLEANUP SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Successful sales: ${successCount}`);
  console.log(`❌ Failed sales: ${failCount}`);
  console.log("=".repeat(60));

  if (successCount > 0) {
    console.log("\n💰 Traders have recovered APT from their shares!");
    console.log("📊 Check balances with:");
    console.log("   pnpm test:full (at the start it logs all accounts)\n");
  }
}

main();
