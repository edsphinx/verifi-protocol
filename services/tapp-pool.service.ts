/**
 * @file Service layer for all database operations related to Tapp AMM pools.
 * @dev This module acts as the single interface between the application logic (webhooks, API routes)
 * and the Prisma database client for the `TappPool` model.
 */

import type { TappPool } from "@prisma/client";
import type { CreateTappPoolData } from "@/lib/types";
import client from "../lib/clients/prisma";

/**
 * @notice Creates a new Tapp pool record in the database.
 * @dev Called by webhook handler when a PoolCreated event is detected.
 * @param poolData Data for the new pool
 * @returns The newly created TappPool object
 */
export async function recordTappPool(
  poolData: CreateTappPoolData,
): Promise<TappPool> {
  return await client.tappPool.create({
    data: poolData,
  });
}

/**
 * @notice Retrieves a Tapp pool by its address.
 * @param poolAddress The pool address to look up
 * @returns The TappPool object if found, null otherwise
 */
export async function getTappPoolByAddress(
  poolAddress: string,
): Promise<TappPool | null> {
  return await client.tappPool.findUnique({
    where: {
      poolAddress,
    },
  });
}

/**
 * @notice Retrieves the Tapp pool associated with a specific market.
 * @param marketAddress The market address to look up
 * @returns The TappPool object if found, null otherwise
 */
export async function getTappPoolByMarket(
  marketAddress: string,
): Promise<TappPool | null> {
  return await client.tappPool.findFirst({
    where: {
      marketAddress,
    },
  });
}

/**
 * @notice Retrieves all Tapp pools.
 * @param limit Optional limit on number of results
 * @returns Array of TappPool objects ordered by creation date descending
 */
export async function getAllTappPools(limit?: number): Promise<TappPool[]> {
  return await client.tappPool.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/**
 * @notice Updates the liquidity stats for a pool.
 * @param poolAddress The pool address to update
 * @param totalLiquidity New total liquidity value
 * @param volume24h Optional 24h volume to update
 * @returns The updated TappPool object
 */
export async function updatePoolStats(
  poolAddress: string,
  totalLiquidity: number,
  volume24h?: number,
): Promise<TappPool> {
  return await client.tappPool.update({
    where: {
      poolAddress,
    },
    data: {
      totalLiquidity,
      ...(volume24h !== undefined && { volume24h }),
      updatedAt: new Date(),
    },
  });
}

/**
 * @notice Checks if a pool with the given address already exists.
 * @param poolAddress The pool address to check
 * @returns Boolean indicating if pool exists
 */
export async function poolExists(poolAddress: string): Promise<boolean> {
  const pool = await client.tappPool.findUnique({
    where: {
      poolAddress,
    },
  });
  return pool !== null;
}
