import type {
  BuySharesApiPayload,
  EntryFunctionPayload,
  SellSharesApiPayload,
} from "../types";

/**
 * Fetches the transaction payload for buying shares from the server-side API.
 * @param data The required data to build the transaction.
 * @returns A promise that resolves to the entry function payload.
 */
export async function getBuySharesPayload(
  data: BuySharesApiPayload,
): Promise<EntryFunctionPayload> {
  const response = await fetch("/api/markets/buy-shares", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok)
    throw new Error(
      (await response.json()).error || "Failed to get buy shares payload",
    );
  return response.json();
}

/**
 * Fetches the transaction payload for selling shares from the server-side API.
 * @param data The required data to build the transaction.
 * @returns A promise that resolves to the entry function payload.
 */
export async function getSellSharesPayload(
  data: SellSharesApiPayload,
): Promise<EntryFunctionPayload> {
  const response = await fetch("/api/markets/sell-shares", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok)
    throw new Error(
      (await response.json()).error || "Failed to get sell shares payload",
    );
  return response.json();
}


export async function getCreateMarketPayload(
  data: any,
): Promise<EntryFunctionPayload> {
  const response = await fetch("/api/markets/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to get transaction payload");
  }
  return response.json();
}

export async function indexNewMarket(eventData: any): Promise<void> {
  const response = await fetch("/api/indexer/new-market", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(eventData),
  });
  if (!response.ok) {
    throw new Error("Failed to index the new market in the database.");
  }
}