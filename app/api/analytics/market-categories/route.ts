/**
 * @file Market Categories API Route
 * @description Get market distribution by category
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/clients/prisma";

export async function GET() {
  try {
    // Get all markets with their categories
    const markets = await prisma.market.findMany({
      select: {
        category: true,
        totalVolume: true,
      },
    });

    // Group by category
    const categoryMap = new Map<
      string,
      { count: number; volume: number }
    >();

    for (const market of markets) {
      const category = market.category || "Other";
      const existing = categoryMap.get(category) || { count: 0, volume: 0 };
      categoryMap.set(category, {
        count: existing.count + 1,
        volume: existing.volume + (market.totalVolume || 0),
      });
    }

    // Calculate percentages
    const total = markets.length;
    const categories = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        count: data.count,
        volume: data.volume,
        percentage: total > 0 ? (data.count / total) * 100 : 0,
      }),
    );

    // Sort by count descending
    categories.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      categories,
      total,
    });
  } catch (error) {
    console.error("Error fetching market categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch market categories" },
      { status: 500 },
    );
  }
}
