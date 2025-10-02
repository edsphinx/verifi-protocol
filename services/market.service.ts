/**
 * @file Service layer for all database operations related to markets.
 * @author edsphinx
 * @dev This module acts as the single interface between the application logic (API routes, etc.)
 * and the Prisma database client for the `Market` model.
 */

import type { Market } from "@prisma/client";
import type { CreateMarketDbData } from "@/types/database";
import client from "../lib/clients/prisma";

/**
 * @notice Creates a new market record in the database.
 * @dev This function is typically called by an indexer API route after a `MarketCreatedEvent`
 * is detected on-chain.
 * @param marketData An object containing the data for the new market, conforming to the `CreateMarketDbData` type.
 * @returns A promise that resolves to the newly created `Market` object from Prisma.
 */
export async function recordNewMarket(
  marketData: CreateMarketDbData,
): Promise<Market> {
  return await client.market.create({
    data: marketData,
  });
}

/**
 * @notice Retrieves a list of all active markets from the database.
 * @dev Filters markets where the `status` field is 'active' and orders them by
 * creation date in descending order. This is used to populate the main market dashboard.
 * @returns A promise that resolves to an array of active `Market` objects.
 */
export async function getActiveMarkets(): Promise<Market[]> {
  return await client.market.findMany({
    where: {
      status: "active",
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * @notice Retrieves a single market from the database by its unique on-chain address.
 * @dev Uses `findUnique` on the `marketAddress` field, which is a unique index in the database.
 * This is primarily used for fetching data for individual market detail pages.
 * @param marketAddress The on-chain address of the market to fetch.
 * @returns A promise that resolves to the `Market` object if found, or `null` if no market with that address exists.
 */
export async function getMarketByAddress(
  marketAddress: string,
): Promise<Market | null> {
  return await client.market.findUnique({
    where: {
      marketAddress: marketAddress,
    },
  });
}
