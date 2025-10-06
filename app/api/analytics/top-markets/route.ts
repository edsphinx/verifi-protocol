import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import type { MarketMetrics } from "@/lib/types/database.types";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get all markets with their metrics
    const markets = await prisma.market.findMany({
      where: {
        status: "active",
      },
      include: {
        activities: {
          where: {
            timestamp: { gte: yesterday },
            action: { in: ["BUY", "SELL"] },
          },
        },
      },
    });

    // Calculate metrics for each market
    const marketMetrics: MarketMetrics[] = markets.map((market) => {
      const activities24h = market.activities;

      const volume24h = activities24h.reduce(
        (sum, a) => sum + (a.totalValue || 0),
        0,
      );

      const trades24h = activities24h.length;

      const uniqueTraders = new Set(activities24h.map((a) => a.userAddress))
        .size;

      // Calculate price change (simplified - use actual price history in production)
      const priceChange24h = 0; // TODO: Calculate from price history

      return {
        marketAddress: market.marketAddress,
        description: market.description,
        category: market.category,
        status: market.status,

        // Metrics
        volume24h,
        totalVolume: market.totalVolume,
        trades24h,
        totalTrades: market.totalTrades,
        uniqueTraders,

        // Prices
        yesPrice: market.yesPrice,
        noPrice: market.noPrice,
        priceChange24h,

        // Supply
        yesSupply: market.yesSupply,
        noSupply: market.noSupply,

        // Resolution
        resolutionTimestamp: market.resolutionTimestamp.toISOString(),
      };
    });

    // Sort by volume24h descending
    marketMetrics.sort((a, b) => b.volume24h - a.volume24h);

    // Return top N markets
    const topMarkets = marketMetrics.slice(0, limit);

    return NextResponse.json({
      markets: topMarkets,
      total: marketMetrics.length,
      limit,
    });
  } catch (error) {
    console.error("Error fetching top markets:", error);
    return NextResponse.json(
      { error: "Failed to fetch top markets" },
      { status: 500 },
    );
  }
}
