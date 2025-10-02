/**
 * @file Database-related type definitions
 * @description Types for database operations and Prisma models
 */

// ==================================
// Market Types
// ==================================

export type CreateMarketDbData = {
  marketAddress: string;
  creatorAddress: string;
  description: string;
  resolutionTimestamp: Date;
  status?: string;
};

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

// ==================================
// Activity Types
// ==================================

export type ActivityAction = "BUY" | "SELL" | "LIQUIDITY_ADD" | "SWAP";
export type ActivityOutcome = "YES" | "NO";

export type CreateActivityData = {
  txHash: string;
  marketAddress: string;
  userAddress: string;
  action: ActivityAction;
  outcome?: ActivityOutcome;
  amount: number;
  timestamp?: Date;
};

// ==================================
// Tapp Pool Types
// ==================================

export type CreateTappPoolData = {
  poolAddress: string;
  marketAddress: string;
  hookType: number;
  yesTokenAddress: string;
  noTokenAddress: string;
  fee: number;
  creatorAddress: string;
};

// ==================================
// Notification Types
// ==================================

export type NotificationType =
  | "NEW_MARKET"
  | "POOL_CREATED"
  | "LARGE_TRADE"
  | "MARKET_RESOLVED"
  | "MARKET_EXPIRING";

export type CreateNotificationData = {
  type: NotificationType;
  title: string;
  message: string;
  relatedAddress?: string;
  txHash?: string;
  metadata?: Record<string, any>;
  isGlobal?: boolean;
  targetUser?: string;
};
