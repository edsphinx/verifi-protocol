// ==================================
// Database Data Structures
// ==================================

/**
 * @notice The data required by the service layer to create a new market record in the database.
 */
export type CreateMarketDbData = {
  /** The unique on-chain address of the Market object. */
  marketAddress: string;
  /** The address of the account that created the market. */
  creatorAddress: string;
  /** The market's question. */
  description: string;
  /** The resolution timestamp as a JavaScript Date object. */
  resolutionTimestamp: Date;
};

// The combined data structure this hook will return
export interface MarketDetailsData {
  // From get_market_state
  status: number;
  totalSupplyYes: number;
  totalSupplyNo: number;
  poolYes: number;
  poolNo: number;
  // From get_balances + getAccountAPTBalance
  userAptBalance: number;
  userYesBalance: number;
  userNoBalance: number;
}
