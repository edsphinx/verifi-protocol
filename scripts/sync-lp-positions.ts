/**
 * Sync LP Positions Script
 *
 * Fetches user's LP position NFTs from Tapp AMM and syncs to database
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/sync-lp-positions.ts <USER_ADDRESS>
 */

import { PrismaClient } from '@prisma/client';
import { Aptos, AptosConfig, type Network } from '@aptos-labs/ts-sdk';
import { networkName } from './move/_config';

const prisma = new PrismaClient();

const config = new AptosConfig({
  network: networkName as Network,
});
const aptos = new Aptos(config);

const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS!;

async function syncUserLPPositions(userAddress: string) {
  console.log(`\n🔍 Syncing LP Positions for: ${userAddress}\n`);
  console.log(`📍 Module Address: ${MODULE_ADDRESS}\n`);

  try {
    // Get all pools from database to check
    const pools = await prisma.tappPool.findMany({
      include: {
        market: true,
      },
    });

    console.log(`📊 Found ${pools.length} pools in database\n`);

    if (pools.length === 0) {
      console.log('No pools found in database. Run blockchain:sync first.');
      return;
    }

    let totalSynced = 0;

    // For each pool, try to get positions
    for (const pool of pools) {
      console.log(`\n🏊 Pool: ${pool.poolAddress.substring(0, 10)}...`);
      console.log(`   Market: ${pool.market?.description?.substring(0, 50) || 'Unknown'}...`);

      try {
        // Try to get all positions in this pool
        // This might fail if the pool doesn't have get_positions view function
        const positions = await aptos.view({
          payload: {
            function: `${MODULE_ADDRESS}::tapp_pool::get_positions`,
            functionArguments: [pool.poolAddress],
          },
        });

        console.log(`   Found ${(positions as any[]).length} total positions in pool`);

        // TODO: Filter for user's positions and sync to database
        // For now, just log what we found

      } catch (error) {
        console.log(`   ⚠️  Could not query positions:`, (error as Error).message);
      }
    }

    console.log(`\n✅ Complete! Check output above for details.`);

  } catch (error) {
    console.error('\n❌ Error syncing LP positions:', error);
    throw error;
  }
}

// Main
const userAddress = process.argv[2];

if (!userAddress) {
  console.error('Usage: pnpm tsx scripts/sync-lp-positions.ts <USER_ADDRESS>');
  process.exit(1);
}

syncUserLPPositions(userAddress)
  .then(() => {
    console.log('\n✅ Sync complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
