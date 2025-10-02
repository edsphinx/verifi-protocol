/**
 * GET /api/tapp-pools/by-market/[marketAddress]
 * Returns the Tapp pool associated with a specific market
 */

import { NextResponse } from "next/server";
import { getTappPoolByMarket } from "@/services/tapp-pool.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ marketAddress: string }> }
) {
  try {
    // In Next.js 15, params is a Promise that must be awaited
    const { marketAddress } = await params;

    const pool = await getTappPoolByMarket(marketAddress);

    if (!pool) {
      return NextResponse.json(
        { error: "Pool not found for this market" },
        { status: 404 }
      );
    }

    return NextResponse.json(pool);
  } catch (error) {
    console.error("Error fetching Tapp pool:", error);
    return NextResponse.json(
      { error: "Failed to fetch pool" },
      { status: 500 }
    );
  }
}
