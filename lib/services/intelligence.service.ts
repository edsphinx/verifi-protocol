/**
 * @file Intelligence Service
 * @description AI-powered market intelligence and insights
 */

import type { MarketMetrics } from '@/lib/types/database.types';

export interface MarketIntelligence {
  marketAddress: string;
  sentimentScore: number; // -100 to +100
  confidenceLevel: number; // 0-100
  prediction: {
    outcome: 'YES' | 'NO' | 'UNCERTAIN';
    confidence: number; // 0-100
  };
  insights: SmartInsight[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  opportunityScore: number; // 0-100
}

export interface SmartInsight {
  type: 'ARBITRAGE' | 'PRICE_ANOMALY' | 'VOLUME_SPIKE' | 'CONSENSUS_SHIFT';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
  actionable: boolean;
  suggestedAction?: string;
}

export class IntelligenceService {
  /**
   * Generate market intelligence using AI/ML techniques
   */
  static async getMarketIntelligence(
    marketAddress: string,
    marketMetrics: MarketMetrics
  ): Promise<MarketIntelligence> {
    // Calculate sentiment from supply distribution
    const sentimentScore = this.calculateSentiment(marketMetrics);

    // Predict outcome based on current data
    const prediction = this.predictOutcome(marketMetrics);

    // Generate actionable insights
    const insights = this.generateInsights(marketMetrics);

    // Calculate risk level
    const riskLevel = this.calculateRiskLevel(marketMetrics);

    // Calculate opportunity score
    const opportunityScore = this.calculateOpportunityScore(marketMetrics);

    // Calculate confidence level
    const confidenceLevel = this.calculateConfidenceLevel(marketMetrics);

    return {
      marketAddress,
      sentimentScore,
      confidenceLevel,
      prediction,
      insights,
      riskLevel,
      opportunityScore,
    };
  }

  /**
   * Calculate market sentiment from supply distribution
   * Returns: -100 (extreme bearish) to +100 (extreme bullish)
   */
  private static calculateSentiment(metrics: MarketMetrics): number {
    const totalSupply = metrics.yesSupply + metrics.noSupply;
    if (totalSupply === 0) return 0;

    const yesRatio = metrics.yesSupply / totalSupply;

    // Convert to -100 to +100 scale
    return (yesRatio - 0.5) * 200;
  }

  /**
   * Predict market outcome using simple ML heuristics
   */
  private static predictOutcome(metrics: MarketMetrics): {
    outcome: 'YES' | 'NO' | 'UNCERTAIN';
    confidence: number;
  } {
    const totalSupply = metrics.yesSupply + metrics.noSupply;
    if (totalSupply === 0) {
      return { outcome: 'UNCERTAIN', confidence: 0 };
    }

    const yesRatio = metrics.yesSupply / totalSupply;

    // Strong consensus threshold
    if (yesRatio > 0.65) {
      return {
        outcome: 'YES',
        confidence: Math.min((yesRatio - 0.5) * 200, 100),
      };
    }

    if (yesRatio < 0.35) {
      return {
        outcome: 'NO',
        confidence: Math.min((0.5 - yesRatio) * 200, 100),
      };
    }

    return { outcome: 'UNCERTAIN', confidence: 0 };
  }

  /**
   * Generate actionable insights
   */
  private static generateInsights(metrics: MarketMetrics): SmartInsight[] {
    const insights: SmartInsight[] = [];

    // Detect arbitrage opportunities
    const totalSupply = metrics.yesSupply + metrics.noSupply;
    if (totalSupply > 0) {
      const yesRatio = metrics.yesSupply / totalSupply;
      const priceRatio = metrics.yesPrice / 1_000_000; // Convert from basis points

      const discrepancy = Math.abs(yesRatio - priceRatio);

      if (discrepancy > 0.1) {
        insights.push({
          type: 'ARBITRAGE',
          severity: 'WARNING',
          message: `Price (${(priceRatio * 100).toFixed(1)}%) doesn't match supply ratio (${(yesRatio * 100).toFixed(1)}%) - potential arbitrage opportunity!`,
          actionable: true,
          suggestedAction:
            yesRatio > priceRatio
              ? 'Consider buying YES shares'
              : 'Consider buying NO shares',
        });
      }
    }

    // Detect high volume spike
    if (metrics.trades24h > metrics.totalTrades * 0.3) {
      insights.push({
        type: 'VOLUME_SPIKE',
        severity: 'INFO',
        message: `High trading activity: ${metrics.trades24h} trades in last 24h (${((metrics.trades24h / metrics.totalTrades) * 100).toFixed(1)}% of total)`,
        actionable: false,
      });
    }

    // Detect low liquidity
    if (totalSupply < 1000) {
      insights.push({
        type: 'PRICE_ANOMALY',
        severity: 'WARNING',
        message: 'Low liquidity - prices may be volatile',
        actionable: true,
        suggestedAction: 'Use limit orders and trade carefully',
      });
    }

    // Detect strong consensus
    const totalSupplyRatio =
      totalSupply > 0 ? metrics.yesSupply / totalSupply : 0;
    if (totalSupplyRatio > 0.8 || totalSupplyRatio < 0.2) {
      insights.push({
        type: 'CONSENSUS_SHIFT',
        severity: 'INFO',
        message: `Strong ${totalSupplyRatio > 0.8 ? 'YES' : 'NO'} consensus (${(totalSupplyRatio * 100).toFixed(1)}%)`,
        actionable: true,
        suggestedAction: 'Consider if market is overconfident',
      });
    }

    return insights;
  }

  /**
   * Calculate risk level
   */
  private static calculateRiskLevel(
    metrics: MarketMetrics
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    const totalSupply = metrics.yesSupply + metrics.noSupply;

    // Low liquidity = high risk
    if (totalSupply < 1000) return 'HIGH';

    // Low trading activity = medium risk
    if (metrics.trades24h < 5) return 'MEDIUM';

    return 'LOW';
  }

  /**
   * Calculate opportunity score (0-100)
   */
  private static calculateOpportunityScore(metrics: MarketMetrics): number {
    let score = 50; // Start neutral

    // Higher volume = more opportunity
    if (metrics.volume24h > 100) score += 20;
    else if (metrics.volume24h > 50) score += 10;

    // More traders = more opportunity
    if (metrics.uniqueTraders > 20) score += 15;
    else if (metrics.uniqueTraders > 10) score += 10;

    // Recent activity = more opportunity
    if (metrics.trades24h > 10) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Calculate confidence level in the data
   */
  private static calculateConfidenceLevel(metrics: MarketMetrics): number {
    let confidence = 0;

    // More supply = higher confidence
    const totalSupply = metrics.yesSupply + metrics.noSupply;
    if (totalSupply > 10000) confidence += 40;
    else if (totalSupply > 5000) confidence += 30;
    else if (totalSupply > 1000) confidence += 20;
    else confidence += 10;

    // More traders = higher confidence
    if (metrics.uniqueTraders > 50) confidence += 30;
    else if (metrics.uniqueTraders > 20) confidence += 20;
    else if (metrics.uniqueTraders > 10) confidence += 10;

    // More trades = higher confidence
    if (metrics.totalTrades > 100) confidence += 30;
    else if (metrics.totalTrades > 50) confidence += 20;
    else if (metrics.totalTrades > 20) confidence += 10;

    return Math.min(confidence, 100);
  }

  /**
   * Generate proactive alerts for a user's portfolio
   */
  static async generatePortfolioAlerts(
    userAddress: string
  ): Promise<ProactiveAlert[]> {
    // TODO: Implement portfolio-based alerts
    // - Position up/down significantly
    // - Market approaching resolution
    // - New arbitrage opportunities in user's markets
    return [];
  }
}

export interface ProactiveAlert {
  id: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'OPPORTUNITY' | 'RISK' | 'ACHIEVEMENT' | 'UPDATE';
  title: string;
  description: string;
  actions: {
    label: string;
    type: 'NAVIGATE' | 'TRADE' | 'DISMISS';
    href?: string;
  }[];
  createdAt: Date;
  expiresAt?: Date;
}
