import { type NextRequest, NextResponse } from "next/server";
import { buildCreateMarketPayload } from "@/aptos/transactions/create-market-transaction";

export async function POST(req: NextRequest) {
  try {
    console.log('[API /api/markets/create] Request received');
    const body = await req.json();
    console.log('[API /api/markets/create] Request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.description || typeof body.description !== 'string') {
      console.error('[API /api/markets/create] Invalid description:', body.description);
      return NextResponse.json(
        { error: "Description is required and must be a string" },
        { status: 400 },
      );
    }

    if (!body.resolutionTimestamp || typeof body.resolutionTimestamp !== 'number') {
      console.error('[API /api/markets/create] Invalid resolutionTimestamp:', body.resolutionTimestamp);
      return NextResponse.json(
        { error: "Resolution timestamp is required and must be a number" },
        { status: 400 },
      );
    }

    if (!body.resolverAddress || typeof body.resolverAddress !== 'string') {
      console.error('[API /api/markets/create] Invalid resolverAddress:', body.resolverAddress);
      return NextResponse.json(
        { error: "Resolver address is required and must be a string" },
        { status: 400 },
      );
    }

    if (!body.oracleId || typeof body.oracleId !== 'string') {
      console.error('[API /api/markets/create] Invalid oracleId:', body.oracleId);
      return NextResponse.json(
        { error: "Oracle ID is required and must be a string" },
        { status: 400 },
      );
    }

    if (!body.targetAddress || typeof body.targetAddress !== 'string') {
      console.error('[API /api/markets/create] Invalid targetAddress:', body.targetAddress);
      return NextResponse.json(
        { error: "Target address is required and must be a string" },
        { status: 400 },
      );
    }

    if (typeof body.targetValue !== 'number') {
      console.error('[API /api/markets/create] Invalid targetValue:', body.targetValue);
      return NextResponse.json(
        { error: "Target value must be a number" },
        { status: 400 },
      );
    }

    if (typeof body.operator !== 'number') {
      console.error('[API /api/markets/create] Invalid operator:', body.operator);
      return NextResponse.json(
        { error: "Operator must be a number (0 or 1)" },
        { status: 400 },
      );
    }

    console.log('[API /api/markets/create] Building payload...');
    const payload = buildCreateMarketPayload(body);
    console.log('[API /api/markets/create] Payload built successfully:', JSON.stringify(payload, null, 2));

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[API /api/markets/create] Error creating create_market payload:", error);

    if (error instanceof Error) {
      console.error("[API /api/markets/create] Error name:", error.name);
      console.error("[API /api/markets/create] Error message:", error.message);
      console.error("[API /api/markets/create] Error stack:", error.stack);
    }

    return NextResponse.json(
      {
        error: "Failed to construct transaction",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 },
    );
  }
}
