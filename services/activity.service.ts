/**
 * @file Service layer for all database operations related to activities.
 * @dev This module acts as the single interface between the application logic (webhooks, API routes)
 * and the Prisma database client for the `Activity` model.
 */

import type { Activity } from "@prisma/client";
import type { CreateActivityData } from "@/lib/types";
import client from "../lib/clients/prisma";

/**
 * @notice Creates a new activity record in the database.
 * @dev Called by webhook handlers when a trade/liquidity/swap event is detected.
 * @param activityData Data for the new activity
 * @returns The newly created Activity object
 */
export async function recordActivity(
  activityData: CreateActivityData
): Promise<Activity> {
  return await client.activity.create({
    data: {
      txHash: activityData.txHash,
      marketAddress: activityData.marketAddress,
      userAddress: activityData.userAddress,
      action: activityData.action,
      outcome: activityData.outcome || null,
      amount: activityData.amount,
      timestamp: activityData.timestamp || new Date(),
    },
  });
}

/**
 * @notice Retrieves all activities for a specific market.
 * @param marketAddress The market address to filter by
 * @param limit Optional limit on number of results
 * @returns Array of Activity objects ordered by timestamp descending
 */
export async function getActivitiesByMarket(
  marketAddress: string,
  limit?: number
): Promise<Activity[]> {
  return await client.activity.findMany({
    where: {
      marketAddress,
    },
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
  });
}

/**
 * @notice Retrieves all activities for a specific user.
 * @param userAddress The user address to filter by
 * @param limit Optional limit on number of results
 * @returns Array of Activity objects ordered by timestamp descending
 */
export async function getActivitiesByUser(
  userAddress: string,
  limit?: number
): Promise<Activity[]> {
  return await client.activity.findMany({
    where: {
      userAddress,
    },
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
  });
}

/**
 * @notice Retrieves recent activities across all markets.
 * @param limit Number of activities to return (default: 50)
 * @returns Array of Activity objects ordered by timestamp descending
 */
export async function getRecentActivities(limit = 50): Promise<Activity[]> {
  return await client.activity.findMany({
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
  });
}

/**
 * @notice Checks if an activity with the given transaction hash already exists.
 * @param txHash The transaction hash to check
 * @returns Boolean indicating if activity exists
 */
export async function activityExists(txHash: string): Promise<boolean> {
  const activity = await client.activity.findUnique({
    where: {
      txHash,
    },
  });
  return activity !== null;
}
