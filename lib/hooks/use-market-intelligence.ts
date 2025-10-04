/**
 * @file Market Intelligence Hook
 * @description Custom hook for AI-powered market intelligence
 */

import { useEffect } from 'react';
import { useIntelligenceStore } from '@/lib/stores';
import type { MarketMetrics } from '@/lib/types/database.types';

export function useMarketIntelligence(
  marketAddress?: string,
  metrics?: MarketMetrics
) {
  const intelligence = useIntelligenceStore(
    (state) => marketAddress ? state.getIntelligence(marketAddress) : undefined
  );
  const loadingMarkets = useIntelligenceStore((state) => state.loadingMarkets);
  const error = useIntelligenceStore((state) => state.error);
  const fetchMarketIntelligence = useIntelligenceStore(
    (state) => state.fetchMarketIntelligence
  );

  const isLoading = marketAddress
    ? loadingMarkets.has(marketAddress)
    : false;

  // Auto-fetch when market address and metrics are provided
  useEffect(() => {
    if (marketAddress && metrics && !intelligence && !isLoading) {
      fetchMarketIntelligence(marketAddress, metrics);
    }
  }, [marketAddress, metrics, intelligence, isLoading, fetchMarketIntelligence]);

  return {
    intelligence,
    isLoading,
    error,
    refetch: () =>
      marketAddress && metrics
        ? fetchMarketIntelligence(marketAddress, metrics)
        : Promise.resolve(),
  };
}
