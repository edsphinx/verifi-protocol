import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import type { ProtocolMetrics } from "@/lib/types/database.types";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get latest protocol metrics from database
    const latestMetrics = await prisma.protocolMetrics.findFirst({
      orderBy: { timestamp: "desc" },
    });

    // Calculate real-time metrics from database
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get counts
    const totalMarkets = await prisma.market.count();
    const activeMarkets = await prisma.market.count({
      where: { status: "active" },
    });
    const resolvedMarkets = await prisma.market.count({
      where: { status: { in: ["resolved_yes", "resolved_no"] } },
    });

    // Get 24h metrics
    const activities24h = await prisma.activity.findMany({
      where: {
        timestamp: { gte: yesterday },
      },
    });

    const volume24h = activities24h
      .filter((a) => a.action === "BUY" || a.action === "SELL")
      .reduce((sum, a) => sum + (a.totalValue || 0), 0);

    const trades24h = activities24h.filter(
      (a) => a.action === "BUY" || a.action === "SELL",
    ).length;

    const activeUsers24h = new Set(activities24h.map((a) => a.userAddress))
      .size;

    // Get 7d metrics
    const activities7d = await prisma.activity.findMany({
      where: {
        timestamp: { gte: lastWeek },
      },
    });

    const volume7d = activities7d
      .filter((a) => a.action === "BUY" || a.action === "SELL")
      .reduce((sum, a) => sum + (a.totalValue || 0), 0);

    const activeUsers7d = new Set(activities7d.map((a) => a.userAddress)).size;

    // Get total volume from all activities
    const allActivities = await prisma.activity.findMany({
      where: {
        action: { in: ["BUY", "SELL"] },
      },
    });

    const totalVolume = allActivities.reduce(
      (sum, a) => sum + (a.totalValue || 0),
      0,
    );

    const totalTrades = allActivities.length;

    // Get total unique users
    const totalUsers = new Set(allActivities.map((a) => a.userAddress)).size;

    // Get TVL from pools
    const pools = await prisma.tappPool.findMany();
    const totalValueLocked = pools.reduce(
      (sum, p) => sum + p.totalLiquidity,
      0,
    );
    const totalPools = pools.length;
    const totalLiquidity = pools.reduce((sum, p) => sum + p.totalLiquidity, 0);

    // Calculate TVL change
    const tvlChange24h = latestMetrics
      ? ((totalValueLocked - latestMetrics.totalValueLocked) /
          latestMetrics.totalValueLocked) *
        100
      : 0;

    const protocolMetrics: ProtocolMetrics = {
      // Volume metrics
      totalVolume,
      volume24h,
      volume7d,

      // TVL metrics
      totalValueLocked,
      tvlChange24h,

      // Market metrics
      totalMarkets,
      activeMarkets,
      resolvedMarkets,

      // User metrics
      totalUsers,
      activeUsers24h,
      activeUsers7d,

      // Trade metrics
      totalTrades,
      trades24h,

      // Pool metrics
      totalPools,
      totalLiquidity,

      // Metadata
      lastUpdated: now.toISOString(),
    };

    return NextResponse.json(protocolMetrics);
  } catch (error) {
    console.error("Error fetching protocol metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch protocol metrics" },
      { status: 500 },
    );
  }
}
