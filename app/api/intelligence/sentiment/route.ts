/**
 * Market Sentiment API
 * Analyzes trading flow patterns via Nodit data
 */

import { NextResponse } from "next/server";
import { analyzeMarketSentiment } from "@/lib/engine/nodit-intelligence.engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketAddress = searchParams.get("market");

    if (!marketAddress) {
      return NextResponse.json(
        { success: false, error: "Market address required" },
        { status: 400 },
      );
    }

    const sentiment = await analyzeMarketSentiment(marketAddress);

    if (!sentiment) {
      return NextResponse.json(
        { success: false, error: "Market not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      sentiment,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API /api/intelligence/sentiment] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
