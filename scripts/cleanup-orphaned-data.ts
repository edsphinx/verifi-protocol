import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupOrphanedData() {
  console.log("🧹 Cleaning up orphaned data...\n");

  try {
    // 1. Find orphaned activities (activities without matching markets)
    console.log("📋 Checking for orphaned activities...");

    const orphanedActivities = await prisma.$queryRaw<
      Array<{ market_address: string; count: number }>
    >`
      SELECT a.market_address, COUNT(*) as count
      FROM activities a
      LEFT JOIN markets m ON a.market_address = m.market_address
      WHERE m.market_address IS NULL
      GROUP BY a.market_address
    `;

    if (orphanedActivities.length > 0) {
      console.log(
        `❌ Found ${orphanedActivities.length} orphaned market references:`,
      );
      for (const orphan of orphanedActivities) {
        console.log(
          `   - ${orphan.market_address}: ${orphan.count} activities`,
        );
      }

      // Delete orphaned activities
      const deleteResult = await prisma.$executeRaw`
        DELETE FROM activities
        WHERE market_address IN (
          SELECT a.market_address
          FROM activities a
          LEFT JOIN markets m ON a.market_address = m.market_address
          WHERE m.market_address IS NULL
        )
      `;

      console.log(`✅ Deleted ${deleteResult} orphaned activities\n`);
    } else {
      console.log("✅ No orphaned activities found\n");
    }

    // 2. Find orphaned tapp_pools (pools without matching markets)
    console.log("📋 Checking for orphaned tapp_pools...");

    const orphanedPools = await prisma.$queryRaw<
      Array<{ market_address: string; count: number }>
    >`
      SELECT p.market_address, COUNT(*) as count
      FROM tapp_pools p
      LEFT JOIN markets m ON p.market_address = m.market_address
      WHERE m.market_address IS NULL
      GROUP BY p.market_address
    `;

    if (orphanedPools.length > 0) {
      console.log(`❌ Found ${orphanedPools.length} orphaned pool references:`);
      for (const orphan of orphanedPools) {
        console.log(`   - ${orphan.market_address}: ${orphan.count} pools`);
      }

      // Delete orphaned pools
      const deleteResult = await prisma.$executeRaw`
        DELETE FROM tapp_pools
        WHERE market_address IN (
          SELECT p.market_address
          FROM tapp_pools p
          LEFT JOIN markets m ON p.market_address = m.market_address
          WHERE m.market_address IS NULL
        )
      `;

      console.log(`✅ Deleted ${deleteResult} orphaned pools\n`);
    } else {
      console.log("✅ No orphaned pools found\n");
    }

    // 3. Summary
    const totalMarkets = await prisma.market.count();
    const totalActivities = await prisma.activity.count();
    const totalPools = await prisma.tappPool.count();

    console.log("📊 Database Summary:");
    console.log(`   Markets: ${totalMarkets}`);
    console.log(`   Activities: ${totalActivities}`);
    console.log(`   Pools: ${totalPools}`);
    console.log("\n✅ Cleanup complete! Database is ready for migration.\n");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedData();
