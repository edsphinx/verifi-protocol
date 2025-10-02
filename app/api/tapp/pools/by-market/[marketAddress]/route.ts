import { NextResponse } from "next/server";
import client from "@/lib/clients/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ marketAddress: string }> }
) {
  try {
    const { marketAddress } = await params;

    console.log(`[API /api/tapp/pools/by-market] Fetching pool for market: ${marketAddress}`);

    const pool = await client.tappPool.findFirst({
      where: { marketAddress },
    });

    if (!pool) {
      console.log(`[API /api/tapp/pools/by-market] No pool found for market: ${marketAddress}`);
      return NextResponse.json(null, { status: 404 });
    }

    console.log(`[API /api/tapp/pools/by-market] Pool found:`, pool.poolAddress);
    return NextResponse.json(pool);
  } catch (error) {
    console.error("[API /api/tapp/pools/by-market] Error fetching pool:", error);

    if (error instanceof Error) {
      console.error("[API /api/tapp/pools/by-market] Error details:", error.message);
    }

    return NextResponse.json(null, { status: 500 });
  }
}
