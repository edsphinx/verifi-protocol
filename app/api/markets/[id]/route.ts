import { type NextRequest, NextResponse } from "next/server";
import { getMarketByAddress } from "@/services/market.service";

/**
 * @notice GET handler for fetching a single market by its address.
 * @dev This uses the required signature for a Next.js 15 dynamic API route:
 * 1. The request object.
 * 2. A context object containing the dynamic `params` (which is now a Promise).
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    // In Next.js 15, params is a Promise that must be awaited
    const { id: marketId } = await context.params;
    const market = await getMarketByAddress(marketId);

    if (!market) {
      return NextResponse.json({ error: "Market not found" }, { status: 404 });
    }

    return NextResponse.json(market);
  } catch (error) {
    const { id } = await context.params;
    console.error(`Error fetching market for id ${id}:`, error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

