/**
 * Check pool data in database
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkPools() {
  console.log("🔍 Checking pool data...\n");

  try {
    const pools = await prisma.tappPool.findMany({
      take: 5,
    });

    console.log(`📊 Found ${pools.length} pools:\n`);

    pools.forEach((pool, i) => {
      console.log(`Pool ${i + 1}:`);
      console.log(`   Address: ${pool.poolAddress.slice(0, 10)}...`);
      console.log(`   Total Liquidity (raw): ${pool.totalLiquidity}`);
      console.log(`   Total Liquidity (APT): ${pool.totalLiquidity / 100_000_000}`);
      console.log(`   Volume 24h (raw): ${pool.volume24h}`);
      console.log(`   Volume 24h (APT): ${pool.volume24h / 100_000_000}`);
      console.log(`   Fee: ${pool.fee}\n`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPools();
