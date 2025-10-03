/**
 * Constant Product Market Maker (CPMM) utility functions
 *
 * Implements the x * y = k formula for automated market making
 * Used for calculating prices, slippage, and liquidity operations
 */

/**
 * Fee configuration in basis points (1 bp = 0.01%)
 */
export const FEE_BASIS_POINTS = 30; // 0.3% default fee
export const BASIS_POINTS_DIVISOR = 10000;

/**
 * Minimum liquidity to prevent division by zero
 * This is locked forever in the pool to ensure liquidity can never be fully drained
 */
export const MINIMUM_LIQUIDITY = 0.001; // Very small amount, equivalent to 10^5 in on-chain units (10^8 decimals)

/**
 * Maximum slippage tolerance (in percentage)
 */
export const MAX_SLIPPAGE_PERCENT = 50; // 50%

/**
 * Result of a swap calculation
 */
export interface SwapResult {
  outputAmount: number;
  priceImpact: number;
  effectivePrice: number;
  fee: number;
  newReserveIn: number;
  newReserveOut: number;
}

/**
 * Result of liquidity addition calculation
 */
export interface AddLiquidityResult {
  lpTokens: number;
  yesAmount: number;
  noAmount: number;
  shareOfPool: number;
}

/**
 * Result of liquidity removal calculation
 */
export interface RemoveLiquidityResult {
  yesAmount: number;
  noAmount: number;
  shareOfPool: number;
}

/**
 * Calculate output amount for a given input using CPMM formula
 * Formula: dy = (y * dx * (1 - fee)) / (x + dx * (1 - fee))
 *
 * @param inputAmount - Amount of token being sold
 * @param inputReserve - Reserve of input token in pool
 * @param outputReserve - Reserve of output token in pool
 * @param feeBasisPoints - Fee in basis points (default: 30 = 0.3%)
 * @returns SwapResult with output amount, price impact, and new reserves
 */
export function calculateSwapOutput(
  inputAmount: number,
  inputReserve: number,
  outputReserve: number,
  feeBasisPoints: number = FEE_BASIS_POINTS,
): SwapResult {
  if (inputAmount <= 0) {
    throw new Error("Input amount must be positive");
  }
  if (inputReserve <= 0 || outputReserve <= 0) {
    throw new Error("Reserves must be positive");
  }

  // Calculate fee
  const fee = (inputAmount * feeBasisPoints) / BASIS_POINTS_DIVISOR;
  const inputAmountAfterFee = inputAmount - fee;

  // CPMM formula: dy = (y * dx') / (x + dx')
  // where dx' = dx * (1 - fee)
  const numerator = outputReserve * inputAmountAfterFee;
  const denominator = inputReserve + inputAmountAfterFee;
  const outputAmount = numerator / denominator;

  // Calculate price impact
  const spotPrice = outputReserve / inputReserve;
  const effectivePrice = outputAmount / inputAmount;
  const priceImpact = ((spotPrice - effectivePrice) / spotPrice) * 100;

  return {
    outputAmount,
    priceImpact,
    effectivePrice,
    fee,
    newReserveIn: inputReserve + inputAmount,
    newReserveOut: outputReserve - outputAmount,
  };
}

/**
 * Calculate input amount required for a desired output
 * Inverse formula: dx = (x * dy) / ((y - dy) * (1 - fee))
 *
 * @param outputAmount - Desired output amount
 * @param inputReserve - Reserve of input token in pool
 * @param outputReserve - Reserve of output token in pool
 * @param feeBasisPoints - Fee in basis points
 * @returns Required input amount
 */
export function calculateSwapInput(
  outputAmount: number,
  inputReserve: number,
  outputReserve: number,
  feeBasisPoints: number = FEE_BASIS_POINTS,
): number {
  if (outputAmount <= 0) {
    throw new Error("Output amount must be positive");
  }
  if (outputAmount >= outputReserve) {
    throw new Error("Output amount exceeds reserves");
  }

  const feeMultiplier =
    (BASIS_POINTS_DIVISOR - feeBasisPoints) / BASIS_POINTS_DIVISOR;

  // Inverse CPMM formula
  const numerator = inputReserve * outputAmount;
  const denominator = (outputReserve - outputAmount) * feeMultiplier;
  const inputAmount = numerator / denominator;

  return inputAmount;
}

/**
 * Calculate spot price of token A in terms of token B
 * Price = reserveB / reserveA
 *
 * @param reserveA - Reserve of token A
 * @param reserveB - Reserve of token B
 * @returns Spot price
 */
export function calculateSpotPrice(reserveA: number, reserveB: number): number {
  if (reserveA <= 0 || reserveB <= 0) {
    throw new Error("Reserves must be positive");
  }
  return reserveB / reserveA;
}

/**
 * Calculate LP tokens to mint when adding liquidity
 *
 * For initial liquidity: LP = sqrt(x * y)
 * For subsequent adds: LP = totalSupply * (dx / x) = totalSupply * (dy / y)
 *
 * @param yesAmount - Amount of YES tokens to add
 * @param noAmount - Amount of NO tokens to add
 * @param yesReserve - Current YES reserve
 * @param noReserve - Current NO reserve
 * @param totalLpSupply - Current total LP token supply
 * @returns AddLiquidityResult with LP tokens and final amounts
 */
export function calculateAddLiquidity(
  yesAmount: number,
  noAmount: number,
  yesReserve: number,
  noReserve: number,
  totalLpSupply: number,
): AddLiquidityResult {
  if (yesAmount <= 0 || noAmount <= 0) {
    throw new Error("Amounts must be positive");
  }

  let lpTokens: number;
  let finalYesAmount = yesAmount;
  let finalNoAmount = noAmount;

  // Initial liquidity
  if (totalLpSupply === 0 || yesReserve === 0 || noReserve === 0) {
    lpTokens = Math.sqrt(yesAmount * noAmount) - MINIMUM_LIQUIDITY;
    if (lpTokens <= 0) {
      throw new Error("Insufficient liquidity provided");
    }
  } else {
    // Subsequent liquidity - maintain pool ratio
    const yesLpTokens = (totalLpSupply * yesAmount) / yesReserve;
    const noLpTokens = (totalLpSupply * noAmount) / noReserve;

    // Use minimum to prevent price manipulation
    lpTokens = Math.min(yesLpTokens, noLpTokens);

    // Adjust amounts to maintain exact ratio
    finalYesAmount = (lpTokens * yesReserve) / totalLpSupply;
    finalNoAmount = (lpTokens * noReserve) / totalLpSupply;
  }

  const newTotalSupply = totalLpSupply + lpTokens;
  const shareOfPool = (lpTokens / newTotalSupply) * 100;

  return {
    lpTokens,
    yesAmount: finalYesAmount,
    noAmount: finalNoAmount,
    shareOfPool,
  };
}

/**
 * Calculate token amounts when removing liquidity
 *
 * Formula:
 * - dx = (LP / totalSupply) * reserveX
 * - dy = (LP / totalSupply) * reserveY
 *
 * @param lpTokens - Amount of LP tokens to burn
 * @param yesReserve - Current YES reserve
 * @param noReserve - Current NO reserve
 * @param totalLpSupply - Current total LP token supply
 * @returns RemoveLiquidityResult with token amounts
 */
export function calculateRemoveLiquidity(
  lpTokens: number,
  yesReserve: number,
  noReserve: number,
  totalLpSupply: number,
): RemoveLiquidityResult {
  if (lpTokens <= 0) {
    throw new Error("LP tokens must be positive");
  }
  if (lpTokens > totalLpSupply) {
    throw new Error("Insufficient LP tokens");
  }
  if (yesReserve <= 0 || noReserve <= 0) {
    throw new Error("Reserves must be positive");
  }

  const shareOfPool = (lpTokens / totalLpSupply) * 100;
  const yesAmount = (lpTokens * yesReserve) / totalLpSupply;
  const noAmount = (lpTokens * noReserve) / totalLpSupply;

  return {
    yesAmount,
    noAmount,
    shareOfPool,
  };
}

/**
 * Calculate price impact for a given trade
 *
 * @param inputAmount - Amount being traded
 * @param inputReserve - Input token reserve
 * @param outputReserve - Output token reserve
 * @returns Price impact as percentage
 */
export function calculatePriceImpact(
  inputAmount: number,
  inputReserve: number,
  outputReserve: number,
): number {
  const result = calculateSwapOutput(inputAmount, inputReserve, outputReserve);
  return result.priceImpact;
}

/**
 * Validate slippage tolerance
 *
 * @param expectedOutput - Expected output amount
 * @param minOutput - Minimum acceptable output (after slippage)
 * @param slippageTolerance - Slippage tolerance in percentage
 * @returns true if within tolerance
 */
export function validateSlippage(
  expectedOutput: number,
  minOutput: number,
  slippageTolerance: number,
): boolean {
  if (slippageTolerance > MAX_SLIPPAGE_PERCENT) {
    throw new Error(
      `Slippage tolerance exceeds maximum (${MAX_SLIPPAGE_PERCENT}%)`,
    );
  }

  const minAcceptable = expectedOutput * (1 - slippageTolerance / 100);
  return minOutput >= minAcceptable;
}

/**
 * Calculate minimum output with slippage protection
 *
 * @param expectedOutput - Expected output amount
 * @param slippageTolerance - Slippage tolerance in percentage
 * @returns Minimum acceptable output
 */
export function calculateMinOutput(
  expectedOutput: number,
  slippageTolerance: number,
): number {
  if (slippageTolerance > MAX_SLIPPAGE_PERCENT) {
    throw new Error(
      `Slippage tolerance exceeds maximum (${MAX_SLIPPAGE_PERCENT}%)`,
    );
  }
  return expectedOutput * (1 - slippageTolerance / 100);
}

/**
 * Calculate the invariant K = x * y
 * Used to verify pool state remains constant (minus fees)
 *
 * @param reserveX - Reserve of token X
 * @param reserveY - Reserve of token Y
 * @returns Invariant K
 */
export function calculateInvariant(reserveX: number, reserveY: number): number {
  return reserveX * reserveY;
}

/**
 * Verify CPMM invariant holds after a swap
 *
 * @param oldReserveX - Reserve X before swap
 * @param oldReserveY - Reserve Y before swap
 * @param newReserveX - Reserve X after swap
 * @param newReserveY - Reserve Y after swap
 * @returns true if invariant increased (due to fees)
 */
export function verifyInvariant(
  oldReserveX: number,
  oldReserveY: number,
  newReserveX: number,
  newReserveY: number,
): boolean {
  const oldK = calculateInvariant(oldReserveX, oldReserveY);
  const newK = calculateInvariant(newReserveX, newReserveY);

  // New K should be >= old K (increases due to fees)
  return newK >= oldK;
}
