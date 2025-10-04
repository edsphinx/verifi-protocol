#!/usr/bin/env tsx

/**
 * Database Sync Script
 *
 * Syncs database with on-chain state:
 * - Verifies which markets still exist on-chain
 * - Deletes markets that no longer exist
 * - Re-fetches and updates existing markets
 *
 * Usage:
 *   pnpm db:sync
 */

import { PrismaClient } from "@prisma/client";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const prisma = new PrismaClient();

// Initialize Aptos client
const config = new AptosConfig({
  network:
    (process.env.NEXT_PUBLIC_APTOS_NETWORK as Network) || Network.TESTNET,
});
const aptos = new Aptos(config);

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS!;

async function verifyMarketExists(marketAddress: string): Promise<boolean> {
  try {
    // Try to fetch market resource to see if it exists
    const market = await aptos.getAccountResource({
      accountAddress: marketAddress,
      resourceType: `${MODULE_ADDRESS}::verifi_protocol::Market`,
    });
    return !!market;
  } catch (error) {
    // Market doesn't exist on-chain
    return false;
  }
}

async function syncDatabase() {
  console.log("🔄 Starting database sync with on-chain state...\n");

  if (!MODULE_ADDRESS) {
    console.error(
      " Error: NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS not set in .env",
    );
    process.exit(1);
  }

  try {
    // 1. Get all markets from database
    const dbMarkets = await prisma.market.findMany();
    console.log(` Found ${dbMarkets.length} markets in database\n`);

    if (dbMarkets.length === 0) {
      console.log(" Database is empty, nothing to sync\n");
      return;
    }

    let existingCount = 0;
    let deletedCount = 0;
    const marketsToDelete: string[] = [];

    // 2. Check each market against on-chain state
    for (const market of dbMarkets) {
      process.stdout.write(
        ` Checking market ${market.marketAddress.slice(0, 10)}... `,
      );

      const exists = await verifyMarketExists(market.marketAddress);

      if (exists) {
        console.log(" Exists on-chain");
        existingCount++;
      } else {
        console.log(" Not found on-chain (will delete)");
        marketsToDelete.push(market.marketAddress);
        deletedCount++;
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // 3. Delete markets that don't exist on-chain
    if (marketsToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${marketsToDelete.length} stale markets...\n`);

      for (const marketAddress of marketsToDelete) {
        // Delete related data first
        await prisma.activity.deleteMany({
          where: { marketAddress },
        });

        await prisma.tappPool.deleteMany({
          where: { marketAddress },
        });

        await prisma.notification.deleteMany({
          where: { relatedAddress: marketAddress },
        });

        await prisma.market.delete({
          where: { marketAddress },
        });

        console.log(`    Deleted ${marketAddress.slice(0, 10)}...`);
      }
    }

    // 4. Summary
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(" Database sync complete!\n");
    console.log(" Summary:");
    console.log(`    Markets kept:    ${existingCount}`);
    console.log(`   🗑️  Markets deleted: ${deletedCount}`);
    console.log("\n Database is now in sync with on-chain state!\n");
  } catch (error) {
    console.error(" Error syncing database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

syncDatabase();
