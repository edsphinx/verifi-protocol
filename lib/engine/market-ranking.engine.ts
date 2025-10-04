/**
 * Market Ranking Engine
 *
 * Determines which markets should be "featured" based on multiple factors
 * designed to create FOMO and drive user engagement.
 *
 * Psychology Principles:
 * - Scarcity: Time running out
 * - Social Proof: Many people trading
 * - Authority: High liquidity = credible
 * - Urgency: Price swings = opportunity
 * - FOMO: Recent activity = don't miss out
 */

import type { PoolReserves } from './data-integrity.engine';
import { calculatePrices } from './data-integrity.engine';

// ============================================================================
// TYPES
// ============================================================================

export interface MarketMetrics {
  marketId: string;

  // Liquidity metrics
  totalLiquidity: number;       // Total tokens in pool
  liquidityGrowth24h: number;   // % change in 24h

  // Trading metrics
  volume24h: number;            // Trading volume last 24h
  volume7d: number;             // Trading volume last 7 days
  volumeGrowth24h: number;      // % change in 24h
  tradeCount24h: number;        // Number of trades
  uniqueTraders24h: number;     // Unique addresses trading

  // Price metrics
  yesPrice: number;             // Current YES price (0-1)
  priceChange24h: number;       // % change in 24h
  volatility24h: number;        // Price volatility (std dev)

  // Arbitrage metrics
  arbitrageOpportunity: number; // Size of arb opportunity (%)

  // Time metrics
  hoursUntilResolution: number; // Hours until market resolves

  // Social metrics
  commentCount: number;         // Number of comments/discussion
  shareCount: number;           // Times shared on social
}

export interface RankingFactors {
  liquidityScore: number;       // 0-100
  activityScore: number;        // 0-100
  volatilityScore: number;      // 0-100
  urgencyScore: number;         // 0-100
  socialScore: number;          // 0-100
  arbitrageScore: number;       // 0-100
  totalScore: number;           // Weighted average
  rank: number;                 // Final ranking position
}

export interface FeaturedMarket extends MarketMetrics, RankingFactors {
  featuredReason: string;       // Why this market is featured
  fomoTriggers: string[];       // List of FOMO triggers
  badge: FeaturedBadge;         // Badge to display
}

export type FeaturedBadge =
  | '🔥 HOT'           // High activity
  | '⚡ VOLATILE'      // Price swinging
  | '💰 HIGH LIQUIDITY' // Large pool
  | '⏰ CLOSING SOON'  // About to resolve
  | '📈 TRENDING'     // Growing fast
  | '🎯 ARB OPPORTUNITY' // Arbitrage available
  | '👥 POPULAR';     // Many traders

// ============================================================================
// SCORING WEIGHTS
// ============================================================================

const WEIGHTS = {
  LIQUIDITY: 0.25,    // 25% - Credibility
  ACTIVITY: 0.25,     // 25% - Social proof
  VOLATILITY: 0.15,   // 15% - Opportunity
  URGENCY: 0.15,      // 15% - Time pressure
  SOCIAL: 0.10,       // 10% - Community engagement
  ARBITRAGE: 0.10,    // 10% - Profit opportunity
} as const;

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculate liquidity score (0-100)
 *
 * Factors:
 * - Total liquidity (higher = better)
 * - Liquidity growth (growing = better)
 *
 * Psychology: High liquidity = credible, safe bet
 */
function calculateLiquidityScore(metrics: MarketMetrics): number {
  let score = 0;

  // Base score from total liquidity
  // 0 tokens = 0, 1000 tokens = 50, 10000+ tokens = 100
  const liquidityPoints = Math.min(
    (metrics.totalLiquidity / 10000) * 100,
    70
  );
  score += liquidityPoints;

  // Bonus for growth
  if (metrics.liquidityGrowth24h > 50) {
    score += 30; // Huge growth
  } else if (metrics.liquidityGrowth24h > 20) {
    score += 20; // Good growth
  } else if (metrics.liquidityGrowth24h > 5) {
    score += 10; // Some growth
  }

  return Math.min(score, 100);
}

/**
 * Calculate activity score (0-100)
 *
 * Factors:
 * - Volume (higher = better)
 * - Trade count (more = better)
 * - Unique traders (more = better)
 * - Volume growth (growing = better)
 *
 * Psychology: "Everyone is trading this" → FOMO
 */
function calculateActivityScore(metrics: MarketMetrics): number {
  let score = 0;

  // Volume score (40 points max)
  const volumePoints = Math.min((metrics.volume24h / 5000) * 40, 40);
  score += volumePoints;

  // Trade count (30 points max)
  const tradePoints = Math.min((metrics.tradeCount24h / 100) * 30, 30);
  score += tradePoints;

  // Unique traders (20 points max)
  const traderPoints = Math.min((metrics.uniqueTraders24h / 50) * 20, 20);
  score += traderPoints;

  // Growth bonus (10 points max)
  if (metrics.volumeGrowth24h > 100) {
    score += 10; // Doubling
  } else if (metrics.volumeGrowth24h > 50) {
    score += 7;
  } else if (metrics.volumeGrowth24h > 20) {
    score += 4;
  }

  return Math.min(score, 100);
}

/**
 * Calculate volatility score (0-100)
 *
 * Factors:
 * - Price change (larger swings = higher score)
 * - Volatility metric
 *
 * Psychology: "Price is moving fast" → Opportunity
 */
function calculateVolatilityScore(metrics: MarketMetrics): number {
  let score = 0;

  // Price change score (60 points max)
  const priceChange = Math.abs(metrics.priceChange24h);
  if (priceChange > 30) {
    score += 60; // Massive swing
  } else if (priceChange > 20) {
    score += 50;
  } else if (priceChange > 10) {
    score += 35;
  } else if (priceChange > 5) {
    score += 20;
  }

  // Volatility score (40 points max)
  const volatilityPoints = Math.min(metrics.volatility24h * 400, 40);
  score += volatilityPoints;

  return Math.min(score, 100);
}

/**
 * Calculate urgency score (0-100)
 *
 * Factors:
 * - Time until resolution (sooner = higher score)
 *
 * Psychology: "Last chance to trade" → Urgency
 */
function calculateUrgencyScore(metrics: MarketMetrics): number {
  const hours = metrics.hoursUntilResolution;

  if (hours < 0) return 0; // Already resolved

  if (hours < 6) return 100;   // <6 hours = max urgency
  if (hours < 12) return 90;   // <12 hours
  if (hours < 24) return 75;   // <1 day
  if (hours < 48) return 60;   // <2 days
  if (hours < 168) return 40;  // <1 week

  // Longer term markets get low urgency
  return Math.max(20 - (hours / 168) * 20, 0);
}

/**
 * Calculate social score (0-100)
 *
 * Factors:
 * - Comments/discussion
 * - Share count
 *
 * Psychology: "Trending topic" → Social proof
 */
function calculateSocialScore(metrics: MarketMetrics): number {
  let score = 0;

  // Comment score (60 points max)
  const commentPoints = Math.min((metrics.commentCount / 50) * 60, 60);
  score += commentPoints;

  // Share score (40 points max)
  const sharePoints = Math.min((metrics.shareCount / 20) * 40, 40);
  score += sharePoints;

  return Math.min(score, 100);
}

/**
 * Calculate arbitrage score (0-100)
 *
 * Factors:
 * - Size of arbitrage opportunity
 *
 * Psychology: "Free money available" → Profit motive
 */
function calculateArbitrageScore(metrics: MarketMetrics): number {
  const opportunity = metrics.arbitrageOpportunity;

  if (opportunity > 10) return 100;  // >10% = huge arb
  if (opportunity > 5) return 80;    // >5% = good arb
  if (opportunity > 3) return 60;    // >3% = decent arb
  if (opportunity > 1) return 40;    // >1% = small arb

  return 0;
}

// ============================================================================
// BADGE DETERMINATION
// ============================================================================

/**
 * Determine which badge to show based on scores
 */
function determineBadge(scores: RankingFactors): FeaturedBadge {
  // Priority order (first match wins)
  if (scores.urgencyScore > 85) return '⏰ CLOSING SOON';
  if (scores.arbitrageScore > 70) return '🎯 ARB OPPORTUNITY';
  if (scores.activityScore > 80) return '🔥 HOT';
  if (scores.volatilityScore > 75) return '⚡ VOLATILE';
  if (scores.liquidityScore > 85) return '💰 HIGH LIQUIDITY';
  if (scores.socialScore > 70) return '👥 POPULAR';

  // Default: trending if anything is happening
  if (scores.totalScore > 60) return '📈 TRENDING';

  return '🔥 HOT'; // Fallback
}

/**
 * Generate FOMO triggers based on metrics
 */
function generateFOMOTriggers(metrics: MarketMetrics, scores: RankingFactors): string[] {
  const triggers: string[] = [];

  // Activity triggers
  if (metrics.tradeCount24h > 50) {
    triggers.push(`${metrics.tradeCount24h} trades in 24h`);
  }
  if (metrics.uniqueTraders24h > 30) {
    triggers.push(`${metrics.uniqueTraders24h} traders active`);
  }

  // Volatility triggers
  if (Math.abs(metrics.priceChange24h) > 15) {
    const direction = metrics.priceChange24h > 0 ? '📈' : '📉';
    triggers.push(`${direction} ${Math.abs(metrics.priceChange24h).toFixed(1)}% price move`);
  }

  // Urgency triggers
  if (metrics.hoursUntilResolution < 24) {
    triggers.push(`⏰ Closes in ${Math.floor(metrics.hoursUntilResolution)}h`);
  }

  // Growth triggers
  if (metrics.volumeGrowth24h > 50) {
    triggers.push(`📊 Volume +${metrics.volumeGrowth24h.toFixed(0)}%`);
  }
  if (metrics.liquidityGrowth24h > 30) {
    triggers.push(`💧 Liquidity +${metrics.liquidityGrowth24h.toFixed(0)}%`);
  }

  // Arbitrage triggers
  if (metrics.arbitrageOpportunity > 3) {
    triggers.push(`💰 ${metrics.arbitrageOpportunity.toFixed(1)}% arb opportunity`);
  }

  // Social triggers
  if (metrics.commentCount > 30) {
    triggers.push(`💬 ${metrics.commentCount} comments`);
  }

  return triggers;
}

/**
 * Generate human-readable reason for featuring
 */
function generateFeaturedReason(
  metrics: MarketMetrics,
  scores: RankingFactors
): string {
  // Find the highest scoring factor
  const factorScores = [
    { name: 'high activity', score: scores.activityScore },
    { name: 'extreme volatility', score: scores.volatilityScore },
    { name: 'closing soon', score: scores.urgencyScore },
    { name: 'deep liquidity', score: scores.liquidityScore },
    { name: 'community buzz', score: scores.socialScore },
    { name: 'arbitrage opportunity', score: scores.arbitrageScore },
  ];

  const topFactor = factorScores.reduce((a, b) => (a.score > b.score ? a : b));

  // Add specific details
  if (topFactor.name === 'high activity') {
    return `${metrics.tradeCount24h} trades and ${metrics.uniqueTraders24h} active traders in 24h`;
  }
  if (topFactor.name === 'extreme volatility') {
    return `Price moved ${Math.abs(metrics.priceChange24h).toFixed(1)}% in 24h`;
  }
  if (topFactor.name === 'closing soon') {
    return `Resolves in ${Math.floor(metrics.hoursUntilResolution)} hours`;
  }
  if (topFactor.name === 'deep liquidity') {
    return `${metrics.totalLiquidity.toLocaleString()} tokens in liquidity pool`;
  }
  if (topFactor.name === 'community buzz') {
    return `${metrics.commentCount} comments and ${metrics.shareCount} shares`;
  }
  if (topFactor.name === 'arbitrage opportunity') {
    return `${metrics.arbitrageOpportunity.toFixed(1)}% arbitrage spread available`;
  }

  return 'High engagement and trading activity';
}

// ============================================================================
// MAIN RANKING FUNCTION
// ============================================================================

/**
 * Calculate ranking factors for a market
 */
export function rankMarket(metrics: MarketMetrics): FeaturedMarket {
  // Calculate individual scores
  const liquidityScore = calculateLiquidityScore(metrics);
  const activityScore = calculateActivityScore(metrics);
  const volatilityScore = calculateVolatilityScore(metrics);
  const urgencyScore = calculateUrgencyScore(metrics);
  const socialScore = calculateSocialScore(metrics);
  const arbitrageScore = calculateArbitrageScore(metrics);

  // Calculate weighted total
  const totalScore =
    liquidityScore * WEIGHTS.LIQUIDITY +
    activityScore * WEIGHTS.ACTIVITY +
    volatilityScore * WEIGHTS.VOLATILITY +
    urgencyScore * WEIGHTS.URGENCY +
    socialScore * WEIGHTS.SOCIAL +
    arbitrageScore * WEIGHTS.ARBITRAGE;

  const scores: RankingFactors = {
    liquidityScore,
    activityScore,
    volatilityScore,
    urgencyScore,
    socialScore,
    arbitrageScore,
    totalScore,
    rank: 0, // Will be set after sorting
  };

  // Determine badge and FOMO triggers
  const badge = determineBadge(scores);
  const fomoTriggers = generateFOMOTriggers(metrics, scores);
  const featuredReason = generateFeaturedReason(metrics, scores);

  return {
    ...metrics,
    ...scores,
    badge,
    fomoTriggers,
    featuredReason,
  };
}

/**
 * Rank multiple markets and return sorted by score
 */
export function rankMarkets(marketsList: MarketMetrics[]): FeaturedMarket[] {
  // Calculate rankings
  const rankedMarkets = marketsList.map(rankMarket);

  // Sort by total score (descending)
  rankedMarkets.sort((a, b) => b.totalScore - a.totalScore);

  // Assign rank positions
  rankedMarkets.forEach((market, index) => {
    market.rank = index + 1;
  });

  return rankedMarkets;
}

/**
 * Get top N featured markets
 */
export function getFeaturedMarkets(
  marketsList: MarketMetrics[],
  count: number = 3
): FeaturedMarket[] {
  const ranked = rankMarkets(marketsList);
  return ranked.slice(0, count);
}

/**
 * Check if a market should be featured
 * (Score threshold: 60+)
 */
export function shouldBeFeatured(metrics: MarketMetrics): boolean {
  const ranked = rankMarket(metrics);
  return ranked.totalScore >= 60;
}

// ============================================================================
// EXPORTS
// ============================================================================

export const MarketRankingEngine = {
  rankMarket,
  rankMarkets,
  getFeaturedMarkets,
  shouldBeFeatured,
  WEIGHTS,
} as const;

export default MarketRankingEngine;
