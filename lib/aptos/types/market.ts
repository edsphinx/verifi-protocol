import type { MarketDetailsData } from "../queries/use-market-details";

export type CreateMarketPayloadArgs = {
  description: string;
  resolutionTimestamp: number;
  resolverAddress: string;
  // Estos son para el oráculo programático, podemos usar valores por defecto por ahora
  targetAddress: string;
  targetFunction: string;
  targetValue: number;
  operator: number;
};

/**
 * The data required by the server to build a `buy_shares` transaction.
 */
export interface BuySharesApiPayload {
  marketObjectAddress: string;
  amountOctas: number;
  buysYesShares: boolean;
}

/**
 * The data required by the server to build a `sell_shares` transaction.
 */
export interface SellSharesApiPayload {
  marketObjectAddress: string;
  amountOctas: number;
  sellsYesShares: boolean;
}

/**
 * Props for the main ActionPanel component.
 */
export interface ActionPanelProps {
  marketId: string;
  dynamicData: MarketDetailsData;
}
