import type { Market as DbMarket } from "@prisma/client";
import type { Market as UiMarket } from "@/components/cards/MarketCard";
import type {
  BuySharesApiPayload,
  CreateMarketApiPayload,
  EntryFunctionPayload,
  MarketCreatedEventData,
  SellSharesApiPayload,
} from "@/lib/types";

/**
 * @notice Fetches the enriched list of active markets from the server.
 * @returns A promise that resolves to an array of markets ready for the UI.
 */
export async function getActiveMarketsFromApi(): Promise<UiMarket[]> {
  try {
    console.log('[market.ts] Fetching markets from /api/markets...');
    const response = await fetch("/api/markets");

    if (!response.ok) {
      console.error('[market.ts] API response not OK:', response.status, response.statusText);
      // Return empty array instead of throwing to prevent UI from breaking
      return [];
    }

    const data: DbMarket[] = await response.json();
    console.log('[market.ts] Received data from API:', data);

    // Validate data is an array
    if (!Array.isArray(data)) {
      console.error('[market.ts] API response is not an array:', data);
      return [];
    }

    // The API already returns the enriched data, but we still need to format it for the UI component
    const uiMarkets = data.map((market: DbMarket) => {
      try {
        const resolutionDate = new Date(market.resolutionTimestamp);
        return {
          id: market.marketAddress,
          title: market.description,
          category: "On-Chain",
          totalVolume: market.totalVolume / 10 ** 8, // Convert from Octas
          resolvesOnDate: resolutionDate,
          resolvesOn: resolutionDate.toLocaleDateString(),
          resolutionTimestamp: Math.floor(resolutionDate.getTime() / 1000), // Unix timestamp in seconds
        };
      } catch (err) {
        console.error('[market.ts] Error transforming market:', market, err);
        return null;
      }
    }).filter((m): m is UiMarket => m !== null);

    console.log('[market.ts] Transformed to UI markets:', uiMarkets);
    return uiMarkets;
  } catch (error) {
    console.error('[market.ts] Error fetching markets:', error);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
}

/**
 * @notice Fetches the transaction payload for creating a new market from the server.
 * @dev Sends the required data to the `/api/markets/create` endpoint.
 * @param data The data needed to build the `create_market` transaction, conforming to `CreateMarketApiPayload`.
 * @returns A promise that resolves to the `EntryFunctionPayload` for the transaction.
 * @throws An error if the API call fails or returns a non-OK status.
 */
export async function getCreateMarketPayload(
  data: CreateMarketApiPayload,
): Promise<EntryFunctionPayload> {
  console.log('[market.ts] Calling /api/markets/create with data:', data);

  try {
    const response = await fetch("/api/markets/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    console.log('[market.ts] Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorBody = await response
        .json()
        .catch(() => ({ error: "Failed to parse error response" }));
      console.error('[market.ts] Error response body:', errorBody);
      throw new Error(errorBody.error || "Failed to get create market payload");
    }

    const payload = await response.json();
    console.log('[market.ts] Received payload:', payload);
    return payload;
  } catch (error) {
    console.error('[market.ts] Error in getCreateMarketPayload:', error);
    throw error;
  }
}

/**
 * @notice Fetches the transaction payload for buying shares from the server.
 * @dev Sends the required data to the `/api/markets/buy-shares` endpoint.
 * @param data The data needed to build the `buy_shares` transaction, conforming to `BuySharesApiPayload`.
 * @returns A promise that resolves to the `EntryFunctionPayload` for the transaction.
 * @throws An error if the API call fails or returns a non-OK status.
 */
export async function getBuySharesPayload(
  data: BuySharesApiPayload,
): Promise<EntryFunctionPayload> {
  const response = await fetch("/api/markets/buy-shares", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ error: "Failed to parse error response" }));
    throw new Error(errorBody.error || "Failed to get buy shares payload");
  }
  return response.json();
}

/**
 * @notice Fetches the transaction payload for selling shares from the server.
 * @dev Sends the required data to the `/api/markets/sell-shares` endpoint.
 * @param data The data needed to build the `sell_shares` transaction, conforming to `SellSharesApiPayload`.
 * @returns A promise that resolves to the `EntryFunctionPayload` for the transaction.
 * @throws An error if the API call fails or returns a non-OK status.
 */
export async function getSellSharesPayload(
  data: SellSharesApiPayload,
): Promise<EntryFunctionPayload> {
  const response = await fetch("/api/markets/sell-shares", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ error: "Failed to parse error response" }));
    throw new Error(errorBody.error || "Failed to get sell shares payload");
  }
  return response.json();
}

/**
 * @notice Sends new market data from an on-chain event to the backend indexer API.
 * @dev This is called by the frontend after a `create_market` transaction is confirmed.
 * @param eventData The data from the `MarketCreatedEvent`.
 * @throws An error if the API call fails or returns a non-OK status.
 */
export async function indexNewMarket(
  eventData: MarketCreatedEventData,
): Promise<void> {
  const response = await fetch("/api/indexer/new-market", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  if (!response.ok) {
    throw new Error("Failed to index the new market in the database.");
  }
}
