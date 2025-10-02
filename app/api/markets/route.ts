import { NextResponse } from "next/server";
import { getActiveMarkets } from "@/services/market.service";

export async function GET() {
  try {
    console.log('[API /api/markets] GET request received');
    const markets = await getActiveMarkets();
    console.log(`[API /api/markets] Returning ${markets.length} markets to client`);
    return NextResponse.json(markets);
  } catch (error) {
    console.error("[API /api/markets] Error fetching markets:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 },
    );
  }
}
