/**
 * Data Integrity Engine
 *
 * Centralized calculation engine that ensures consistency across the dApp.
 * All price, probability, and financial calculations should go through this engine.
 *
 * Design Principles:
 * 1. Single Source of Truth - One function per calculation type
 * 2. Type Safety - Strict TypeScript types for all inputs/outputs
 * 3. Validation - Input validation and error handling
 * 4. Testability - Pure functions, easy to unit test
 * 5. Documentation - Clear formulas and examples
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PoolReserves {
  yesReserve: number; // YES token balance in pool (raw units, e.g., 1_000_000 = 1 token with 6 decimals)
  noReserve: number; // NO token balance in pool (raw units)
}

export interface TokenPrice {
  yes: number; // Price in APT (0-1 range, e.g., 0.65 means 0.65 APT per YES)
  no: number; // Price in APT (0-1 range, should equal 1 - yes)
}

export interface MarketProbability {
  yes: number; // Probability percentage (0-100, e.g., 65 means 65%)
  no: number; // Probability percentage (0-100, should equal 100 - yes)
}

export interface SwapQuote {
  inputAmount: number;
  outputAmount: number;
  effectivePrice: number;
  priceImpact: number; // Percentage (0-100)
  fee: number;
  minimumOutput: number; // After slippage tolerance
}

export interface LiquidityQuote {
  yesAmount: number;
  noAmount: number;
  lpTokens: number;
  shareOfPool: number; // Percentage (0-100)
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export type CalculationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

// ============================================================================
// CONSTANTS
// ============================================================================

const DECIMALS = {
  YES_NO_TOKEN: 6, // YES/NO tokens use 6 decimals
  APT: 8, // APT uses 8 decimals
  LP_TOKEN: 6, // LP tokens use 6 decimals
};

const FEES = {
  POOL_FEE_BPS: 30, // 0.3% pool fee (30 basis points)
  PROTOCOL_FEE_BPS: 20, // 0.2% protocol fee (20 basis points)
  TOTAL_FEE_BPS: 50, // 0.5% total fee (50 basis points)
};

const LIMITS = {
  MIN_LIQUIDITY: 1000, // Minimum 0.001 tokens (with 6 decimals)
  MAX_PRICE_IMPACT: 50, // Maximum 50% price impact allowed
  DEFAULT_SLIPPAGE_BPS: 100, // 1% default slippage tolerance
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateReserves(reserves: PoolReserves): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Number.isFinite(reserves.yesReserve) || reserves.yesReserve < 0) {
    errors.push({
      field: "yesReserve",
      message: "YES reserve must be a non-negative finite number",
      code: "INVALID_YES_RESERVE",
    });
  }

  if (!Number.isFinite(reserves.noReserve) || reserves.noReserve < 0) {
    errors.push({
      field: "noReserve",
      message: "NO reserve must be a non-negative finite number",
      code: "INVALID_NO_RESERVE",
    });
  }

  if (reserves.yesReserve === 0 && reserves.noReserve === 0) {
    errors.push({
      field: "reserves",
      message: "Pool has no liquidity",
      code: "NO_LIQUIDITY",
    });
  }

  return errors;
}

function validateAmount(amount: number, field: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!Number.isFinite(amount) || amount <= 0) {
    errors.push({
      field,
      message: `${field} must be a positive finite number`,
      code: "INVALID_AMOUNT",
    });
  }

  return errors;
}

// ============================================================================
// CORE CALCULATIONS - CONSTANT PRODUCT MARKET MAKER (CPMM)
// ============================================================================

/**
 * Calculate token prices from pool reserves
 *
 * In a CPMM (x * y = k), the price is determined by the ratio of reserves.
 *
 * Formula:
 * - Total Reserve = YES + NO
 * - YES Price = YES Reserve / Total Reserve
 * - NO Price = NO Reserve / Total Reserve
 * - Invariant: YES Price + NO Price = 1
 *
 * Example:
 * - Pool has 400 YES and 600 NO
 * - Total = 1000
 * - YES Price = 400/1000 = 0.40 APT
 * - NO Price = 600/1000 = 0.60 APT
 *
 * @param reserves - Pool reserves in raw token units
 * @returns Token prices in APT (0-1 range)
 */
export function calculatePrices(
  reserves: PoolReserves,
): CalculationResult<TokenPrice> {
  const errors = validateReserves(reserves);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  const totalReserve = reserves.yesReserve + reserves.noReserve;

  if (totalReserve === 0) {
    // No liquidity - default to equal prices
    return {
      success: true,
      data: { yes: 0.5, no: 0.5 },
    };
  }

  const yesPrice = reserves.yesReserve / totalReserve;
  const noPrice = reserves.noReserve / totalReserve;

  // Sanity check: prices should sum to 1.0
  const priceSum = yesPrice + noPrice;
  if (Math.abs(priceSum - 1.0) > 0.0001) {
    return {
      success: false,
      errors: [
        {
          field: "prices",
          message: `Price calculation error: sum=${priceSum} (expected 1.0)`,
          code: "PRICE_SUM_MISMATCH",
        },
      ],
    };
  }

  return {
    success: true,
    data: { yes: yesPrice, no: noPrice },
  };
}

/**
 * Calculate market probabilities from pool reserves
 *
 * Probabilities are just prices expressed as percentages.
 *
 * @param reserves - Pool reserves in raw token units
 * @returns Market probabilities as percentages (0-100)
 */
export function calculateProbabilities(
  reserves: PoolReserves,
): CalculationResult<MarketProbability> {
  const priceResult = calculatePrices(reserves);

  if (!priceResult.success) {
    return priceResult as CalculationResult<MarketProbability>;
  }

  const { yes, no } = priceResult.data;

  return {
    success: true,
    data: {
      yes: Math.round(yes * 100),
      no: Math.round(no * 100),
    },
  };
}

/**
 * Calculate swap output using constant product formula
 *
 * Formula:
 * - k = x * y (constant product)
 * - After swap: (x + dx * 0.997) * (y - dy) = k  (0.3% fee)
 * - Solving for dy: dy = y * dx * 0.997 / (x + dx * 0.997)
 *
 * Example:
 * - Pool: 1000 YES, 1000 NO (k = 1,000,000)
 * - User sells 100 YES
 * - Input after fee: 100 * 0.997 = 99.7
 * - Output NO: 1000 * 99.7 / (1000 + 99.7) = 90.67 NO
 * - Effective price: 90.67/100 = 0.9067 APT per YES
 * - Price impact: (1 - 0.9067) / 0.5 * 100 = 18.66%
 *
 * @param inputAmount - Amount of input token (raw units)
 * @param inputReserve - Reserve of input token
 * @param outputReserve - Reserve of output token
 * @param feeBps - Fee in basis points (default: 30 = 0.3%)
 * @returns Swap quote with all relevant data
 */
export function calculateSwapOutput(
  inputAmount: number,
  inputReserve: number,
  outputReserve: number,
  feeBps: number = FEES.POOL_FEE_BPS,
): CalculationResult<SwapQuote> {
  // Validate inputs
  let errors: ValidationError[] = [];
  errors = errors.concat(validateAmount(inputAmount, "inputAmount"));
  errors = errors.concat(validateAmount(inputReserve, "inputReserve"));
  errors = errors.concat(validateAmount(outputReserve, "outputReserve"));

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Calculate fee multiplier (e.g., 30 bps = 0.997)
  const feeMultiplier = 1 - feeBps / 10000;

  // Input after fee
  const inputAfterFee = inputAmount * feeMultiplier;

  // Calculate output using CPMM formula
  const outputAmount =
    (outputReserve * inputAfterFee) / (inputReserve + inputAfterFee);

  // Calculate effective price
  const effectivePrice = outputAmount / inputAmount;

  // Calculate price before swap (for price impact)
  const priceBefore = outputReserve / (inputReserve + outputReserve);

  // Price impact as percentage
  const priceImpact =
    Math.abs((effectivePrice - priceBefore) / priceBefore) * 100;

  // Fee amount in input token
  const fee = inputAmount - inputAfterFee;

  // Minimum output with default slippage tolerance (1%)
  const minimumOutput =
    outputAmount * (1 - LIMITS.DEFAULT_SLIPPAGE_BPS / 10000);

  // Check if price impact exceeds limit
  if (priceImpact > LIMITS.MAX_PRICE_IMPACT) {
    return {
      success: false,
      errors: [
        {
          field: "priceImpact",
          message: `Price impact too high: ${priceImpact.toFixed(2)}% (max: ${LIMITS.MAX_PRICE_IMPACT}%)`,
          code: "EXCESSIVE_PRICE_IMPACT",
        },
      ],
    };
  }

  return {
    success: true,
    data: {
      inputAmount,
      outputAmount,
      effectivePrice,
      priceImpact,
      fee,
      minimumOutput,
    },
  };
}

/**
 * Calculate liquidity provision quote
 *
 * When adding liquidity, amounts must match the current pool ratio.
 * LP tokens minted = sqrt(yesAdded * noAdded)
 *
 * Formula:
 * - Ratio: YES/NO = yesReserve/noReserve
 * - If user wants to add X YES, they must add (X * noReserve / yesReserve) NO
 * - LP tokens = sqrt(X * Y) for first deposit, or proportional for subsequent
 *
 * @param yesAmount - Amount of YES tokens to add
 * @param reserves - Current pool reserves
 * @param totalLpSupply - Total LP token supply (0 for first deposit)
 * @returns Liquidity quote
 */
export function calculateLiquidityQuote(
  yesAmount: number,
  reserves: PoolReserves,
  totalLpSupply: number = 0,
): CalculationResult<LiquidityQuote> {
  const errors = validateAmount(yesAmount, "yesAmount");
  if (errors.length > 0) {
    return { success: false, errors };
  }

  const reserveErrors = validateReserves(reserves);
  if (reserveErrors.length > 0) {
    return { success: false, errors: reserveErrors };
  }

  // Check minimum liquidity
  if (yesAmount < LIMITS.MIN_LIQUIDITY) {
    return {
      success: false,
      errors: [
        {
          field: "yesAmount",
          message: `Amount too small. Minimum: ${LIMITS.MIN_LIQUIDITY / 1_000_000} tokens`,
          code: "AMOUNT_TOO_SMALL",
        },
      ],
    };
  }

  const totalReserve = reserves.yesReserve + reserves.noReserve;

  // First deposit - user can set ratio
  if (totalReserve === 0 || totalLpSupply === 0) {
    const noAmount = yesAmount; // Equal amounts for initial deposit
    const lpTokens = Math.sqrt(yesAmount * noAmount);

    return {
      success: true,
      data: {
        yesAmount,
        noAmount,
        lpTokens,
        shareOfPool: 100, // 100% of pool
      },
    };
  }

  // Subsequent deposits - must match current ratio
  const ratio = reserves.noReserve / reserves.yesReserve;
  const noAmount = yesAmount * ratio;

  // LP tokens proportional to pool share
  const lpTokens = (yesAmount / reserves.yesReserve) * totalLpSupply;

  // Calculate share of pool after deposit
  const newTotalLp = totalLpSupply + lpTokens;
  const shareOfPool = (lpTokens / newTotalLp) * 100;

  return {
    success: true,
    data: {
      yesAmount,
      noAmount,
      lpTokens,
      shareOfPool,
    },
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert raw token amount to display units
 * @param rawAmount - Amount in raw units (e.g., 1000000)
 * @param decimals - Token decimals (default: 6)
 * @returns Display amount (e.g., 1.0)
 */
export function toDisplayUnits(
  rawAmount: number,
  decimals: number = DECIMALS.YES_NO_TOKEN,
): number {
  return rawAmount / Math.pow(10, decimals);
}

/**
 * Convert display amount to raw units
 * @param displayAmount - Amount in display units (e.g., 1.0)
 * @param decimals - Token decimals (default: 6)
 * @returns Raw amount (e.g., 1000000)
 */
export function toRawUnits(
  displayAmount: number,
  decimals: number = DECIMALS.YES_NO_TOKEN,
): number {
  return Math.floor(displayAmount * Math.pow(10, decimals));
}

/**
 * Format percentage for display
 * @param value - Percentage value (0-100)
 * @param decimals - Decimal places (default: 1)
 * @returns Formatted string (e.g., "65.3%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format price for display
 * @param value - Price in APT (0-1 range)
 * @param decimals - Decimal places (default: 3)
 * @returns Formatted string (e.g., "0.653 APT")
 */
export function formatPrice(value: number, decimals: number = 3): string {
  return `${value.toFixed(decimals)} APT`;
}

/**
 * Validate that two prices are complementary (sum to 1.0)
 * @param price1 - First price
 * @param price2 - Second price
 * @param tolerance - Acceptable deviation (default: 0.0001)
 * @returns True if prices are valid
 */
export function validateComplementaryPrices(
  price1: number,
  price2: number,
  tolerance: number = 0.0001,
): boolean {
  const sum = price1 + price2;
  return Math.abs(sum - 1.0) <= tolerance;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const DataIntegrityEngine = {
  // Core calculations
  calculatePrices,
  calculateProbabilities,
  calculateSwapOutput,
  calculateLiquidityQuote,

  // Utilities
  toDisplayUnits,
  toRawUnits,
  formatPercentage,
  formatPrice,
  validateComplementaryPrices,

  // Constants
  DECIMALS,
  FEES,
  LIMITS,
} as const;

export default DataIntegrityEngine;
