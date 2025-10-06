/**
 * @file Database Verification Script
 * @description Verifies database connection and shows existing tables
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log("🔍 Verifying Supabase database connection...\n");

  try {
    // Test connection with a simple query
    const marketCount = await prisma.market.count();
    const activityCount = await prisma.activity.count();
    const poolCount = await prisma.tappPool.count();
    const notificationCount = await prisma.notification.count();

    console.log("✅ Database connection successful!\n");
    console.log("📊 Current Data:");
    console.log(`   Markets: ${marketCount}`);
    console.log(`   Activities: ${activityCount}`);
    console.log(`   Tapp Pools: ${poolCount}`);
    console.log(`   Notifications: ${notificationCount}\n`);

    // Check new analytics tables
    const userPositionCount = await prisma.userPosition.count();
    const liquidityPositionCount = await prisma.liquidityPosition.count();
    const userStatsCount = await prisma.userStats.count();
    const protocolMetricsCount = await prisma.protocolMetrics.count();

    console.log("📈 Analytics Tables:");
    console.log(`   User Positions: ${userPositionCount}`);
    console.log(`   Liquidity Positions: ${liquidityPositionCount}`);
    console.log(`   User Stats: ${userStatsCount}`);
    console.log(`   Protocol Metrics: ${protocolMetricsCount}\n`);

    console.log("✨ All analytics tables are accessible and ready!");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
