/**
 * Market Metrics Service
 *
 * Calculates real-time metrics for markets to feed into the ranking engine
 */

import type { MarketMetrics } from "@/lib/engine/market-ranking.engine";
import { calculatePrices } from "@/lib/engine/data-integrity.engine";
import client from "@/lib/clients/prisma";

interface PoolData {
  poolAddress: string;
  yesReserve: number;
  noReserve: number;
  totalLiquidity: number;
}

interface ActivityData {
  tradeCount24h: number;
  uniqueTraders24h: number;
  volume24h: number;
  volume7d: number;
}

/**
 * Calculate metrics for a single market
 */
export async function calculateMarketMetrics(
  marketId: string,
  marketData: any,
  poolData?: PoolData,
): Promise<MarketMetrics> {
  // Get pool data if not provided
  let pool = poolData;
  if (!pool) {
    try {
      const poolResponse = await fetch(`/api/tapp/pools/by-market/${marketId}`);
      if (poolResponse.ok) {
        pool = await poolResponse.json();
      }
    } catch (error) {
      console.warn(`[MarketMetrics] No pool data for ${marketId}`);
    }
  }

  // Calculate current price
  let yesPrice = 0.5; // Default
  if (pool && pool.yesReserve > 0 && pool.noReserve > 0) {
    const priceResult = calculatePrices({
      yesReserve: pool.yesReserve,
      noReserve: pool.noReserve,
    });
    if (priceResult.success) {
      yesPrice = priceResult.data.yes;
    }
  }

  // Get activity data from database
  const activity = await getActivityData(marketId);

  // Calculate liquidity growth (mock for now - would need historical data)
  const liquidityGrowth24h = pool ? calculateLiquidityGrowth(pool) : 0;

  // Calculate price change (mock for now - would need price history)
  const priceChange24h = calculatePriceChange(marketId, yesPrice);

  // Calculate volatility (mock for now)
  const volatility24h = calculateVolatility(activity.tradeCount24h);

  // Calculate arbitrage opportunity (mock for now)
  const arbitrageOpportunity = calculateArbitrageOpportunity(yesPrice);

  // Calculate time until resolution
  const resolutionTimestamp =
    marketData.resolutionTimestamp || marketData.resolvesOnDate?.getTime() || 0;
  const hoursUntilResolution =
    (resolutionTimestamp - Date.now()) / (1000 * 60 * 60);

  // Get social metrics (mock for now - would integrate with comments/shares)
  const social = getSocialMetrics(marketId);

  return {
    marketId,
    totalLiquidity: pool?.totalLiquidity || 0,
    liquidityGrowth24h,
    volume24h: activity.volume24h,
    volume7d: activity.volume7d,
    volumeGrowth24h: calculateVolumeGrowth(activity),
    tradeCount24h: activity.tradeCount24h,
    uniqueTraders24h: activity.uniqueTraders24h,
    yesPrice,
    priceChange24h,
    volatility24h,
    arbitrageOpportunity,
    hoursUntilResolution,
    commentCount: social.commentCount,
    shareCount: social.shareCount,
  };
}

/**
 * Get activity data from database
 */
async function getActivityData(marketId: string): Promise<ActivityData> {
  try {
    // Get activities from last 24h
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activities24h = await client.activity.findMany({
      where: {
        marketAddress: marketId,
        timestamp: { gte: oneDayAgo },
        action: { in: ["BUY", "SELL", "SWAP"] },
      },
      select: {
        userAddress: true,
        amount: true,
      },
    });

    const activities7d = await client.activity.findMany({
      where: {
        marketAddress: marketId,
        timestamp: { gte: sevenDaysAgo },
        action: { in: ["BUY", "SELL", "SWAP"] },
      },
      select: {
        amount: true,
      },
    });

    // Calculate metrics
    const uniqueTraders = new Set(activities24h.map((a) => a.userAddress)).size;
    const volume24h = activities24h.reduce(
      (sum, a) => sum + (a.amount || 0),
      0,
    );
    const volume7d = activities7d.reduce((sum, a) => sum + (a.amount || 0), 0);

    return {
      tradeCount24h: activities24h.length,
      uniqueTraders24h: uniqueTraders,
      volume24h,
      volume7d,
    };
  } catch (error) {
    console.error("[MarketMetrics] Error getting activity data:", error);
    return {
      tradeCount24h: 0,
      uniqueTraders24h: 0,
      volume24h: 0,
      volume7d: 0,
    };
  }
}

/**
 * Calculate liquidity growth (mock implementation)
 * TODO: Implement with historical data from database
 */
function calculateLiquidityGrowth(pool: PoolData): number {
  // Mock: Use current liquidity as proxy
  // Higher liquidity = assume it's growing
  const liquidity = pool.totalLiquidity / 1_000_000; // Convert to display units

  if (liquidity > 10000) return 50;
  if (liquidity > 5000) return 30;
  if (liquidity > 1000) return 15;
  if (liquidity > 100) return 5;
  return 0;
}

/**
 * Calculate volume growth
 */
function calculateVolumeGrowth(activity: ActivityData): number {
  if (activity.volume7d === 0) return 0;

  // Daily average over 7 days
  const dailyAvg = activity.volume7d / 7;

  if (dailyAvg === 0) return 0;

  // Compare today vs average
  const growth = ((activity.volume24h - dailyAvg) / dailyAvg) * 100;

  return Math.max(-100, Math.min(1000, growth)); // Cap at -100% to +1000%
}

/**
 * Calculate price change (mock implementation)
 * TODO: Implement with price history from database
 */
function calculatePriceChange(marketId: string, currentPrice: number): number {
  // Mock: Use current price position as proxy
  // Prices far from 50% = more volatile
  const deviation = Math.abs(currentPrice - 0.5);

  if (deviation > 0.3) return 25; // Far from 50% = big move
  if (deviation > 0.2) return 15;
  if (deviation > 0.1) return 8;
  return 3;
}

/**
 * Calculate volatility based on trade count
 */
function calculateVolatility(tradeCount: number): number {
  // More trades = more volatility (rough proxy)
  if (tradeCount > 100) return 0.15;
  if (tradeCount > 50) return 0.1;
  if (tradeCount > 20) return 0.06;
  if (tradeCount > 5) return 0.03;
  return 0.01;
}

/**
 * Calculate arbitrage opportunity (mock)
 * TODO: Implement by comparing with other markets/oracles
 */
function calculateArbitrageOpportunity(yesPrice: number): number {
  // Mock: Markets far from 50% have higher arb potential
  const deviation = Math.abs(yesPrice - 0.5);

  if (deviation > 0.35) return 8;
  if (deviation > 0.25) return 5;
  if (deviation > 0.15) return 3;
  return 0;
}

/**
 * Get social metrics (mock implementation)
 * TODO: Integrate with comments/shares system
 */
function getSocialMetrics(marketId: string): {
  commentCount: number;
  shareCount: number;
} {
  // Mock data - would query from database
  return {
    commentCount: Math.floor(Math.random() * 50),
    shareCount: Math.floor(Math.random() * 20),
  };
}

/**
 * Calculate metrics for multiple markets
 */
export async function calculateAllMarketMetrics(
  markets: any[],
): Promise<MarketMetrics[]> {
  const metricsPromises = markets.map(async (market) => {
    try {
      return await calculateMarketMetrics(market.id || market.address, market);
    } catch (error) {
      console.error(
        `[MarketMetrics] Error calculating metrics for ${market.id}:`,
        error,
      );
      // Return default metrics on error
      return {
        marketId: market.id || market.address,
        totalLiquidity: 0,
        liquidityGrowth24h: 0,
        volume24h: 0,
        volume7d: 0,
        volumeGrowth24h: 0,
        tradeCount24h: 0,
        uniqueTraders24h: 0,
        yesPrice: 0.5,
        priceChange24h: 0,
        volatility24h: 0,
        arbitrageOpportunity: 0,
        hoursUntilResolution: 24 * 7, // 1 week default
        commentCount: 0,
        shareCount: 0,
      };
    }
  });

  return await Promise.all(metricsPromises);
}

export const MarketMetricsService = {
  calculateMarketMetrics,
  calculateAllMarketMetrics,
} as const;

export default MarketMetricsService;
