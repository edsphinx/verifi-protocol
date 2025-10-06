/**
 * @file Recent Activities API Route
 * @description Get recent platform activities
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/clients/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "20", 10);

    // Fetch recent activities with market info
    const activities = await prisma.activity.findMany({
      take: limit,
      orderBy: {
        timestamp: "desc",
      },
      include: {
        market: {
          select: {
            description: true,
          },
        },
      },
    });

    // Transform to match expected format
    const formattedActivities = activities.map((activity) => ({
      id: activity.id,
      type: activity.action,
      user: activity.userAddress,
      marketAddress: activity.marketAddress,
      marketDescription: activity.market?.description || "Unknown Market",
      amount: activity.amount,
      price: activity.price || null,
      timestamp: activity.timestamp.toISOString(),
    }));

    return NextResponse.json({
      activities: formattedActivities,
      total: formattedActivities.length,
    });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent activities" },
      { status: 500 },
    );
  }
}
