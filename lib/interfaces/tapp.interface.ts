/**
 * @file Tapp AMM-related interfaces
 * @description Interfaces for Tapp pool operations
 */

export interface TappPool {
  id: string;
  poolAddress: string;
  marketAddress: string;
  hookType: number;
  yesTokenAddress: string;
  noTokenAddress: string;
  fee: number;
  creatorAddress: string;
  totalLiquidity: number;
  volume24h: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePoolTransactionArgs {
  yesTokenAddress: string;
  noTokenAddress: string;
  fee?: number;
}

export interface AddLiquidityTransactionArgs {
  poolAddress: string;
  amountYes: number;
  amountNo: number;
  minLpTokens?: number;
}

export interface SwapTransactionArgs {
  poolAddress: string;
  fromYes: boolean;
  amountIn: number;
  minAmountOut?: number;
}

export interface PoolStats {
  totalLiquidity: number;
  volume24h: number;
  yesReserve: number;
  noReserve: number;
  currentYesPrice: number;
  currentNoPrice: number;
  feeRate: number;
}
