/**
 * Market Momentum API
 * Real-time momentum analysis powered by Nodit
 */

import { NextResponse } from "next/server";
import {
  getTopMomentumMarkets,
  analyzeMarketMomentum,
} from "@/lib/engine/nodit-intelligence.engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketAddress = searchParams.get("market");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (marketAddress) {
      // Get momentum for specific market
      const momentum = await analyzeMarketMomentum(marketAddress);

      if (!momentum) {
        return NextResponse.json(
          { success: false, error: "Market not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        momentum,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Get top momentum markets
      const markets = await getTopMomentumMarkets(limit);

      return NextResponse.json({
        success: true,
        count: markets.length,
        markets,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("[API /api/intelligence/momentum] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
