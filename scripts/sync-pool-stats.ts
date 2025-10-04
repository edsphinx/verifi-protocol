/**
 * Sync Tapp Pool Stats from Blockchain
 *
 * Updates pool liquidity, volume, and fee data from the blockchain
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/sync-pool-stats.ts
 */

import { PrismaClient } from '@prisma/client';
import { aptosClient } from '../aptos/client';

const prisma = new PrismaClient();

// Tapp AMM module address (from check-pool.ts)
const TAPP_HOOK_MODULE = '0x93bc73410f9345c6ff9c399c43913e7a7701a7331e375a70b0ba81ccca036674::tapp_prediction_hook';

async function syncPoolStats() {
  console.log('\n🔄 Syncing Tapp Pool Statistics...\n');

  try {
    // Get all pools from database
    const pools = await prisma.tappPool.findMany({
      include: {
        market: true,
      },
    });

    console.log(`📊 Found ${pools.length} pools in database\n`);

    let updated = 0;
    let errors = 0;

    for (const pool of pools) {
      try {
        console.log(`🏊 Pool: ${pool.poolAddress.substring(0, 10)}...`);
        console.log(`   Market: ${pool.market?.description?.substring(0, 50) || 'Unknown'}...`);

        // Fetch pool stats from blockchain
        const stats = await aptosClient().view({
          payload: {
            function: `${TAPP_HOOK_MODULE}::get_pool_stats` as any,
            typeArguments: [],
            functionArguments: [pool.poolAddress],
          },
        });

        const [reserveYes, reserveNo, feeYes, feeNo, positionCount, isTrading] = stats as [
          string,
          string,
          string,
          string,
          string,
          boolean,
        ];

        // Convert from smallest units (8 decimals for APT)
        const DECIMALS = 100_000_000; // 1e8
        const yesReserveAPT = Number(reserveYes) / DECIMALS;
        const noReserveAPT = Number(reserveNo) / DECIMALS;
        const totalLiquidityAPT = yesReserveAPT + noReserveAPT;
        const feeYesAPT = Number(feeYes) / DECIMALS;
        const feeNoAPT = Number(feeNo) / DECIMALS;

        console.log(`   YES Reserve: ${yesReserveAPT.toFixed(4)} APT`);
        console.log(`   NO Reserve:  ${noReserveAPT.toFixed(4)} APT`);
        console.log(`   Total Liquidity: ${totalLiquidityAPT.toFixed(4)} APT`);
        console.log(`   Positions: ${positionCount}`);
        console.log(`   Trading: ${isTrading ? 'Enabled' : 'Disabled'}`);

        // Update database
        await prisma.tappPool.update({
          where: { id: pool.id },
          data: {
            yesReserve: yesReserveAPT,
            noReserve: noReserveAPT,
            totalLiquidity: totalLiquidityAPT,
            // Note: volume24h would require historical data tracking
            // For now, we can estimate from fee amounts
            volumeAllTime: feeYesAPT + feeNoAPT, // Rough estimate
          },
        });

        console.log(`   ✅ Updated!\n`);
        updated++;
      } catch (error) {
        console.log(`   ❌ Error:`, (error as Error).message);
        console.log();
        errors++;
      }
    }

    console.log(`\n📊 Sync Complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Errors:  ${errors}`);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    throw error;
  }
}

syncPoolStats()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
