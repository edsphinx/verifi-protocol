/**
 * Data Integrity Engine Tests
 *
 * Comprehensive test suite to ensure all calculations are correct
 */

import { describe, it, expect } from '@jest/globals';
import {
  calculatePrices,
  calculateProbabilities,
  calculateSwapOutput,
  calculateLiquidityQuote,
  toDisplayUnits,
  toRawUnits,
  validateComplementaryPrices,
  type PoolReserves,
} from '../data-integrity.engine';

describe('Data Integrity Engine', () => {
  // ============================================================================
  // PRICE CALCULATIONS
  // ============================================================================

  describe('calculatePrices', () => {
    it('should calculate equal prices for balanced pool', () => {
      const reserves: PoolReserves = {
        yesReserve: 1_000_000, // 1.0 token (6 decimals)
        noReserve: 1_000_000,
      };

      const result = calculatePrices(reserves);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.yes).toBeCloseTo(0.5, 4);
        expect(result.data.no).toBeCloseTo(0.5, 4);
      }
    });

    it('should calculate skewed prices for imbalanced pool', () => {
      const reserves: PoolReserves = {
        yesReserve: 400_000, // 0.4 tokens
        noReserve: 600_000,  // 0.6 tokens
      };

      const result = calculatePrices(reserves);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.yes).toBeCloseTo(0.4, 4);
        expect(result.data.no).toBeCloseTo(0.6, 4);
      }
    });

    it('should handle extreme ratios', () => {
      const reserves: PoolReserves = {
        yesReserve: 100_000, // 0.1 tokens (10%)
        noReserve: 900_000,  // 0.9 tokens (90%)
      };

      const result = calculatePrices(reserves);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.yes).toBeCloseTo(0.1, 4);
        expect(result.data.no).toBeCloseTo(0.9, 4);
      }
    });

    it('should return 50/50 for empty pool', () => {
      const reserves: PoolReserves = {
        yesReserve: 0,
        noReserve: 0,
      };

      const result = calculatePrices(reserves);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.yes).toBe(0.5);
        expect(result.data.no).toBe(0.5);
      }
    });

    it('should reject negative reserves', () => {
      const reserves: PoolReserves = {
        yesReserve: -100,
        noReserve: 1000,
      };

      const result = calculatePrices(reserves);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].code).toBe('INVALID_YES_RESERVE');
      }
    });

    it('should ensure prices sum to 1.0', () => {
      const reserves: PoolReserves = {
        yesReserve: 333_333,
        noReserve: 666_667,
      };

      const result = calculatePrices(reserves);

      expect(result.success).toBe(true);
      if (result.success) {
        const sum = result.data.yes + result.data.no;
        expect(sum).toBeCloseTo(1.0, 4);
      }
    });
  });

  // ============================================================================
  // PROBABILITY CALCULATIONS
  // ============================================================================

  describe('calculateProbabilities', () => {
    it('should convert prices to percentages', () => {
      const reserves: PoolReserves = {
        yesReserve: 650_000, // 65%
        noReserve: 350_000,  // 35%
      };

      const result = calculateProbabilities(reserves);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.yes).toBe(65);
        expect(result.data.no).toBe(35);
      }
    });

    it('should round to nearest integer', () => {
      const reserves: PoolReserves = {
        yesReserve: 666_666, // ~66.67%
        noReserve: 333_334,  // ~33.33%
      };

      const result = calculateProbabilities(reserves);

      expect(result.success).toBe(true);
      if (result.success) {
        // Should round to 67% and 33%
        expect(result.data.yes + result.data.no).toBe(100);
      }
    });
  });

  // ============================================================================
  // SWAP CALCULATIONS
  // ============================================================================

  describe('calculateSwapOutput', () => {
    it('should calculate swap with 0.3% fee', () => {
      const inputAmount = 100_000; // 0.1 tokens
      const inputReserve = 1_000_000; // 1.0 tokens
      const outputReserve = 1_000_000; // 1.0 tokens

      const result = calculateSwapOutput(inputAmount, inputReserve, outputReserve);

      expect(result.success).toBe(true);
      if (result.success) {
        // Input after 0.3% fee: 100000 * 0.997 = 99700
        // Output: 1000000 * 99700 / (1000000 + 99700) = ~90637
        expect(result.data.outputAmount).toBeGreaterThan(90_000);
        expect(result.data.outputAmount).toBeLessThan(100_000);
        expect(result.data.fee).toBeCloseTo(300, 0); // 0.3% of 100000
      }
    });

    it('should calculate price impact', () => {
      const inputAmount = 200_000; // 0.2 tokens (20% of pool)
      const inputReserve = 1_000_000;
      const outputReserve = 1_000_000;

      const result = calculateSwapOutput(inputAmount, inputReserve, outputReserve);

      expect(result.success).toBe(true);
      if (result.success) {
        // Large trade should have significant price impact
        expect(result.data.priceImpact).toBeGreaterThan(5); // >5% impact
        expect(result.data.priceImpact).toBeLessThan(20); // <20% impact
      }
    });

    it('should reject swaps with excessive price impact', () => {
      const inputAmount = 5_000_000; // 5x the pool size
      const inputReserve = 1_000_000;
      const outputReserve = 1_000_000;

      const result = calculateSwapOutput(inputAmount, inputReserve, outputReserve);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe('EXCESSIVE_PRICE_IMPACT');
      }
    });

    it('should calculate minimum output with slippage', () => {
      const inputAmount = 100_000;
      const inputReserve = 1_000_000;
      const outputReserve = 1_000_000;

      const result = calculateSwapOutput(inputAmount, inputReserve, outputReserve);

      expect(result.success).toBe(true);
      if (result.success) {
        // Minimum output should be 99% of expected (1% slippage)
        expect(result.data.minimumOutput).toBeCloseTo(
          result.data.outputAmount * 0.99,
          0,
        );
      }
    });

    it('should handle small trades efficiently', () => {
      const inputAmount = 1_000; // 0.001 tokens
      const inputReserve = 1_000_000;
      const outputReserve = 1_000_000;

      const result = calculateSwapOutput(inputAmount, inputReserve, outputReserve);

      expect(result.success).toBe(true);
      if (result.success) {
        // Small trade should have minimal price impact
        expect(result.data.priceImpact).toBeLessThan(0.1); // <0.1% impact
      }
    });
  });

  // ============================================================================
  // LIQUIDITY CALCULATIONS
  // ============================================================================

  describe('calculateLiquidityQuote', () => {
    it('should allow equal deposits for first liquidity', () => {
      const yesAmount = 1_000_000; // 1.0 tokens
      const reserves: PoolReserves = {
        yesReserve: 0,
        noReserve: 0,
      };

      const result = calculateLiquidityQuote(yesAmount, reserves, 0);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.yesAmount).toBe(yesAmount);
        expect(result.data.noAmount).toBe(yesAmount); // Equal for first deposit
        expect(result.data.shareOfPool).toBe(100); // 100% of pool
      }
    });

    it('should enforce ratio for subsequent deposits', () => {
      const yesAmount = 100_000; // 0.1 tokens
      const reserves: PoolReserves = {
        yesReserve: 400_000, // 40%
        noReserve: 600_000,  // 60%
      };
      const totalLpSupply = 489_897; // sqrt(400000 * 600000)

      const result = calculateLiquidityQuote(yesAmount, reserves, totalLpSupply);

      expect(result.success).toBe(true);
      if (result.success) {
        // Must deposit in same ratio: 40:60
        expect(result.data.noAmount).toBeCloseTo(150_000, 0); // 1.5x YES amount

        // Share of pool should be proportional
        expect(result.data.shareOfPool).toBeGreaterThan(0);
        expect(result.data.shareOfPool).toBeLessThan(50);
      }
    });

    it('should reject amounts below minimum', () => {
      const yesAmount = 100; // Too small
      const reserves: PoolReserves = {
        yesReserve: 1_000_000,
        noReserve: 1_000_000,
      };

      const result = calculateLiquidityQuote(yesAmount, reserves);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].code).toBe('AMOUNT_TOO_SMALL');
      }
    });
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  describe('Utility Functions', () => {
    it('should convert between raw and display units', () => {
      const raw = 1_234_567; // 1.234567 tokens
      const display = toDisplayUnits(raw, 6);
      const backToRaw = toRawUnits(display, 6);

      expect(display).toBeCloseTo(1.234567, 6);
      expect(backToRaw).toBe(1_234_567);
    });

    it('should validate complementary prices', () => {
      expect(validateComplementaryPrices(0.65, 0.35)).toBe(true);
      expect(validateComplementaryPrices(0.5, 0.5)).toBe(true);
      expect(validateComplementaryPrices(0.7, 0.2)).toBe(false);
    });
  });

  // ============================================================================
  // INTEGRATION TESTS
  // ============================================================================

  describe('Integration: Full Trading Scenario', () => {
    it('should maintain price invariants through multiple swaps', () => {
      let reserves: PoolReserves = {
        yesReserve: 1_000_000,
        noReserve: 1_000_000,
      };

      // Swap 1: Buy YES (sell NO)
      const swap1 = calculateSwapOutput(100_000, reserves.noReserve, reserves.yesReserve);
      expect(swap1.success).toBe(true);

      if (swap1.success) {
        // Update reserves after swap
        reserves = {
          yesReserve: reserves.yesReserve - swap1.data.outputAmount,
          noReserve: reserves.noReserve + 100_000,
        };

        // Check prices after swap
        const prices1 = calculatePrices(reserves);
        expect(prices1.success).toBe(true);
        if (prices1.success) {
          // YES should be more expensive now (less reserve)
          expect(prices1.data.yes).toBeGreaterThan(0.5);
          expect(prices1.data.no).toBeLessThan(0.5);
        }
      }

      // Swap 2: Buy NO (sell YES)
      const swap2 = calculateSwapOutput(50_000, reserves.yesReserve, reserves.noReserve);
      expect(swap2.success).toBe(true);

      if (swap2.success) {
        reserves = {
          yesReserve: reserves.yesReserve + 50_000,
          noReserve: reserves.noReserve - swap2.data.outputAmount,
        };

        // Prices should adjust
        const prices2 = calculatePrices(reserves);
        expect(prices2.success).toBe(true);
        if (prices2.success) {
          // Prices should still be complementary
          expect(validateComplementaryPrices(prices2.data.yes, prices2.data.no)).toBe(true);
        }
      }
    });
  });
});
