/**
 * @file Sync Status API Route
 * @description Get status from sync service and indexer service
 */

import { NextResponse } from "next/server";

const SYNC_SERVICE_URL = process.env.SYNC_SERVICE_URL || "http://198.144.183.32:3001";
const INDEXER_SERVICE_URL = process.env.INDEXER_SERVICE_URL || "http://198.144.183.32:3002";

export async function GET() {
  try {
    // Fetch both service statuses in parallel
    const [syncResponse, indexerResponse] = await Promise.allSettled([
      fetch(`${SYNC_SERVICE_URL}/status`, { cache: "no-store" }),
      fetch(`${INDEXER_SERVICE_URL}/status`, { cache: "no-store" }),
    ]);

    const syncStatus =
      syncResponse.status === "fulfilled" && syncResponse.value.ok
        ? await syncResponse.value.json()
        : { status: "error", message: "Sync service unavailable" };

    const indexerStatus =
      indexerResponse.status === "fulfilled" && indexerResponse.value.ok
        ? await indexerResponse.value.json()
        : { status: "error", message: "Indexer service unavailable" };

    return NextResponse.json({
      syncService: {
        url: SYNC_SERVICE_URL,
        ...syncStatus,
        online: syncResponse.status === "fulfilled" && syncResponse.value.ok,
      },
      indexerService: {
        url: INDEXER_SERVICE_URL,
        ...indexerStatus,
        online: indexerResponse.status === "fulfilled" && indexerResponse.value.ok,
      },
    });
  } catch (error) {
    console.error("Error fetching sync status:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch service status",
        syncService: { online: false },
        indexerService: { online: false },
      },
      { status: 500 }
    );
  }
}
