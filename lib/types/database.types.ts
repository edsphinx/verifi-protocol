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
  // From get_token_addresses
  yesTokenAddress: string;
  noTokenAddress: string;
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

// ==================================
// Portfolio Types
// ==================================

export interface PortfolioPosition {
  marketAddress: string;
  marketDescription: string;
  outcome: string;
  sharesOwned: number;
  avgEntryPrice: number;
  totalInvested: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  status: string;
}

export interface PortfolioData {
  totalValue: number;
  totalInvested: number;
  unrealizedPnL: number;
  unrealizedPnLPct: number;
  realizedPnL: number;
  openPositions: PortfolioPosition[];
  closedPositions: PortfolioPosition[];
  totalPositions: number;
  stats: {
    totalTrades: number;
    totalVolume: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    avgTradeSize: number;
  };
  lastUpdated: string;
}

// ==================================
// Analytics Types
// ==================================

export interface ProtocolMetrics {
  totalVolume: number;
  volume24h: number;
  volume7d: number;
  totalValueLocked: number;
  tvlChange24h: number;
  totalMarkets: number;
  activeMarkets: number;
  resolvedMarkets: number;
  totalUsers: number;
  activeUsers24h: number;
  activeUsers7d: number;
  totalTrades: number;
  trades24h: number;
  totalPools: number;
  totalLiquidity: number;
  lastUpdated: string;
}

export interface MarketMetrics {
  marketAddress: string;
  description: string;
  category?: string | null;
  status: string;
  volume24h: number;
  totalVolume: number;
  trades24h: number;
  totalTrades: number;
  uniqueTraders: number;
  yesPrice: number;
  noPrice: number;
  priceChange24h: number;
  yesSupply: number;
  noSupply: number;
  resolutionTimestamp: string;
}

export interface TraderMetrics {
  address: string;
  totalVolume: number;
  volume24h: number;
  totalTrades: number;
  trades24h: number;
  profitLoss: number;
  winRate: number;
  winningTrades: number;
  losingTrades: number;
}
