/**
 * @file Analytics Service
 * @description Business logic for protocol analytics and metrics
 */

import type {
  ProtocolMetrics,
  MarketMetrics,
  TraderMetrics,
} from '@/lib/types/database.types';

export class AnalyticsService {
  /**
   * Fetch protocol-wide metrics
   */
  static async getProtocolMetrics(): Promise<ProtocolMetrics> {
    const response = await fetch('/api/analytics/protocol', {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch protocol metrics');
    }

    return response.json();
  }

  /**
   * Fetch top markets by volume
   */
  static async getTopMarkets(limit = 10): Promise<{
    markets: MarketMetrics[];
    total: number;
    limit: number;
  }> {
    const response = await fetch(
      `/api/analytics/top-markets?limit=${limit}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch top markets');
    }

    return response.json();
  }

  /**
   * Fetch top traders leaderboard
   */
  static async getTopTraders(limit = 10): Promise<{
    traders: TraderMetrics[];
    total: number;
    limit: number;
  }> {
    const response = await fetch(
      `/api/analytics/top-traders?limit=${limit}`,
      {
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch top traders');
    }

    return response.json();
  }

  /**
   * Calculate percentage change
   */
  static calculateChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }

  /**
   * Format volume to human readable
   */
  static formatVolume(volume: number): string {
    if (volume >= 1_000_000) {
      return `${(volume / 1_000_000).toFixed(2)}M`;
    }
    if (volume >= 1_000) {
      return `${(volume / 1_000).toFixed(2)}K`;
    }
    return volume.toFixed(2);
  }

  /**
   * Format APT amount with proper decimals (8 decimals)
   */
  static formatAPT(amount: number): string {
    return (amount / 100_000_000).toFixed(4);
  }
}
