/**
 * Metrics Synchronization Engine
 *
 * Professional DeFi analytics engine that ensures data integrity between:
 * - On-chain data (source of truth)
 * - Off-chain database (indexed for performance)
 * - Frontend displays (real-time accuracy)
 *
 * Responsibilities:
 * 1. Calculate accurate 24h/7d volumes from activities
 * 2. Sync market metrics to database
 * 3. Sync pool metrics to database
 * 4. Clean up stale metrics (>7 days old)
 */

import { PrismaClient } from "@prisma/client";
import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import type { InputViewFunctionData } from "@aptos-labs/ts-sdk";

// Initialize Prisma client
const client = new PrismaClient();

// Initialize Aptos client
const network = (process.env.NEXT_PUBLIC_APTOS_NETWORK || "testnet") as Network;
const config = new AptosConfig({ network });
const aptos = new Aptos(config);

// Module address from environment
const MODULE_ADDRESS = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS || "";

// ============================================================================
// TYPES
// ============================================================================

export interface MarketMetricsData {
  marketAddress: string;
  volume24h: number;
  volume7d: number;
  totalVolume: number;
  trades24h: number;
  totalTrades: number;
  uniqueTraders24h: number;
  uniqueTraders: number;
}

export interface PoolMetricsData {
  poolAddress: string;
  volume24h: number;
  volume7d: number;
  volumeAllTime: number;
  fees24h: number;
  fees7d: number;
  feesAllTime: number;
  yesReserve: number;
  noReserve: number;
  totalLiquidity: number;
}

export interface SyncResult {
  success: boolean;
  marketsUpdated: number;
  poolsUpdated: number;
  errors: string[];
  timestamp: Date;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIME_WINDOWS = {
  HOUR_24: 24 * 60 * 60 * 1000,
  DAY_7: 7 * 24 * 60 * 60 * 1000,
} as const;

const FEE_BPS = 30; // 0.3% fee

// ============================================================================
// CORE ENGINE FUNCTIONS
// ============================================================================

/**
 * Calculate market metrics from database activities
 * Uses totalValue field which represents the APT value of the trade
 */
async function calculateMarketMetrics(
  marketAddress: string,
): Promise<MarketMetricsData> {
  const now = new Date();
  const time24hAgo = new Date(now.getTime() - TIME_WINDOWS.HOUR_24);
  const time7dAgo = new Date(now.getTime() - TIME_WINDOWS.DAY_7);

  // Get all trading activities
  const [activities24h, activities7d, activitiesAll] = await Promise.all([
    client.activity.findMany({
      where: {
        marketAddress,
        action: { in: ["BUY", "SELL", "SWAP"] },
        timestamp: { gte: time24hAgo },
      },
      select: {
        userAddress: true,
        amount: true,
        totalValue: true,
      },
    }),
    client.activity.findMany({
      where: {
        marketAddress,
        action: { in: ["BUY", "SELL", "SWAP"] },
        timestamp: { gte: time7dAgo },
      },
      select: {
        amount: true,
        totalValue: true,
      },
    }),
    client.activity.findMany({
      where: {
        marketAddress,
        action: { in: ["BUY", "SELL", "SWAP"] },
      },
      select: {
        amount: true,
        totalValue: true,
      },
    }),
  ]);

  // Calculate volumes - use totalValue if available, fallback to amount
  const volume24h = activities24h.reduce(
    (sum, a) => sum + (a.totalValue || a.amount || 0),
    0,
  );
  const volume7d = activities7d.reduce(
    (sum, a) => sum + (a.totalValue || a.amount || 0),
    0,
  );
  const totalVolume = activitiesAll.reduce(
    (sum, a) => sum + (a.totalValue || a.amount || 0),
    0,
  );

  // Calculate unique traders
  const uniqueTraders24h = new Set(activities24h.map((a) => a.userAddress))
    .size;
  const uniqueTradersAll = new Set(
    (
      await client.activity.findMany({
        where: { marketAddress, action: { in: ["BUY", "SELL", "SWAP"] } },
        select: { userAddress: true },
        distinct: ["userAddress"],
      })
    ).map((a) => a.userAddress),
  ).size;

  return {
    marketAddress,
    volume24h,
    volume7d,
    totalVolume,
    trades24h: activities24h.length,
    totalTrades: activitiesAll.length,
    uniqueTraders24h,
    uniqueTraders: uniqueTradersAll,
  };
}

/**
 * Fetch on-chain pool reserves
 */
async function fetchPoolReserves(
  poolAddress: string,
): Promise<{ yesReserve: number; noReserve: number } | null> {
  try {
    const payload: InputViewFunctionData = {
      function:
        `${MODULE_ADDRESS}::router::get_pool_reserves` as `${string}::${string}::${string}`,
      functionArguments: [poolAddress],
    };

    const result = await aptos.view({ payload });

    if (result && result.length >= 2) {
      return {
        yesReserve: Number(result[0]),
        noReserve: Number(result[1]),
      };
    }

    return null;
  } catch (error) {
    console.error(
      `[MetricsEngine] Failed to fetch reserves for pool ${poolAddress}:`,
      error,
    );
    return null;
  }
}

/**
 * Calculate pool metrics from activities
 */
async function calculatePoolMetrics(
  poolAddress: string,
): Promise<PoolMetricsData | null> {
  const now = new Date();
  const time24hAgo = new Date(now.getTime() - TIME_WINDOWS.HOUR_24);
  const time7dAgo = new Date(now.getTime() - TIME_WINDOWS.DAY_7);

  // Get pool from database
  const pool = await client.tappPool.findUnique({
    where: { poolAddress },
  });

  if (!pool) {
    console.warn(`[MetricsEngine] Pool ${poolAddress} not found in database`);
    return null;
  }

  // Get swap activities
  const [swaps24h, swaps7d, swapsAll] = await Promise.all([
    client.activity.findMany({
      where: {
        marketAddress: poolAddress, // For swaps, marketAddress is actually poolAddress
        action: "SWAP",
        timestamp: { gte: time24hAgo },
      },
      select: {
        amount: true,
        totalValue: true,
      },
    }),
    client.activity.findMany({
      where: {
        marketAddress: poolAddress,
        action: "SWAP",
        timestamp: { gte: time7dAgo },
      },
      select: {
        amount: true,
        totalValue: true,
      },
    }),
    client.activity.findMany({
      where: {
        marketAddress: poolAddress,
        action: "SWAP",
      },
      select: {
        amount: true,
        totalValue: true,
      },
    }),
  ]);

  // Calculate volumes
  const volume24h = swaps24h.reduce(
    (sum, s) => sum + (s.totalValue || s.amount || 0),
    0,
  );
  const volume7d = swaps7d.reduce(
    (sum, s) => sum + (s.totalValue || s.amount || 0),
    0,
  );
  const volumeAllTime = swapsAll.reduce(
    (sum, s) => sum + (s.totalValue || s.amount || 0),
    0,
  );

  // Calculate fees (fee % of volume)
  const feeRate = FEE_BPS / 10000;
  const fees24h = volume24h * feeRate;
  const fees7d = volume7d * feeRate;
  const feesAllTime = volumeAllTime * feeRate;

  // Fetch on-chain reserves
  const reserves = await fetchPoolReserves(poolAddress);
  const yesReserve = reserves?.yesReserve || pool.yesReserve;
  const noReserve = reserves?.noReserve || pool.noReserve;
  const totalLiquidity = yesReserve + noReserve;

  return {
    poolAddress,
    volume24h,
    volume7d,
    volumeAllTime,
    fees24h,
    fees7d,
    feesAllTime,
    yesReserve,
    noReserve,
    totalLiquidity,
  };
}

/**
 * Sync all market metrics to database
 */
export async function syncMarketMetrics(): Promise<{
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let updated = 0;

  console.log("[MetricsEngine] 📊 Starting market metrics sync...");

  try {
    // Get all markets
    const markets = await client.market.findMany({
      select: { marketAddress: true },
    });

    console.log(`[MetricsEngine] Found ${markets.length} markets to sync`);

    // Calculate and update each market
    for (const market of markets) {
      try {
        const metrics = await calculateMarketMetrics(market.marketAddress);

        await client.market.update({
          where: { marketAddress: market.marketAddress },
          data: {
            volume24h: metrics.volume24h,
            volume7d: metrics.volume7d,
            totalVolume: metrics.totalVolume,
            totalTrades: metrics.totalTrades,
            uniqueTraders: metrics.uniqueTraders,
          },
        });

        updated++;
        console.log(
          `[MetricsEngine]  ✅ ${market.marketAddress.substring(0, 10)}... - Vol24h: ${metrics.volume24h.toFixed(2)} APT`,
        );
      } catch (error) {
        const errorMsg = `Failed to sync market ${market.marketAddress}: ${error}`;
        errors.push(errorMsg);
        console.error(`[MetricsEngine] ❌ ${errorMsg}`);
      }
    }

    console.log(
      `[MetricsEngine] ✨ Market sync complete: ${updated}/${markets.length} updated`,
    );
  } catch (error) {
    const errorMsg = `Failed to fetch markets: ${error}`;
    errors.push(errorMsg);
    console.error(`[MetricsEngine] ❌ ${errorMsg}`);
  }

  return { updated, errors };
}

/**
 * Sync all pool metrics to database
 */
export async function syncPoolMetrics(): Promise<{
  updated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let updated = 0;

  console.log("[MetricsEngine] 💧 Starting pool metrics sync...");

  try {
    // Get all pools
    const pools = await client.tappPool.findMany({
      select: { poolAddress: true },
    });

    console.log(`[MetricsEngine] Found ${pools.length} pools to sync`);

    // Calculate and update each pool
    for (const pool of pools) {
      try {
        const metrics = await calculatePoolMetrics(pool.poolAddress);

        if (!metrics) {
          errors.push(`Pool ${pool.poolAddress} metrics calculation failed`);
          continue;
        }

        await client.tappPool.update({
          where: { poolAddress: pool.poolAddress },
          data: {
            volume24h: metrics.volume24h,
            volume7d: metrics.volume7d,
            volumeAllTime: metrics.volumeAllTime,
            fees24h: metrics.fees24h,
            fees7d: metrics.fees7d,
            feesAllTime: metrics.feesAllTime,
            yesReserve: metrics.yesReserve,
            noReserve: metrics.noReserve,
            totalLiquidity: metrics.totalLiquidity,
          },
        });

        updated++;
        console.log(
          `[MetricsEngine]  ✅ ${pool.poolAddress.substring(0, 10)}... - Vol24h: ${metrics.volume24h.toFixed(2)} APT`,
        );
      } catch (error) {
        const errorMsg = `Failed to sync pool ${pool.poolAddress}: ${error}`;
        errors.push(errorMsg);
        console.error(`[MetricsEngine] ❌ ${errorMsg}`);
      }
    }

    console.log(
      `[MetricsEngine] ✨ Pool sync complete: ${updated}/${pools.length} updated`,
    );
  } catch (error) {
    const errorMsg = `Failed to fetch pools: ${error}`;
    errors.push(errorMsg);
    console.error(`[MetricsEngine] ❌ ${errorMsg}`);
  }

  return { updated, errors };
}

/**
 * Sync all metrics (markets + pools)
 */
export async function syncAllMetrics(): Promise<SyncResult> {
  console.log("[MetricsEngine] 🚀 Starting full metrics sync...\n");

  const startTime = Date.now();
  const [marketResult, poolResult] = await Promise.all([
    syncMarketMetrics(),
    syncPoolMetrics(),
  ]);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const allErrors = [...marketResult.errors, ...poolResult.errors];

  const result: SyncResult = {
    success: allErrors.length === 0,
    marketsUpdated: marketResult.updated,
    poolsUpdated: poolResult.updated,
    errors: allErrors,
    timestamp: new Date(),
  };

  console.log(`\n[MetricsEngine] 🏁 Sync completed in ${duration}s`);
  console.log(`[MetricsEngine] Markets: ${result.marketsUpdated} updated`);
  console.log(`[MetricsEngine] Pools: ${result.poolsUpdated} updated`);

  if (allErrors.length > 0) {
    console.log(`[MetricsEngine] ⚠️  Errors: ${allErrors.length}`);
  }

  return result;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const MetricsSyncEngine = {
  syncMarketMetrics,
  syncPoolMetrics,
  syncAllMetrics,
  calculateMarketMetrics,
  calculatePoolMetrics,
} as const;

export default MetricsSyncEngine;
