/**
 * Mock data generator for Tapp AMM pools
 * Used for demo/development purposes
 */

export interface PoolData {
  poolAddress: string;
  marketAddress: string;
  yesReserve: number;
  noReserve: number;
  totalLiquidity: number;
  volume24h: number;
  volume7d: number;
  currentFee: number; // in basis points (30 = 0.3%)
  tradingEnabled: boolean;
  createdAt: number;
  lastUpdated: number;
  positions: UserPosition[];
  priceHistory: PricePoint[];
}

export interface UserPosition {
  positionId: number;
  owner: string;
  lpTokens: number;
  yesAmount: number;
  noAmount: number;
  shareOfPool: number; // percentage
  valueUSD: number;
  createdAt: number;
}

export interface PricePoint {
  timestamp: number;
  yesPrice: number; // in NO tokens
  noPrice: number; // in YES tokens
  volume: number;
}

/**
 * Generate mock pool data for a given market
 */
export function generateMockPoolData(marketId: string): PoolData {
  // Use marketId as seed for consistent mock data
  const seed = parseInt(marketId.slice(2, 10), 16) || 12345;
  const random = seededRandom(seed);

  // Generate base reserves (10k - 100k range)
  const baseReserve = 10000 + random() * 90000;

  // YES/NO ratio (0.8 - 1.2 range for realistic market)
  const ratio = 0.8 + random() * 0.4;

  const yesReserve = baseReserve;
  const noReserve = baseReserve * ratio;
  const totalLiquidity = yesReserve + noReserve;

  return {
    poolAddress: `0x${marketId.slice(2, 10)}${seed.toString(16).padStart(8, "0")}pool`,
    marketAddress: marketId,
    yesReserve,
    noReserve,
    totalLiquidity,
    volume24h: totalLiquidity * 0.15, // 15% daily volume
    volume7d: totalLiquidity * 0.8, // 80% weekly volume
    currentFee: 30, // 0.3% base fee
    tradingEnabled: true,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    lastUpdated: Date.now(),
    positions: generateMockPositions(marketId, totalLiquidity, random),
    priceHistory: generateMockPriceHistory(ratio, random),
  };
}

/**
 * Generate mock user positions
 */
function generateMockPositions(
  marketId: string,
  totalLiquidity: number,
  random: () => number,
): UserPosition[] {
  const positionCount = 1 + Math.floor(random() * 3); // 1-3 positions
  const positions: UserPosition[] = [];

  for (let i = 0; i < positionCount; i++) {
    const lpTokens = totalLiquidity * 0.05 + random() * totalLiquidity * 0.1; // 5-15% of pool
    const yesAmount = lpTokens * 0.5;
    const noAmount = lpTokens * 0.5;
    const shareOfPool = (lpTokens / totalLiquidity) * 100;

    positions.push({
      positionId: i,
      owner: "0xUSER", // Would be actual user address
      lpTokens,
      yesAmount,
      noAmount,
      shareOfPool,
      valueUSD: lpTokens, // 1:1 for simplicity in mock
      createdAt: Date.now() - Math.floor(random() * 7 * 24 * 60 * 60 * 1000),
    });
  }

  return positions;
}

/**
 * Generate mock price history for charts
 */
function generateMockPriceHistory(
  currentRatio: number,
  random: () => number,
): PricePoint[] {
  const points: PricePoint[] = [];
  const now = Date.now();
  const hoursToGenerate = 24 * 7; // 7 days

  let ratio = currentRatio * 0.9; // Start slightly lower

  for (let i = hoursToGenerate; i >= 0; i--) {
    const timestamp = now - i * 60 * 60 * 1000;

    // Random walk
    ratio += (random() - 0.5) * 0.05;
    ratio = Math.max(0.7, Math.min(1.3, ratio)); // Keep in realistic range

    const yesPrice = ratio;
    const noPrice = 1 / ratio;
    const volume = 500 + random() * 2000;

    points.push({
      timestamp,
      yesPrice,
      noPrice,
      volume,
    });
  }

  return points;
}

/**
 * Seeded random number generator for consistent mock data
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

/**
 * Format number as currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format number with commas
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${formatNumber(value, decimals)}%`;
}

/**
 * Calculate pool price (YES in terms of NO)
 */
export function calculatePoolPrice(
  yesReserve: number,
  noReserve: number,
): number {
  return noReserve / yesReserve;
}

/**
 * Calculate APY based on fees and volume
 */
export function calculateAPY(
  volume24h: number,
  totalLiquidity: number,
  feeRate: number = 0.003,
): number {
  const dailyFees = volume24h * feeRate;
  const dailyReturn = dailyFees / totalLiquidity;
  const apy = dailyReturn * 365 * 100;
  return apy;
}
