import { NextResponse } from "next/server";
import { getActiveMarkets } from "@/services/market.service";

export async function GET() {
  try {
    const markets = await getActiveMarkets();
    return NextResponse.json(markets);
  } catch (error) {
    console.error("Error fetching markets:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 },
    );
  }
}
