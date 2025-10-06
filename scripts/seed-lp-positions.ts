/**
 * Seed LP Positions Script
 *
 * Adds test LP positions to database for testing the portfolio UI
 *
 * Usage:
 *   npx ts-node --project tsconfig.scripts.json scripts/seed-lp-positions.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_USER =
  "0x32ee964a31be2ce5db67a29c31ecabd3244b578cd4abd28e69f7ec641d21d691";

async function seedLPPositions() {
  console.log("\n🌾 Seeding LP Positions...\n");

  try {
    // Get some pools from database
    const pools = await prisma.tappPool.findMany({
      take: 3,
      include: {
        market: true,
      },
    });

    if (pools.length === 0) {
      console.log("❌ No pools found. Run blockchain:sync first.");
      return;
    }

    console.log(`Found ${pools.length} pools to seed positions for\n`);

    let created = 0;

    for (const pool of pools) {
      // Create 1-2 LP positions per pool
      const numPositions = Math.floor(Math.random() * 2) + 1;

      for (let i = 0; i < numPositions; i++) {
        const liquidityProvided = Math.random() * 100 + 10; // 10-110 APT
        const feesEarned = liquidityProvided * (Math.random() * 0.05); // 0-5% fees
        const currentValue =
          liquidityProvided + feesEarned + (Math.random() * 10 - 5); // +/- 5 APT

        const lpPosition = await prisma.liquidityPosition.create({
          data: {
            userAddress: TEST_USER,
            poolAddress: pool.poolAddress,
            marketAddress: pool.marketAddress,
            lpTokens: liquidityProvided * 1000, // Mock LP tokens
            liquidityProvided,
            yesAmount: liquidityProvided * 0.5,
            noAmount: liquidityProvided * 0.5,
            currentValue,
            feesEarned,
            unrealizedPnL: currentValue - liquidityProvided,
            apr: (feesEarned / liquidityProvided) * 365 * 100, // Annualized
            status: "ACTIVE",
          },
        });

        console.log(
          `✅ Created LP position in pool ${pool.poolAddress.substring(0, 8)}...`,
        );
        console.log(
          `   Market: ${pool.market?.description?.substring(0, 40) || "Unknown"}...`,
        );
        console.log(`   Liquidity: ${liquidityProvided.toFixed(2)} APT`);
        console.log(`   Fees: ${feesEarned.toFixed(4)} APT`);
        console.log(`   Value: ${currentValue.toFixed(2)} APT\n`);

        created++;
      }
    }

    console.log(`\n🎉 Created ${created} LP positions for testing!`);
  } catch (error) {
    console.error("\n❌ Error seeding LP positions:", error);
    throw error;
  }
}

seedLPPositions()
  .then(() => {
    console.log("\n✅ Seed complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
