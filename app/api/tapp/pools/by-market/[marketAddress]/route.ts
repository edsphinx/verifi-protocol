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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ marketAddress: string }> }
) {
  try {
    const { marketAddress } = await params;
    const body = await request.json();
    const { poolAddress, yesTokenAddress, noTokenAddress, creatorAddress } = body;

    console.log(`[API /api/tapp/pools/by-market] Creating pool record for market: ${marketAddress}`);

    // Check if pool already exists
    const existingPool = await client.tappPool.findFirst({
      where: { marketAddress },
    });

    if (existingPool) {
      console.log(`[API /api/tapp/pools/by-market] Pool already exists for market: ${marketAddress}`);
      return NextResponse.json(existingPool);
    }

    // Create new pool record
    const pool = await client.tappPool.create({
      data: {
        poolAddress,
        marketAddress,
        yesTokenAddress,
        noTokenAddress,
        hookType: 4, // HOOK_PREDICTION
        fee: 3000, // 0.3%
        creatorAddress: creatorAddress || poolAddress, // Use creator if provided, otherwise pool address
        totalLiquidity: 0,
        volume24h: 0,
      },
    });

    console.log(`[API /api/tapp/pools/by-market] Pool record created:`, pool.poolAddress);
    return NextResponse.json(pool);
  } catch (error) {
    console.error("[API /api/tapp/pools/by-market] Error creating pool:", error);

    if (error instanceof Error) {
      console.error("[API /api/tapp/pools/by-market] Error details:", error.message);
    }

    return NextResponse.json(
      { error: "Failed to create pool record" },
      { status: 500 }
    );
  }
}
