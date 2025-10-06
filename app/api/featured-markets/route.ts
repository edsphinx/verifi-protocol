/**
 * Featured Markets API
 *
 * GET /api/featured-markets
 * Returns top ranked markets with FOMO triggers
 */

import { NextResponse } from "next/server";
import { MarketMetricsService } from "@/lib/services/market-metrics.service";
import { MarketRankingEngine } from "@/lib/engine/market-ranking.engine";
import client from "@/lib/clients/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60; // Cache for 60 seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get("count") || "3", 10);
    const includeAll = searchParams.get("includeAll") === "true";

    console.log("[API /api/featured-markets] Fetching featured markets...");

    // Get all active markets from database
    const markets = await client.market.findMany({
      where: {
        status: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: includeAll ? undefined : 50, // Limit to 50 for performance
    });

    if (markets.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No active markets found",
      });
    }

    console.log(
      `[API /api/featured-markets] Found ${markets.length} active markets`,
    );

    // Calculate metrics for all markets
    const allMetrics =
      await MarketMetricsService.calculateAllMarketMetrics(markets);

    console.log(
      "[API /api/featured-markets] Calculated metrics for all markets",
    );

    // Get featured markets (top N ranked)
    const featuredMarkets = MarketRankingEngine.getFeaturedMarkets(
      allMetrics,
      count,
    );

    console.log(
      `[API /api/featured-markets] Returning top ${featuredMarkets.length} featured markets`,
    );

    // Enrich with market data
    const enrichedMarkets = featuredMarkets.map((featured) => {
      const market = markets.find((m) => m.id === featured.marketId);

      return {
        ...featured,
        market: {
          id: market?.id,
          address: market?.marketAddress,
          description: market?.description,
          resolutionTimestamp: market?.resolutionTimestamp,
          status: market?.status,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: enrichedMarkets,
      count: enrichedMarkets.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[API /api/featured-markets] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch featured markets",
        message: error.message,
      },
      { status: 500 },
    );
  }
}
