# Data Integrity Engine

**Single Source of Truth for all calculations in VeriFi Protocol**

## Overview

The Data Integrity Engine centralizes all critical calculations (prices, probabilities, swaps, liquidity) to ensure consistency across the dApp. Before this engine, calculations were duplicated in 10+ components with inconsistent formulas.

## Problem It Solves

### Before Engine (Bugs Found):

```typescript
// ❌ WRONG in FeaturedMarketCard.tsx
const yesProbability = (noReserve / totalReserve) * 100;  // Inverted!
const noProbability = (yesReserve / totalReserve) * 100;

// ❌ WRONG in SwapTabContent.tsx
const priceImpact = (amountIn / reserve) * 100;  // Oversimplified

// ❌ WRONG in various components
const price = 0.5;  // Hardcoded, ignores pool state
```

### After Engine (Correct):

```typescript
// ✅ CORRECT using Engine
import { DataIntegrityEngine } from '@/lib/engine/data-integrity.engine';

const result = DataIntegrityEngine.calculatePrices(reserves);
if (result.success) {
  const { yes, no } = result.data;
  // Guaranteed correct formula
}
```

## Key Features

### 1. **Type Safety**
All inputs/outputs are strictly typed with TypeScript.

```typescript
interface PoolReserves {
  yesReserve: number;
  noReserve: number;
}

interface TokenPrice {
  yes: number; // 0-1 range
  no: number;  // 0-1 range (sum = 1)
}

type CalculationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };
```

### 2. **Validation**
All inputs are validated before calculation.

```typescript
const result = DataIntegrityEngine.calculateSwapOutput(
  -100,  // Invalid: negative
  1000,
  1000
);

// Returns:
// {
//   success: false,
//   errors: [{
//     field: 'inputAmount',
//     message: 'inputAmount must be a positive finite number',
//     code: 'INVALID_AMOUNT'
//   }]
// }
```

### 3. **Pure Functions**
No side effects - easy to test and debug.

```typescript
// Same inputs = same outputs (always)
const result1 = DataIntegrityEngine.calculatePrices(reserves);
const result2 = DataIntegrityEngine.calculatePrices(reserves);
// result1 === result2
```

### 4. **Documentation**
Every function includes formula explanation and examples.

## Usage Guide

### Calculate Prices from Reserves

```typescript
import { DataIntegrityEngine } from '@/lib/engine/data-integrity.engine';

// Pool has 650 YES and 350 NO tokens
const reserves = {
  yesReserve: 650_000, // 0.65 tokens (6 decimals)
  noReserve: 350_000,  // 0.35 tokens
};

const result = DataIntegrityEngine.calculatePrices(reserves);

if (result.success) {
  console.log(result.data.yes); // 0.65 APT
  console.log(result.data.no);  // 0.35 APT
} else {
  console.error(result.errors);
}
```

### Calculate Probabilities

```typescript
const result = DataIntegrityEngine.calculateProbabilities(reserves);

if (result.success) {
  console.log(result.data.yes); // 65%
  console.log(result.data.no);  // 35%
}
```

### Calculate Swap Output

```typescript
// User wants to sell 100 YES tokens
const swapResult = DataIntegrityEngine.calculateSwapOutput(
  100_000,      // Input: 0.1 YES tokens
  650_000,      // YES reserve
  350_000       // NO reserve
);

if (swapResult.success) {
  const { outputAmount, effectivePrice, priceImpact, fee } = swapResult.data;

  console.log(`You receive: ${outputAmount / 1_000_000} NO tokens`);
  console.log(`Effective price: ${effectivePrice} APT`);
  console.log(`Price impact: ${priceImpact.toFixed(2)}%`);
  console.log(`Fee: ${fee / 1_000_000} YES tokens`);
}
```

### Calculate Liquidity Quote

```typescript
// User wants to add 1.0 YES tokens
const liquidityResult = DataIntegrityEngine.calculateLiquidityQuote(
  1_000_000,  // YES amount
  reserves,   // Current reserves
  489_897     // Total LP supply
);

if (liquidityResult.success) {
  const { yesAmount, noAmount, lpTokens, shareOfPool } = liquidityResult.data;

  console.log(`Add: ${yesAmount / 1_000_000} YES + ${noAmount / 1_000_000} NO`);
  console.log(`Receive: ${lpTokens / 1_000_000} LP tokens`);
  console.log(`Share: ${shareOfPool.toFixed(2)}% of pool`);
}
```

## Migration Guide

### Before (Incorrect Code)

```typescript
// FeaturedMarketCard.tsx - OLD
const yesProbability = totalReserve > 0
  ? Math.round((noReserve / totalReserve) * 100)  // ❌ WRONG
  : 50;
```

### After (Using Engine)

```typescript
// FeaturedMarketCard.tsx - NEW
import { DataIntegrityEngine } from '@/lib/engine/data-integrity.engine';

const probabilityResult = DataIntegrityEngine.calculateProbabilities({
  yesReserve,
  noReserve,
});

const yesProbability = probabilityResult.success
  ? probabilityResult.data.yes
  : 50;
```

## Components to Update

### High Priority (Incorrect Calculations)

1. **FeaturedMarketCard.tsx** - Lines 29-40 (inverted probabilities)
2. **MarketCard.tsx** - If it has price calculations
3. **SwapTabContent.tsx** - Swap output calculation
4. **PoolTabContent.tsx** - Liquidity calculations
5. **TappPoolStats.tsx** - Price display

### Medium Priority (Inconsistent)

6. **ActionPanel.tsx** - Primary issuance (should stay 1:1)
7. **use-swap.ts** - Preview calculations
8. **use-liquidity.ts** - LP calculations

### Low Priority (Informational)

9. **PortfolioView.tsx** - P&L calculations
10. **MarketsHub.tsx** - Market stats

## Testing

Run the test suite:

```bash
npm test lib/engine/__tests__/data-integrity.engine.test.ts
```

Tests cover:
- Price calculations (balanced, imbalanced, edge cases)
- Probability conversions
- Swap outputs with fees
- Price impact validation
- Liquidity quotes
- Utility functions
- Integration scenarios

## Constants Reference

```typescript
DataIntegrityEngine.DECIMALS = {
  YES_NO_TOKEN: 6,
  APT: 8,
  LP_TOKEN: 6,
};

DataIntegrityEngine.FEES = {
  POOL_FEE_BPS: 30,    // 0.3%
  PROTOCOL_FEE_BPS: 20, // 0.2%
  TOTAL_FEE_BPS: 50,   // 0.5%
};

DataIntegrityEngine.LIMITS = {
  MIN_LIQUIDITY: 1000,       // 0.001 tokens
  MAX_PRICE_IMPACT: 50,      // 50%
  DEFAULT_SLIPPAGE_BPS: 100, // 1%
};
```

## Formulas Explained

### Constant Product Market Maker (CPMM)

```
Invariant: x * y = k (constant)

Price Formula:
- YES price = YES_reserve / (YES_reserve + NO_reserve)
- NO price = NO_reserve / (YES_reserve + NO_reserve)
- Invariant: YES_price + NO_price = 1.0

Swap Formula (with fee):
- Input after fee: dx' = dx * (1 - fee)
- Output: dy = y * dx' / (x + dx')
- New reserves: (x + dx, y - dy)
- Invariant maintained: (x + dx) * (y - dy) ≈ k

Price Impact:
- Price before = y / (x + y)
- Effective price = dy / dx
- Impact = |effective_price - price_before| / price_before * 100%
```

## Error Handling

```typescript
const result = DataIntegrityEngine.calculatePrices(invalidReserves);

if (!result.success) {
  result.errors.forEach(err => {
    console.log(`${err.field}: ${err.message} (${err.code})`);
  });
}
```

Common error codes:
- `INVALID_YES_RESERVE` - Invalid YES reserve value
- `INVALID_NO_RESERVE` - Invalid NO reserve value
- `NO_LIQUIDITY` - Pool has no liquidity
- `INVALID_AMOUNT` - Invalid amount parameter
- `EXCESSIVE_PRICE_IMPACT` - Swap impact >50%
- `AMOUNT_TOO_SMALL` - Amount below minimum
- `PRICE_SUM_MISMATCH` - Calculation error (should never happen)

## Performance

All calculations are O(1) with minimal allocations:
- Price calculation: <1ms
- Swap calculation: <1ms
- Liquidity calculation: <1ms

No async operations - all synchronous and fast.

## Future Enhancements

- [ ] Add historical price tracking
- [ ] Support custom fee tiers
- [ ] Add volume-weighted average price (VWAP)
- [ ] Support multi-hop swaps
- [ ] Add impermanent loss calculator
- [ ] Support concentrated liquidity (Uniswap v3 style)

---

**Remember:** Always use the engine for calculations. Never duplicate formulas in components.
