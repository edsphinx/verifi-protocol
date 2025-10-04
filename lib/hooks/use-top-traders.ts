/**
 * @file Top Traders Hook
 * @description Custom hook for accessing top-performing traders
 */

import { useEffect } from 'react';
import { useAnalyticsStore } from '@/lib/stores';

export function useTopTraders(limit = 10) {
  const topTraders = useAnalyticsStore((state) => state.topTraders);
  const isLoading = useAnalyticsStore((state) => state.isLoadingTraders);
  const error = useAnalyticsStore((state) => state.error);
  const fetchTopTraders = useAnalyticsStore((state) => state.fetchTopTraders);
  const getTopTrader = useAnalyticsStore((state) => state.getTopTrader);

  // Auto-fetch on mount or when limit changes
  useEffect(() => {
    if (topTraders.length === 0 && !isLoading) {
      fetchTopTraders(limit);
    }
  }, [limit, topTraders.length, isLoading, fetchTopTraders]);

  return {
    topTraders,
    topTrader: getTopTrader(),
    isLoading,
    error,
    refetch: () => fetchTopTraders(limit),
  };
}
