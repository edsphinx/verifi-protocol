import { useMemo } from 'react';

export interface LiquidityValidationConfig {
  minAddAmount?: number;
  minRemoveAmount?: number;
}

export interface UserLiquidityBalances {
  yesBalance: number; // in display units
  noBalance: number;  // in display units
  lpSupply: number;   // total LP supply
}

export interface LiquidityValidationResult {
  // Validation helpers
  isValidAmount: (amount: string) => boolean;
  hasEnoughBalance: (amount: number, balance: number) => boolean;
  meetsMinimum: (amount: string, minimum: number) => boolean;

  // Add liquidity validation
  canAddLiquidity: boolean;
  addYesError: string | null;
  addNoError: string | null;

  // Remove liquidity validation
  canRemoveLiquidity: boolean;
  removeLpError: string | null;
  removePositionError: string | null;
}

export function useLiquidityValidation(
  yesAmount: string,
  noAmount: string,
  lpTokens: string,
  positionIdx: string,
  balances: UserLiquidityBalances,
  isFirstProvider: boolean,
  tradingEnabled: boolean,
  config: LiquidityValidationConfig = {}
): LiquidityValidationResult {
  const MIN_ADD_AMOUNT = config.minAddAmount ?? 0.01;
  const MIN_REMOVE_AMOUNT = config.minRemoveAmount ?? 0.01;

  const isValidAmount = (amount: string): boolean => {
    if (!amount || amount.trim() === '') return false;
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && isFinite(num);
  };

  const hasEnoughBalance = (amount: number, balance: number): boolean => {
    return amount <= balance;
  };

  const meetsMinimum = (amount: string, minimum: number): boolean => {
    if (!isValidAmount(amount)) return false;
    return parseFloat(amount) >= minimum;
  };

  // Add YES validation
  const { valid: yesValid, error: addYesError } = useMemo(() => {
    if (!yesAmount) return { valid: false, error: null };

    if (!isValidAmount(yesAmount)) {
      return { valid: false, error: 'Enter a valid number' };
    }

    if (!meetsMinimum(yesAmount, MIN_ADD_AMOUNT)) {
      return { valid: false, error: `Minimum ${MIN_ADD_AMOUNT} tokens` };
    }

    const amount = parseFloat(yesAmount);
    if (!hasEnoughBalance(amount, balances.yesBalance)) {
      return { valid: false, error: 'Insufficient YES balance' };
    }

    return { valid: true, error: null };
  }, [yesAmount, balances.yesBalance]);

  // Add NO validation
  const { valid: noValid, error: addNoError } = useMemo(() => {
    if (!noAmount) return { valid: false, error: null };

    if (!isValidAmount(noAmount)) {
      return { valid: false, error: 'Enter a valid number' };
    }

    if (!meetsMinimum(noAmount, MIN_ADD_AMOUNT)) {
      return { valid: false, error: `Minimum ${MIN_ADD_AMOUNT} tokens` };
    }

    const amount = parseFloat(noAmount);
    if (!hasEnoughBalance(amount, balances.noBalance)) {
      return { valid: false, error: 'Insufficient NO balance' };
    }

    return { valid: true, error: null };
  }, [noAmount, balances.noBalance]);

  // Can add liquidity if both YES and NO are valid and trading is enabled
  const canAddLiquidity = useMemo(() => {
    if (!tradingEnabled) return false;
    return yesValid && noValid;
  }, [yesValid, noValid, tradingEnabled]);

  // Remove LP tokens validation
  const { valid: lpValid, error: removeLpError } = useMemo(() => {
    if (!lpTokens) return { valid: false, error: null };

    if (!isValidAmount(lpTokens)) {
      return { valid: false, error: 'Enter a valid number' };
    }

    if (!meetsMinimum(lpTokens, MIN_REMOVE_AMOUNT)) {
      return { valid: false, error: `Minimum ${MIN_REMOVE_AMOUNT} LP tokens` };
    }

    const amount = parseFloat(lpTokens);
    if (!hasEnoughBalance(amount, balances.lpSupply)) {
      return { valid: false, error: 'Exceeds available LP tokens' };
    }

    return { valid: true, error: null };
  }, [lpTokens, balances.lpSupply]);

  // Position index validation
  const { valid: positionValid, error: removePositionError } = useMemo(() => {
    if (!positionIdx) return { valid: false, error: 'Position ID required' };

    const idx = parseInt(positionIdx);
    if (isNaN(idx) || idx < 0) {
      return { valid: false, error: 'Invalid position ID' };
    }

    return { valid: true, error: null };
  }, [positionIdx]);

  // Can remove liquidity if both LP amount and position are valid
  const canRemoveLiquidity = useMemo(() => {
    return lpValid && positionValid;
  }, [lpValid, positionValid]);

  return {
    isValidAmount,
    hasEnoughBalance,
    meetsMinimum,
    canAddLiquidity,
    addYesError,
    addNoError,
    canRemoveLiquidity,
    removeLpError,
    removePositionError,
  };
}
