import { useMemo } from 'react';

export interface TradeValidationConfig {
  minTradeAmount?: number;
  minSellAmount?: number;
}

export interface UserBalances {
  aptBalance: number; // in octas
  yesBalance: number; // in smallest units
  noBalance: number;  // in smallest units
}

export interface TradeValidationResult {
  // Validation helpers
  isValidAmount: (amount: string) => boolean;
  hasEnoughBalance: (amount: string, balanceOctas: number) => boolean;
  meetsMinimum: (amount: string, minimum: number) => boolean;

  // Buy validation
  canBuyYes: boolean;
  canBuyNo: boolean;
  buyYesError: string | null;
  buyNoError: string | null;

  // Sell validation
  canSellYes: boolean;
  canSellNo: boolean;
  sellYesError: string | null;
  sellNoError: string | null;
}

export function useTradeValidation(
  buyYesAmount: string,
  buyNoAmount: string,
  sellYesAmount: string,
  sellNoAmount: string,
  balances: UserBalances,
  config: TradeValidationConfig = {}
): TradeValidationResult {
  const MIN_TRADE_AMOUNT = config.minTradeAmount ?? 0.01;
  const MIN_SELL_AMOUNT = config.minSellAmount ?? 0.01;

  const isValidAmount = (amount: string): boolean => {
    if (!amount || amount.trim() === '') return false;
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && isFinite(num);
  };

  const hasEnoughBalance = (amount: string, balanceOctas: number): boolean => {
    if (!isValidAmount(amount)) return false;
    const amountOctas = Math.floor(parseFloat(amount) * 10 ** 8);
    return amountOctas <= balanceOctas;
  };

  const meetsMinimum = (amount: string, minimum: number): boolean => {
    if (!isValidAmount(amount)) return false;
    return parseFloat(amount) >= minimum;
  };

  // Buy YES validation
  const { canBuy: canBuyYes, error: buyYesError } = useMemo(() => {
    if (!buyYesAmount) return { canBuy: false, error: null };

    if (!isValidAmount(buyYesAmount)) {
      return { canBuy: false, error: 'Enter a valid number' };
    }

    if (!meetsMinimum(buyYesAmount, MIN_TRADE_AMOUNT)) {
      return { canBuy: false, error: `Minimum ${MIN_TRADE_AMOUNT} APT` };
    }

    if (!hasEnoughBalance(buyYesAmount, balances.aptBalance)) {
      return { canBuy: false, error: 'Insufficient APT balance' };
    }

    return { canBuy: true, error: null };
  }, [buyYesAmount, balances.aptBalance]);

  // Buy NO validation
  const { canBuy: canBuyNo, error: buyNoError } = useMemo(() => {
    if (!buyNoAmount) return { canBuy: false, error: null };

    if (!isValidAmount(buyNoAmount)) {
      return { canBuy: false, error: 'Enter a valid number' };
    }

    if (!meetsMinimum(buyNoAmount, MIN_TRADE_AMOUNT)) {
      return { canBuy: false, error: `Minimum ${MIN_TRADE_AMOUNT} APT` };
    }

    if (!hasEnoughBalance(buyNoAmount, balances.aptBalance)) {
      return { canBuy: false, error: 'Insufficient APT balance' };
    }

    return { canBuy: true, error: null };
  }, [buyNoAmount, balances.aptBalance]);

  // Sell YES validation
  const { canSell: canSellYes, error: sellYesError } = useMemo(() => {
    if (!sellYesAmount) return { canSell: false, error: null };

    if (balances.yesBalance === 0) {
      return { canSell: false, error: 'No YES shares to sell' };
    }

    if (!isValidAmount(sellYesAmount)) {
      return { canSell: false, error: 'Enter a valid number' };
    }

    if (!meetsMinimum(sellYesAmount, MIN_SELL_AMOUNT)) {
      return { canSell: false, error: `Minimum ${MIN_SELL_AMOUNT} shares` };
    }

    const amountInSmallestUnits = parseFloat(sellYesAmount) * 10 ** 6;
    if (amountInSmallestUnits > balances.yesBalance) {
      return { canSell: false, error: 'Insufficient YES shares' };
    }

    return { canSell: true, error: null };
  }, [sellYesAmount, balances.yesBalance]);

  // Sell NO validation
  const { canSell: canSellNo, error: sellNoError } = useMemo(() => {
    if (!sellNoAmount) return { canSell: false, error: null };

    if (balances.noBalance === 0) {
      return { canSell: false, error: 'No NO shares to sell' };
    }

    if (!isValidAmount(sellNoAmount)) {
      return { canSell: false, error: 'Enter a valid number' };
    }

    if (!meetsMinimum(sellNoAmount, MIN_SELL_AMOUNT)) {
      return { canSell: false, error: `Minimum ${MIN_SELL_AMOUNT} shares` };
    }

    const amountInSmallestUnits = parseFloat(sellNoAmount) * 10 ** 6;
    if (amountInSmallestUnits > balances.noBalance) {
      return { canSell: false, error: 'Insufficient NO shares' };
    }

    return { canSell: true, error: null };
  }, [sellNoAmount, balances.noBalance]);

  return {
    isValidAmount,
    hasEnoughBalance,
    meetsMinimum,
    canBuyYes,
    canBuyNo,
    buyYesError,
    buyNoError,
    canSellYes,
    canSellNo,
    sellYesError,
    sellNoError,
  };
}
