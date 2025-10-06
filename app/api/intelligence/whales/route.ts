/**
 * Whale Detection API
 * Powered by Nodit real-time indexing
 */

import { NextResponse } from "next/server";
import { detectWhales } from "@/lib/engine/nodit-intelligence.engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const minVolume = parseFloat(searchParams.get("minVolume") || "100");

    const whales = await detectWhales(minVolume);

    return NextResponse.json({
      success: true,
      count: whales.length,
      whales,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API /api/intelligence/whales] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
