import { NextResponse } from "next/server";
import prisma from "@/lib/clients/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userAddress: string }> }
) {
  try {
    const { userAddress } = await params;

    // Fetch user stats from database
    const userStats = await prisma.userStats.findUnique({
      where: { userAddress },
    });

    if (!userStats) {
      // Return default stats if user hasn't traded yet
      return NextResponse.json({
        userAddress,
        totalVolume: 0,
        volume24h: 0,
        totalTrades: 0,
        trades24h: 0,
        totalPnL: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalLiquidityProvided: 0,
        feesEarnedAllTime: 0,
      });
    }

    return NextResponse.json(userStats);
  } catch (error) {
    console.error("Error fetching trader stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch trader stats" },
      { status: 500 }
    );
  }
}
