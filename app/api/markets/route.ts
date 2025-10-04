import { NextResponse } from "next/server";
import { getActiveMarkets } from "@/services/market.service";

export async function GET() {
  try {
    console.log("[API /api/markets] GET request received");
    const markets = await getActiveMarkets();
    console.log(
      `[API /api/markets] Returning ${markets.length} markets to client`,
    );

    // Always return an array, even if empty
    if (!markets || !Array.isArray(markets)) {
      console.warn(
        "[API /api/markets] Markets is not an array, returning empty array",
      );
      return NextResponse.json([]);
    }

    return NextResponse.json(markets);
  } catch (error) {
    console.error("[API /api/markets] Error fetching markets:", error);

    // Log full error details for debugging
    if (error instanceof Error) {
      console.error("[API /api/markets] Error message:", error.message);
      console.error("[API /api/markets] Error stack:", error.stack);
    }

    // Return empty array instead of error to prevent UI from breaking
    // The UI will show "No markets found" message
    return NextResponse.json([]);
  }
}
