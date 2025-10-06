/**
 * @file Volume History API Route
 * @description Get historical volume data for charting
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/clients/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = Number.parseInt(searchParams.get("days") || "7", 10);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get activities grouped by day
    const activities = await prisma.activity.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        timestamp: true,
        amount: true,
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    // Group by day
    const volumeByDay = new Map<string, { volume: number; trades: number }>();

    for (const activity of activities) {
      const dateKey = activity.timestamp.toISOString().split("T")[0];
      const existing = volumeByDay.get(dateKey) || { volume: 0, trades: 0 };
      volumeByDay.set(dateKey, {
        volume: existing.volume + activity.amount,
        trades: existing.trades + 1,
      });
    }

    // Generate data points for all days (fill missing days with 0)
    const data = [];
    let totalVolume = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      const dayData = volumeByDay.get(dateKey) || { volume: 0, trades: 0 };

      data.push({
        date: dateKey,
        volume: dayData.volume,
        trades: dayData.trades,
      });

      totalVolume += dayData.volume;
    }

    const average = data.length > 0 ? totalVolume / data.length : 0;

    return NextResponse.json({
      data,
      total: totalVolume,
      average,
    });
  } catch (error) {
    console.error("Error fetching volume history:", error);
    return NextResponse.json(
      { error: "Failed to fetch volume history" },
      { status: 500 },
    );
  }
}
