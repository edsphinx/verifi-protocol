/**
 * Check actual data values in database
 */

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkData() {
  console.log("🔍 Checking actual data values...\n");

  try {
    // Check protocol metrics
    const metrics = await prisma.protocolMetrics.findFirst({
      orderBy: { timestamp: "desc" },
    });

    console.log("📊 Protocol Metrics:");
    console.log(`   Total Volume (raw): ${metrics?.totalVolume}`);
    console.log(`   Total Volume (APT): ${(metrics?.totalVolume || 0) / 100_000_000}`);
    console.log(`   24h Volume (raw): ${metrics?.volume24h}`);
    console.log(`   24h Volume (APT): ${(metrics?.volume24h || 0) / 100_000_000}`);
    console.log(`   TVL (raw): ${metrics?.totalValueLocked}`);
    console.log(`   TVL (APT): ${(metrics?.totalValueLocked || 0) / 100_000_000}\n`);

    // Check recent activities
    const activities = await prisma.activity.findMany({
      take: 5,
      orderBy: { timestamp: "desc" },
    });

    console.log("📈 Recent Activities:");
    activities.forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.action} - Amount (raw): ${a.amount}, Amount (APT): ${a.amount / 100_000_000}`);
    });
    console.log("");

    // Check user stats
    const userStats = await prisma.userStats.findMany({
      take: 3,
      orderBy: { totalVolume: "desc" },
    });

    console.log("👥 Top User Stats:");
    userStats.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.userAddress.slice(0, 10)}...`);
      console.log(`      Volume (raw): ${u.totalVolume}, Volume (APT): ${u.totalVolume / 100_000_000}`);
      console.log(`      Trades: ${u.totalTrades}`);
    });

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
