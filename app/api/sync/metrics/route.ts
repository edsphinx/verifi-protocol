/**
 * @file Sync Metrics API Route
 * @description Proxy route to trigger metrics sync on the sync service
 */

import { NextResponse } from "next/server";

const SYNC_SERVICE_URL = process.env.SYNC_SERVICE_URL || "http://198.144.183.32:3001";

export async function POST() {
  try {
    const response = await fetch(`${SYNC_SERVICE_URL}/sync/metrics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Sync service returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data,
      message: "Protocol metrics sync triggered successfully",
    });
  } catch (error) {
    console.error("Error triggering metrics sync:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to trigger metrics sync",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to trigger metrics sync",
    endpoint: "/api/sync/metrics",
    method: "POST",
  });
}
