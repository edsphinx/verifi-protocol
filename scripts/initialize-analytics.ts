/**
 * @file Initialize Analytics Data
 * @description Populate protocol_metrics and user_stats tables from existing data
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function initializeAnalytics() {
  console.log("🚀 Initializing analytics data...\n");

  try {
    // Calculate protocol-wide metrics
    console.log("📊 Calculating protocol metrics...");

    const markets = await prisma.market.findMany();
    const activities = await prisma.activity.findMany();
    const pools = await prisma.tappPool.findMany();

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Activities in last 24h
    const activities24h = activities.filter(
      (a) => new Date(a.timestamp) >= yesterday
    );

    // Activities in last 7 days
    const activities7d = activities.filter(
      (a) => new Date(a.timestamp) >= weekAgo
    );

    // Calculate total volume
    const totalVolume = activities.reduce((sum, a) => sum + a.amount, 0);
    const volume24h = activities24h.reduce((sum, a) => sum + a.amount, 0);
    const volume7d = activities7d.reduce((sum, a) => sum + a.amount, 0);

    // Calculate TVL (total liquidity in pools)
    const totalValueLocked = pools.reduce(
      (sum, p) => sum + p.totalLiquidity,
      0
    );

    // Calculate unique users
    const uniqueUsers = new Set(activities.map((a) => a.userAddress)).size;
    const activeUsers24h = new Set(
      activities24h.map((a) => a.userAddress)
    ).size;
    const activeUsers7d = new Set(activities7d.map((a) => a.userAddress))
      .size;

    // Create protocol metrics entry
    await prisma.protocolMetrics.create({
      data: {
        totalVolume,
        volume24h,
        volume7d,
        totalValueLocked,
        tvlChange24h: 0, // Will be calculated on subsequent syncs
        totalMarkets: markets.length,
        activeMarkets: markets.filter((m) => m.status === "active").length,
        resolvedMarkets: markets.filter((m) =>
          m.status.includes("RESOLVED")
        ).length,
        totalUsers: uniqueUsers,
        activeUsers24h,
        activeUsers7d,
        totalTrades: activities.length,
        trades24h: activities24h.length,
        totalPools: pools.length,
        totalLiquidity: totalValueLocked,
        timestamp: now,
      },
    });

    console.log("✅ Protocol metrics created:");
    console.log(`   Total Volume: ${(totalVolume / 100_000_000).toFixed(2)} APT`);
    console.log(`   24h Volume: ${(volume24h / 100_000_000).toFixed(2)} APT`);
    console.log(`   Total Markets: ${markets.length}`);
    console.log(`   Total Users: ${uniqueUsers}`);
    console.log(`   Total Trades: ${activities.length}\n`);

    // Calculate user stats
    console.log("👥 Calculating user statistics...");

    const userActivities = new Map<string, typeof activities>();

    for (const activity of activities) {
      const existing = userActivities.get(activity.userAddress) || [];
      existing.push(activity);
      userActivities.set(activity.userAddress, existing);
    }

    let userCount = 0;

    for (const [userAddress, userActivitiesList] of userActivities) {
      const user24h = userActivitiesList.filter(
        (a) => new Date(a.timestamp) >= yesterday
      );

      const userTotalVolume = userActivitiesList.reduce(
        (sum, a) => sum + a.amount,
        0
      );
      const userVolume24h = user24h.reduce((sum, a) => sum + a.amount, 0);

      // Calculate P&L from positions (simplified - can be enhanced)
      const positions = await prisma.userPosition.findMany({
        where: { userAddress },
      });

      const totalPnL = positions.reduce(
        (sum, p) => sum + (p.realizedPnL || p.unrealizedPnL),
        0
      );

      const winningTrades = positions.filter(
        (p) => (p.realizedPnL || p.unrealizedPnL) > 0
      ).length;
      const losingTrades = positions.filter(
        (p) => (p.realizedPnL || p.unrealizedPnL) < 0
      ).length;

      const totalTradesCount = winningTrades + losingTrades;
      const winRate =
        totalTradesCount > 0 ? winningTrades / totalTradesCount : 0;

      await prisma.userStats.create({
        data: {
          userAddress,
          totalVolume: userTotalVolume,
          volume24h: userVolume24h,
          totalTrades: userActivitiesList.length,
          trades24h: user24h.length,
          totalPnL,
          winningTrades,
          losingTrades,
          winRate,
          totalLiquidityProvided: 0, // Will be populated by sync service
          feesEarnedAllTime: 0, // Will be populated by sync service
          lastUpdated: now,
        },
      });

      userCount++;
    }

    console.log(`✅ Created stats for ${userCount} users\n`);

    console.log("✨ Analytics initialization complete!");
    console.log("\n📝 Next steps:");
    console.log("   1. Visit http://localhost:3000/analytics");
    console.log("   2. Use the Sync Control Panel to trigger syncs");
    console.log("   3. View real-time metrics and leaderboards\n");
  } catch (error) {
    console.error("❌ Error initializing analytics:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initializeAnalytics().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
