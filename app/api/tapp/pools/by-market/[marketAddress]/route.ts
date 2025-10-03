import { NextResponse } from "next/server";
import client from "@/lib/clients/prisma";
import { aptosClient } from "@/aptos/client";

const TAPP_PROTOCOL_ADDRESS = "0xf9c301c8cc04dc7bd99bc5cf3a18f45fbc47b8b3d6ea1ed2ee93c580a2eef932";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ marketAddress: string }> }
) {
  try {
    const { marketAddress } = await params;

    console.log(`[API /api/tapp/pools/by-market] 📊 Fetching pool for market: ${marketAddress.substring(0, 10)}...`);

    // First, check database
    let pool = await client.tappPool.findFirst({
      where: { marketAddress },
    });

    if (pool) {
      console.log(`[API /api/tapp/pools/by-market] ✅ Pool found in DB:`, pool.poolAddress.substring(0, 10) + '...');
      return NextResponse.json(pool);
    }

    // If not in DB, check on-chain
    console.log(`[API /api/tapp/pools/by-market] 🔍 Pool not in DB, checking on-chain...`);

    try {
      // Try to get pool info from Tapp protocol
      // If this succeeds, pool exists on-chain
      const poolInfo = await aptosClient().view({
        payload: {
          function: `${TAPP_PROTOCOL_ADDRESS}::router::get_pool_info`,
          functionArguments: [marketAddress],
        },
      });

      if (poolInfo && poolInfo.length > 0) {
        console.log(`[API /api/tapp/pools/by-market] ⚠️  Pool exists on-chain but not in DB`);

        // Return a minimal pool object to indicate it exists
        // Include default values for all expected fields
        return NextResponse.json({
          poolAddress: "unknown",
          marketAddress,
          totalLiquidity: 0,
          volume24h: 0,
          yesPrice: 0.5,
          noPrice: 0.5,
          poolExists: true,
          needsIndexing: true,
        });
      }
    } catch (onChainError: any) {
      // If view function fails, pool doesn't exist on-chain
      console.log(`[API /api/tapp/pools/by-market] ❌ Pool not found on-chain:`, onChainError.message);
    }

    console.log(`[API /api/tapp/pools/by-market] 🚫 No pool found for market: ${marketAddress.substring(0, 10)}...`);
    return NextResponse.json(null, { status: 404 });
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
