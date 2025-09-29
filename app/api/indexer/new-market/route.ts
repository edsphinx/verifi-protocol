import { type NextRequest, NextResponse } from "next/server";
import { recordNewMarket } from "@/services/market.service";

export async function POST(req: NextRequest) {
  try {
    const eventData = await req.json();
    const { market_address, creator, description, resolution_timestamp } =
      eventData;

    await recordNewMarket({
      marketAddress: market_address,
      creatorAddress: creator,
      description: description,
      resolutionTimestamp: new Date(resolution_timestamp * 1000),
    });

    return NextResponse.json({ success: true, message: "Market indexed." });
  } catch (error) {
    console.error("Error in new-market indexer:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
