/**
 * @file Sync Pools API Route
 * @description Proxy route to trigger pools stats sync on the sync service
 */

import { NextResponse } from "next/server";

const SYNC_SERVICE_URL = process.env.SYNC_SERVICE_URL || "http://198.144.183.32:3001";

export async function POST() {
  try {
    const response = await fetch(`${SYNC_SERVICE_URL}/sync/pools`, {
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
      message: "Pool stats sync triggered successfully",
    });
  } catch (error) {
    console.error("Error triggering pools sync:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to trigger pools sync",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to trigger pools sync",
    endpoint: "/api/sync/pools",
    method: "POST",
  });
}
