/**
 * Metrics Synchronization API
 *
 * Endpoint to manually trigger or schedule metrics sync
 * Should be called periodically (every 5-10 minutes) by a cron job or manually
 */

import { NextResponse } from "next/server";
import { syncAllMetrics } from "@/lib/engine/metrics-sync.engine";

export async function POST(request: Request) {
  try {
    console.log("[API /api/metrics/sync] Starting metrics synchronization...");

    const result = await syncAllMetrics();

    if (!result.success) {
      console.error(
        "[API /api/metrics/sync] Sync completed with errors:",
        result.errors,
      );
      return NextResponse.json(
        {
          ...result,
          message: "Metrics sync completed with errors",
        },
        { status: 207 }, // Multi-Status
      );
    }

    console.log("[API /api/metrics/sync] Sync completed successfully");
    return NextResponse.json(
      {
        ...result,
        message: "Metrics synced successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("[API /api/metrics/sync] Fatal error during sync:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Fatal error during metrics sync",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// Optional: GET endpoint to check last sync status
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/metrics/sync",
    method: "POST",
    description: "Triggers metrics synchronization for all markets and pools",
    usage: "POST /api/metrics/sync",
  });
}
