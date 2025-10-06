import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import type {
  PortfolioData,
  PortfolioPosition,
} from "@/lib/types/database.types";
import { aptosClient } from "@/aptos/client";
import { MODULE_ADDRESS } from "@/aptos/constants";
import type { InputViewFunctionData } from "@aptos-labs/ts-sdk";

const prisma = new PrismaClient();

// Helper to fetch positions from blockchain
async function fetchBlockchainPositions(
  userAddress: string,
  marketAddresses: string[],
) {
  try {
    const payload: InputViewFunctionData = {
      function: `${MODULE_ADDRESS}::verifi_protocol::get_user_positions`,
      functionArguments: [userAddress, marketAddresses],
    };

    const result = await aptosClient().view({ payload });

    // Result is an array of UserPosition structs
    const positions = result[0] as any[];

    return positions.map((pos: any) => ({
      marketAddress: pos.market_address,
      yesBalance: Number(pos.yes_balance) / 1_000_000, // Convert from octas
      noBalance: Number(pos.no_balance) / 1_000_000,
      yesValue: Number(pos.yes_value) / 100_000_000, // APT is 8 decimals
      noValue: Number(pos.no_value) / 100_000_000,
      totalValue: Number(pos.total_value) / 100_000_000,
    }));
  } catch (error) {
    console.error("Error fetching blockchain positions:", error);
    return [];
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> },
) {
  try {
    const { address } = await params;

    if (!address) {
      return NextResponse.json(
        { error: "Address parameter is required" },
        { status: 400 },
      );
    }

    // Get user positions from database
    const dbPositions = await prisma.userPosition.findMany({
      where: {
        userAddress: address,
        status: { in: ["OPEN", "RESOLVED"] },
      },
      include: {
        market: {
          include: {
            pools: true,
          },
        },
      },
    });

    // Get liquidity positions
    const liquidityPositions = await prisma.liquidityPosition.findMany({
      where: {
        userAddress: address,
        status: "ACTIVE",
      },
      include: {
        pool: {
          include: {
            market: true,
          },
        },
      },
    });

    // Use DB positions if available, otherwise fetch from blockchain
    let positions: any[] = [];

    if (dbPositions.length > 0) {
      // Use positions from database (already calculated)
      positions = dbPositions.map((p) => ({
        marketAddress: p.marketAddress,
        market: p.market,
        outcome: p.outcome,
        sharesOwned: p.sharesOwned,
        totalInvested: p.totalInvested,
        avgEntryPrice: p.avgEntryPrice,
        currentPrice: p.currentPrice,
        currentValue: p.currentValue,
        unrealizedPnL: p.unrealizedPnL,
        unrealizedPnLPct: p.unrealizedPnLPct,
        status: p.status,
      }));
    } else {
      // Fetch positions directly from blockchain
      console.log(
        "[Portfolio API] No DB positions, fetching from blockchain...",
      );

      // Get all active markets
      const allMarkets = await prisma.market.findMany({
        select: { marketAddress: true, description: true, status: true },
      });

      if (allMarkets.length > 0) {
        const marketAddresses = allMarkets.map((m) => m.marketAddress);
        const blockchainPositions = await fetchBlockchainPositions(
          address,
          marketAddresses,
        );

        console.log(
          "[Portfolio API] Blockchain positions:",
          blockchainPositions,
        );

        // Convert blockchain positions to portfolio format
        positions = blockchainPositions
          .filter((bp) => bp.yesBalance > 0 || bp.noBalance > 0)
          .flatMap((bp) => {
            const market = allMarkets.find(
              (m) => m.marketAddress === bp.marketAddress,
            );
            const results = [];

            // Create YES position if user has YES shares
            if (bp.yesBalance > 0) {
              results.push({
                marketAddress: bp.marketAddress,
                market,
                outcome: "YES",
                sharesOwned: bp.yesBalance,
                avgEntryPrice: 0, // We don't have historical data
                totalInvested: 0, // We don't have historical data
                currentPrice:
                  bp.yesBalance > 0 ? bp.yesValue / bp.yesBalance : 0,
                currentValue: bp.yesValue,
                unrealizedPnL: 0, // Can't calculate without totalInvested
                unrealizedPnLPct: 0,
                status: market?.status === "active" ? "OPEN" : "RESOLVED",
              });
            }

            // Create NO position if user has NO shares
            if (bp.noBalance > 0) {
              results.push({
                marketAddress: bp.marketAddress,
                market,
                outcome: "NO",
                sharesOwned: bp.noBalance,
                avgEntryPrice: 0,
                totalInvested: 0,
                currentPrice: bp.noBalance > 0 ? bp.noValue / bp.noBalance : 0,
                currentValue: bp.noValue,
                unrealizedPnL: 0,
                unrealizedPnLPct: 0,
                status: market?.status === "active" ? "OPEN" : "RESOLVED",
              });
            }

            return results;
          });
      }
    }

    // Calculate portfolio totals
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalInvested = positions.reduce(
      (sum, p) => sum + p.totalInvested,
      0,
    );
    const unrealizedPnL = totalValue - totalInvested;
    const unrealizedPnLPct =
      totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

    // Get user stats
    const activities = await prisma.activity.findMany({
      where: {
        userAddress: address,
        action: { in: ["BUY", "SELL"] },
      },
    });

    const totalTrades = activities.length;
    const totalVolume = activities.reduce(
      (sum, a) => sum + (a.totalValue || 0),
      0,
    );

    // Convert Prisma positions to PortfolioPosition format
    const formattedPositions: PortfolioPosition[] = positions.map((p) => ({
      marketAddress: p.marketAddress,
      marketDescription: "market" in p ? (p as any).market.description : "",
      outcome: p.outcome,
      sharesOwned: p.sharesOwned,
      avgEntryPrice: p.avgEntryPrice,
      totalInvested: p.totalInvested,
      currentPrice: p.currentPrice,
      currentValue: p.currentValue,
      unrealizedPnL: p.unrealizedPnL,
      unrealizedPnLPct: p.unrealizedPnLPct,
      status: p.status,
      pools:
        "market" in p && (p as any).market?.pools
          ? (p as any).market.pools.map((pool: any) => ({
              poolAddress: pool.poolAddress,
              fee: pool.fee,
              totalLiquidity: pool.totalLiquidity,
            }))
          : [],
    }));

    // Separate open and closed positions
    const openPositions = formattedPositions.filter((p) => p.status === "OPEN");
    const closedPositions = formattedPositions.filter(
      (p) => p.status === "CLOSED" || p.status === "RESOLVED",
    );

    // Calculate LP totals
    const lpTotalValue = liquidityPositions.reduce(
      (sum, lp) => sum + lp.currentValue,
      0,
    );
    const lpTotalInvested = liquidityPositions.reduce(
      (sum, lp) => sum + lp.liquidityProvided,
      0,
    );

    const portfolio: PortfolioData = {
      // Overview
      totalValue: totalValue + lpTotalValue,
      totalInvested: totalInvested + lpTotalInvested,
      unrealizedPnL,
      unrealizedPnLPct,
      realizedPnL: 0, // TODO: Calculate from closed positions

      // Positions
      openPositions,
      closedPositions,
      totalPositions: positions.length,

      // Liquidity Positions
      liquidityPositions: liquidityPositions.map((lp) => ({
        id: lp.id,
        poolAddress: lp.poolAddress,
        marketAddress: lp.marketAddress,
        marketDescription: lp.pool.market?.description || "",
        lpTokens: lp.lpTokens,
        liquidityProvided: lp.liquidityProvided,
        yesAmount: lp.yesAmount,
        noAmount: lp.noAmount,
        currentValue: lp.currentValue,
        feesEarned: lp.feesEarned,
        unrealizedPnL: lp.unrealizedPnL,
        apr: lp.apr,
        status: lp.status,
        createdAt: lp.createdAt.toISOString(),
      })),

      // Stats
      stats: {
        totalTrades,
        totalVolume,
        winningTrades: 0, // TODO: Calculate
        losingTrades: 0, // TODO: Calculate
        winRate: 0, // TODO: Calculate
        avgTradeSize: totalTrades > 0 ? totalVolume / totalTrades : 0,
      },

      // Metadata
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(portfolio);
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 },
    );
  }
}
