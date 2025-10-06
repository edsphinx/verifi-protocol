import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import type { TraderMetrics } from "@/lib/types/database.types";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get all user stats or calculate from activities
    const userStats = await prisma.userStats.findMany({
      orderBy: [{ totalVolume: "desc" }],
      take: limit,
    });

    // If we don't have userStats yet, calculate from activities
    if (userStats.length === 0) {
      // Get all activities grouped by user
      const allActivities = await prisma.activity.findMany({
        where: {
          action: { in: ["BUY", "SELL"] },
        },
      });

      const activities24h = await prisma.activity.findMany({
        where: {
          action: { in: ["BUY", "SELL"] },
          timestamp: { gte: yesterday },
        },
      });

      // Group by user
      const userMap = new Map<string, any>();

      for (const activity of allActivities) {
        if (!userMap.has(activity.userAddress)) {
          userMap.set(activity.userAddress, {
            address: activity.userAddress,
            totalVolume: 0,
            volume24h: 0,
            totalTrades: 0,
            trades24h: 0,
            winningTrades: 0,
            losingTrades: 0,
          });
        }

        const user = userMap.get(activity.userAddress);
        user.totalVolume += activity.totalValue || 0;
        user.totalTrades++;
      }

      for (const activity of activities24h) {
        const user = userMap.get(activity.userAddress);
        if (user) {
          user.volume24h += activity.totalValue || 0;
          user.trades24h++;
        }
      }

      // Convert to array and sort
      const traders: TraderMetrics[] = Array.from(userMap.values())
        .map((user) => ({
          address: user.address,
          totalVolume: user.totalVolume,
          volume24h: user.volume24h,
          totalTrades: user.totalTrades,
          trades24h: user.trades24h,
          profitLoss: 0, // TODO: Calculate from positions
          winRate: 0, // TODO: Calculate from resolved positions
          winningTrades: user.winningTrades,
          losingTrades: user.losingTrades,
        }))
        .sort((a, b) => b.totalVolume - a.totalVolume)
        .slice(0, limit);

      return NextResponse.json({
        traders,
        total: userMap.size,
        limit,
      });
    }

    // Format user stats
    const traders: TraderMetrics[] = userStats.map((stat) => ({
      address: stat.userAddress,
      totalVolume: stat.totalVolume,
      volume24h: stat.volume24h,
      totalTrades: stat.totalTrades,
      trades24h: stat.trades24h,
      profitLoss: stat.totalPnL,
      winRate: stat.winRate,
      winningTrades: stat.winningTrades,
      losingTrades: stat.losingTrades,
    }));

    return NextResponse.json({
      traders,
      total: traders.length,
      limit,
    });
  } catch (error) {
    console.error("Error fetching top traders:", error);
    return NextResponse.json(
      { error: "Failed to fetch top traders" },
      { status: 500 },
    );
  }
}
