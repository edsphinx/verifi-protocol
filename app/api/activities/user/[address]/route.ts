/**
 * GET /api/activities/user/[address]
 * Returns activities for a specific user address
 */

import { NextResponse } from "next/server";
import { getActivitiesByUser } from "@/services/activity.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const activities = await getActivitiesByUser(address, limit);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error("Error fetching user activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 },
    );
  }
}
