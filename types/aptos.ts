import type { MoveFunctionId } from "@aptos-labs/ts-sdk";

/**
 * @notice The generic structure for any entry function payload returned by the server.
 * @dev This interface defines the shape of the `data` object required by the Aptos SDK's
 * transaction builder and the wallet adapter's `signAndSubmitTransaction` function.
 * It is reused across all transaction types to ensure consistency.
 */
export interface EntryFunctionPayload {
  /** The fully qualified Move function identifier (e.g., `0x123::module::function`). */
  function: MoveFunctionId;
  /** An array of arguments to be passed to the Move function. Must be serializable types. */
  functionArguments: (string | number | boolean)[];
  /** An array of generic type arguments for the Move function, if any. */
  typeArguments?: string[];
}

/**
 * @notice The data required by the API to build a `create_market` transaction.
 */
export type CreateMarketApiPayload = {
  /** The question the market is asking. */
  description: string;
  /** The Unix timestamp (in seconds) when the market should resolve. */
  resolutionTimestamp: number;
  /** The address authorized for manual resolution (usually the creator). */
  resolverAddress: string;
  /** The unique string identifier for the on-chain oracle. */
  oracleId: string;
  /** The target address for the oracle to query. */
  targetAddress: string;
  /** [Legacy] The function name for the oracle to query. */
  targetFunction: string;
  /** The value to compare the oracle's result against. */
  targetValue: number;
  /** The comparison operator (0 for >, 1 for <). */
  operator: number;
};

/**
 * @notice The data required by the API to build a `buy_shares` transaction.
 */
export interface BuySharesApiPayload {
  /** The on-chain address of the Market object. */
  marketObjectAddress: string;
  /** The amount of APT (in Octas) the user wants to spend. */
  amountOctas: number;
  /** A boolean indicating the desired outcome (`true` for YES, `false` for NO). */
  buysYesShares: boolean;
}

/**
 * @notice The data required by the API to build a `sell_shares` transaction.
 */
export interface SellSharesApiPayload {
  /** The on-chain address of the Market object. */
  marketObjectAddress: string;
  /** The number of shares (as Octas) the user wants to sell. */
  amountOctas: number;
  /** A boolean indicating the outcome being sold (`true` for YES, `false` for NO). */
  sellsYesShares: boolean;
}
