import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { PortfolioData, PortfolioPosition } from '@/lib/types/database.types';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Get user positions from database
    const dbPositions = await prisma.userPosition.findMany({
      where: {
        userAddress: address,
        status: { in: ['OPEN', 'RESOLVED'] },
      },
      include: {
        market: true,
      },
    });

    // Use DB positions if available, otherwise calculate from activities
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
      // Calculate from activities if no positions in DB
        // Get user's trading activities
        const activities = await prisma.activity.findMany({
          where: {
            userAddress: address,
            action: { in: ['BUY', 'SELL'] },
          },
          orderBy: { timestamp: 'asc' },
          include: {
            market: true,
          },
        });

        // Group by market + outcome
        const positionMap = new Map<string, any>();

        for (const activity of activities) {
          if (!activity.market) continue;

          const key = `${activity.marketAddress}-${activity.outcome}`;

          if (!positionMap.has(key)) {
            positionMap.set(key, {
              marketAddress: activity.marketAddress,
              market: activity.market,
              outcome: activity.outcome,
              sharesOwned: 0,
              totalInvested: 0,
              trades: [],
            });
          }

          const position = positionMap.get(key);

          if (activity.action === 'BUY') {
            position.sharesOwned += activity.amount;
            position.totalInvested += activity.totalValue || 0;
          } else if (activity.action === 'SELL') {
            position.sharesOwned -= activity.amount;
          }

          position.trades.push(activity);
        }

        // Convert to position format
        positions = Array.from(positionMap.values())
          .filter((p) => p.sharesOwned > 0)
          .map((p) => {
            const avgEntryPrice =
              p.sharesOwned > 0 ? p.totalInvested / p.sharesOwned : 0;
            const currentPrice =
              p.outcome === 'YES' ? (p.market.yesPrice || 0.5) : (p.market.noPrice || 0.5);
            const currentValue = p.sharesOwned * currentPrice;
            const unrealizedPnL = currentValue - p.totalInvested;
            const unrealizedPnLPct =
              p.totalInvested > 0 ? (unrealizedPnL / p.totalInvested) * 100 : 0;

            return {
              marketAddress: p.marketAddress,
              market: p.market,
              outcome: p.outcome,
              sharesOwned: p.sharesOwned,
              avgEntryPrice,
              totalInvested: p.totalInvested,
              currentPrice,
              currentValue,
              unrealizedPnL,
              unrealizedPnLPct,
              status: p.market.status === 'active' ? 'OPEN' : 'RESOLVED',
            };
          });
      }

    // Calculate portfolio totals
    const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
    const totalInvested = positions.reduce(
      (sum, p) => sum + p.totalInvested,
      0
    );
    const unrealizedPnL = totalValue - totalInvested;
    const unrealizedPnLPct =
      totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

    // Get user stats
    const activities = await prisma.activity.findMany({
      where: {
        userAddress: address,
        action: { in: ['BUY', 'SELL'] },
      },
    });

    const totalTrades = activities.length;
    const totalVolume = activities.reduce(
      (sum, a) => sum + (a.totalValue || 0),
      0
    );

    // Convert Prisma positions to PortfolioPosition format
    const formattedPositions: PortfolioPosition[] = positions.map((p) => ({
      marketAddress: p.marketAddress,
      marketDescription: 'market' in p ? (p as any).market.description : '',
      outcome: p.outcome,
      sharesOwned: p.sharesOwned,
      avgEntryPrice: p.avgEntryPrice,
      totalInvested: p.totalInvested,
      currentPrice: p.currentPrice,
      currentValue: p.currentValue,
      unrealizedPnL: p.unrealizedPnL,
      unrealizedPnLPct: p.unrealizedPnLPct,
      status: p.status,
    }));

    // Separate open and closed positions
    const openPositions = formattedPositions.filter((p) => p.status === 'OPEN');
    const closedPositions = formattedPositions.filter(
      (p) => p.status === 'CLOSED' || p.status === 'RESOLVED'
    );

    const portfolio: PortfolioData = {
      // Overview
      totalValue,
      totalInvested,
      unrealizedPnL,
      unrealizedPnLPct,
      realizedPnL: 0, // TODO: Calculate from closed positions

      // Positions
      openPositions,
      closedPositions,
      totalPositions: positions.length,

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
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio' },
      { status: 500 }
    );
  }
}
