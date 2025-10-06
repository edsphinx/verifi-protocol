/**
 * Smart Alerts API
 * Context-aware notifications powered by Nodit intelligence
 */

import { NextResponse } from "next/server";
import { generateSmartAlerts } from "@/lib/engine/nodit-intelligence.engine";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketAddress = searchParams.get("market") || undefined;

    const alerts = await generateSmartAlerts(marketAddress);

    return NextResponse.json({
      success: true,
      count: alerts.length,
      alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API /api/intelligence/alerts] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
